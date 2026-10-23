import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getOrCreateAccount } from './accountService';
import { parseStatement } from '../utils/statement';
import { sumMoney, addMoney } from '../utils/finance';
import { recurringOccurrences } from '../utils/recurrence';
import { compatibleRow } from '../utils/reconciliation';

async function hash(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export async function importStatement(uid, text, { format = 'csv', accountType = 'GENERAL', reconciliations = [] } = {}) {
  if (!['GENERAL', 'VR', 'VA'].includes(accountType)) throw new Error('Selecione uma conta de destino válida.');
  const parsed = parseStatement(text, format);
  if (parsed.errors.length) throw new Error(parsed.errors.join('\n'));
  if (!Array.isArray(reconciliations) || reconciliations.length > 10 || (reconciliations.length && accountType !== 'GENERAL')) throw new Error('Concilie até 10 vencimentos por importação, somente na conta corrente.');
  const choices = new Map(), selectedDues = new Set();
  for (const choice of reconciliations) {
    if (!Number.isInteger(choice.rowIndex) || !parsed.rows[choice.rowIndex] || choices.has(choice.rowIndex) || typeof choice.subscriptionId !== 'string' || !choice.subscriptionId || choice.subscriptionId.includes('/')) throw new Error('Seleção de conciliação inválida.');
    const key = JSON.stringify([choice.subscriptionId, choice.dueDate]);
    if (selectedDues.has(key)) throw new Error('Um vencimento não pode ser associado a duas linhas do extrato.');
    selectedDues.add(key); choices.set(choice.rowIndex, choice);
  }
  const account = await getOrCreateAccount(uid, accountType);
  const accountRef = doc(db, 'users', uid, 'accounts', account.id);
  const occurrences = new Map();
  const candidates = await Promise.all(parsed.rows.map(async (row, rowIndex) => {
    const canonical = JSON.stringify([row.date, row.description, row.type, row.amount]);
    const occurrence = occurrences.get(canonical) || 0;
    occurrences.set(canonical, occurrence + 1);
    // Preserva os marcadores CSV antigos da conta GENERAL.
    const identity = format === 'ofx'
      ? JSON.stringify(['ofx', account.id, parsed.source.identity, row.fitId])
      : (accountType === 'GENERAL' ? '' : account.id + ':') + canonical + ':' + occurrence;
    return {
      row, choice: choices.get(rowIndex), fingerprint: await hash(canonical), transactionRef: doc(collection(db, 'users', uid, 'transactions')),
      markerRef: doc(db, 'users', uid, 'importRows', await hash(identity))
    };
  }));
  const items = [...new Map(candidates.map(item => [item.markerRef.id, item])).values()];
  if (items.length !== candidates.length && reconciliations.length) throw new Error('Remova as linhas OFX repetidas antes de conciliar este arquivo.');
  const subRefs = [...new Set(reconciliations.map(item => item.subscriptionId))].map(id => doc(db, 'users', uid, 'subscriptions', id));
  return runTransaction(db, async transaction => {
    const [balance, ...markers] = await Promise.all([transaction.get(accountRef), ...items.map(item => transaction.get(item.markerRef))]);
    if (!balance.exists()) throw new Error('Conta não encontrada.');
    for (let index = 0; index < items.length; index++) {
      if (format === 'ofx' && markers[index].exists() && markers[index].data().fingerprint !== items[index].fingerprint) {
        throw new Error('Uma transação OFX já importada mudou. Concilie o lançamento antes de importar.');
      }
    }
    const subSnaps = await Promise.all(subRefs.map(ref => transaction.get(ref)));
    const subs = new Map(subSnaps.map(snap => [snap.id, snap.exists() ? snap.data() : null]));
    const existingIds = new Set();
    const plans = items.map((item, index) => {
      const marker = markers[index].exists() ? markers[index].data() : null;
      if (!item.choice) return { ...item, marker, insert: !marker, targetId: item.transactionRef.id };
      const sub = subs.get(item.choice.subscriptionId);
      const occurrence = sub && recurringOccurrences(sub, item.choice.dueDate, item.choice.dueDate)[0];
      if (!occurrence || !compatibleRow(item.row, occurrence)) throw new Error('Um vencimento mudou ou não corresponde ao valor e à data do extrato. Revise a conciliação.');
      if (marker && occurrence.payment && marker.transactionId !== occurrence.payment.transactionId) throw new Error('O extrato e o vencimento já têm pagamentos diferentes. Revise os lançamentos no histórico antes de conciliar.');
      const targetId = marker?.transactionId || occurrence.payment?.transactionId || item.transactionRef.id;
      const insert = !marker && !occurrence.payment;
      if (!insert) existingIds.add(targetId);
      return { ...item, marker, occurrence, targetId, insert };
    });
    const existing = new Map((await Promise.all([...existingIds].map(id => transaction.get(doc(db, 'users', uid, 'transactions', id))))).map(snap => [snap.id, snap.exists() ? snap.data() : null]));
    const changedSubs = new Set();
    for (const plan of plans.filter(item => item.choice)) {
      const { choice, occurrence, row, targetId } = plan;
      const previous = existing.get(targetId);
      if (!plan.insert) {
        if (!previous || previous.accountId !== account.id || previous.accountType !== 'GENERAL' || previous.status !== 'COMPLETED' || previous.type !== 'EXPENSE' || previous.amount !== row.amount || !compatibleRow({ ...previous, date: previous.transactionDate }, occurrence)) throw new Error('Pagamento anterior incompatível ou excluído. Atualize a conciliação.');
        if (occurrence.payment) {
          if (previous.kind !== 'RECURRING_PAYMENT' || previous.subscriptionId !== choice.subscriptionId || previous.dueDate !== choice.dueDate) throw new Error('Vínculo do pagamento anterior inconsistente.');
        } else if (previous.kind !== 'REGULAR' || !['csv', 'ofx', 'pdf'].includes(previous.importFormat)) throw new Error('O lançamento já foi conciliado ou não veio de um extrato.');
      }
      if (!occurrence.payment) {
        const sub = subs.get(choice.subscriptionId);
        sub.payments = { ...sub.payments, [choice.dueDate]: { transactionId: targetId, paidDate: previous?.transactionDate || row.date, amount: row.amount, source: 'IMPORT' } };
        changedSubs.add(choice.subscriptionId);
      }
    }
    const pending = plans.filter(item => item.insert);
    const delta = sumMoney(pending.map(item => item.row.type === 'INCOME' ? item.row.amount : -item.row.amount));
    if (pending.length) transaction.update(accountRef, { balance: addMoney(balance.data().balance, delta) });
    for (const id of changedSubs) transaction.update(doc(db, 'users', uid, 'subscriptions', id), { payments: subs.get(id).payments });
    for (const item of plans) {
      const row = item.row;
      const link = item.choice ? { kind: 'RECURRING_PAYMENT', subscriptionId: item.choice.subscriptionId, dueDate: item.choice.dueDate } : {};
      if (item.insert) transaction.set(item.transactionRef, {
        accountId: account.id, accountType, importFormat: format, kind: 'REGULAR', type: row.type,
        amount: row.amount, category: row.category, transactionDate: row.date,
        ...link,
        description: '[' + row.category + '] ' + row.description, status: 'COMPLETED', createdAt: serverTimestamp()
      });
      if (item.choice && !item.insert && !item.occurrence.payment) transaction.update(doc(db, 'users', uid, 'transactions', item.targetId), link);
      if (!item.marker) transaction.set(item.markerRef, { transactionId: item.targetId, fingerprint: item.fingerprint, createdAt: serverTimestamp() });
    }
    const skipped = parsed.rows.length - pending.length;
    return { status: 'success', insertedCount: pending.length, skippedCount: skipped, reconciledCount: reconciliations.length, balanceDelta: delta, message: pending.length + ' novas transações; ' + skipped + ' registros já existentes aproveitados ou ignorados; ' + reconciliations.length + ' vencimentos conciliados. Impacto no saldo: R$ ' + delta.toFixed(2) + '.' };
  });
}

// Compatibilidade com chamadas e marcadores CSV existentes.
export function importCSV(uid, text) { return importStatement(uid, text); }
