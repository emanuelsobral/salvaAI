/**
 * Subscription Service - Gerencia assinaturas/despesas recorrentes.
 * Substitui routes_subs.py (61 linhas Python).
 * 
 * Firestore Path: users/{uid}/subscriptions/{docId}
 * 
 * Documento:
 * {
 *   name: string,       // "Netflix", "Academia", etc.
 *   amount: number,     // Valor por vencimento (mensal nas assinaturas antigas)
 *   dueDay: number,     // Dia do vencimento (1-31)
 *   category: string,   // "Streaming", "Saúde", etc.
 *   isActive: boolean,  // true = ativa
 *   createdAt: Timestamp
 * }
 */

import {
  collection,
  doc,
  getDocs,
  runTransaction,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { financialOperation } from './financialOperation';
import { positiveMoney, requiredText, localDate, validDate, addMoney, sumMoney } from '../utils/finance';
import { validateSchedule, recurringOccurrences, isRecurringAccount, prepareRecurringRevision } from '../utils/recurrence';
import { getOrCreateAccount } from './accountService';

const subsRef = (uid) => collection(db, 'users', uid, 'subscriptions');

/**
 * Cria uma nova assinatura ativa.
 * Equivale a POST /api/subs/create
 */
export async function createSubscription(uid, payload) {
  const name = requiredText(payload.name, 'Nome');
  const amount = positiveMoney(payload.amount);
  const { category } = payload;
  const schedule = payload.frequency ? {
    billingMode: 'ACCOUNT', frequency: payload.frequency, startDate: payload.start_date,
    endDate: payload.end_date || null, payments: {}
  } : null;
  if (schedule) validateSchedule(schedule);
  const due_day = schedule ? Number(schedule.startDate.slice(-2)) : payload.due_day;
  if (!Number.isInteger(due_day) || due_day < 1 || due_day > 31) throw new Error('Dia de vencimento inválido.');
  
  const ref = doc(subsRef(uid));
  return financialOperation(uid, payload.operation_id, { kind: 'SUBSCRIPTION', name, amount, due_day, category: category || 'ASSINATURAS', schedule }, async transaction => {
  transaction.set(ref, {
    name,
    amount,
    ...(schedule || {}),
    startMonth: localDate().slice(0, 7),
    dueDay: due_day,
    category: category || 'Outros',
    isActive: true,
    createdAt: serverTimestamp()
  });
  
  return {
    status: 'success',
    message: schedule ? 'Conta recorrente cadastrada. Registre cada pagamento após pagar a conta.' : 'Assinatura cadastrada. Os pagamentos são registrados manualmente na fatura.'
  };
  });
}

/**
 * Lista todas as assinaturas ativas.
 * Equivale a GET /api/subs/
 */
export async function getActiveSubscriptions(uid) {
  const q = query(subsRef(uid), where('isActive', '==', true));
  const snap = await getDocs(q);
  
  return {
    status: 'success',
    subs: snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      due_day: d.data().dueDay
    }))
  };
}

export async function getSubscriptions(uid, { requireFresh = false } = {}) {
  const snap = await getDocs(subsRef(uid));
  if (requireFresh && snap.metadata?.fromCache) throw new Error('Não foi possível confirmar as contas no servidor. Confira a conexão e tente novamente.');
  return { subs: snap.docs.map(item => ({ id: item.id, ...item.data() })) };
}

export async function payRecurringBill(uid, subId, dueDate, paidDate = localDate(), operationId, expectedAmount) {
  validDate(dueDate);
  validDate(paidDate);
  if (paidDate > localDate()) throw new Error('A data do pagamento não pode estar no futuro.');
  const account = await getOrCreateAccount(uid, 'GENERAL');
  const accountRef = doc(db, 'users', uid, 'accounts', account.id);
  const subRef = doc(subsRef(uid), subId);
  const paymentRef = doc(collection(db, 'users', uid, 'transactions'));
  return financialOperation(uid, operationId, { kind: 'RECURRING_PAYMENT', subId, dueDate, paidDate, expectedAmount: expectedAmount ?? null }, async transaction => {
    const subSnap = await transaction.get(subRef);
    const accountSnap = await transaction.get(accountRef);
    if (!subSnap.exists() || !accountSnap.exists()) throw new Error('Conta recorrente ou conta corrente não encontrada.');
    const sub = subSnap.data();
    const occurrence = recurringOccurrences(sub, dueDate, dueDate)[0];
    if (!occurrence) throw new Error('Este vencimento não pertence à conta recorrente ou foi cancelado.');
    if (occurrence.payment) return { status: 'success', transaction_id: occurrence.payment.transactionId, message: 'Este vencimento já foi pago.' };
    const amount = positiveMoney(occurrence.amount);
    if (expectedAmount !== undefined && positiveMoney(expectedAmount) !== amount) throw new Error('O valor deste vencimento mudou. Atualize a lista antes de confirmar o pagamento.');
    const balance = addMoney(accountSnap.data().balance, -amount);
    transaction.update(accountRef, { balance });
    transaction.update(subRef, { payments: { ...sub.payments, [dueDate]: { transactionId: paymentRef.id, paidDate, amount } } });
    transaction.set(paymentRef, {
      kind: 'RECURRING_PAYMENT', subscriptionId: subId, dueDate, accountId: account.id,
      accountType: 'GENERAL', type: 'EXPENSE', status: 'COMPLETED', amount,
      transactionDate: paidDate, category: sub.category || 'OUTROS', description: sub.name,
      createdAt: serverTimestamp()
    });
    return { status: 'success', transaction_id: paymentRef.id, message: 'Pagamento registrado na conta corrente.' };
  });
}

export async function editRecurringSubscription(uid, subId, payload) {
  const ref = doc(subsRef(uid), subId);
  const input = {
    effective_from: validDate(payload.effective_from), start_date: validDate(payload.start_date),
    end_date: payload.end_date || null, frequency: payload.frequency,
    amount: positiveMoney(payload.amount), expected_revision: payload.expected_revision, keep_calendar: payload.keep_calendar === true
  };
  return financialOperation(uid, payload.operation_id, { kind: 'RECURRING_EDIT', subId, ...input }, async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error('Conta recorrente não encontrada.');
    const sub = snap.data();
    const revision = prepareRecurringRevision(sub, input);
    transaction.update(ref, { revisions: [...(sub.revisions || []), revision], updatedAt: serverTimestamp() });
    return { status: 'success', message: 'Alteração agendada. Os vencimentos anteriores e pagamentos foram preservados.' };
  });
}

/**
 * Deleta (desativa) uma assinatura.
 * Equivale a DELETE /api/subs/{sub_id}
 */
export async function deleteSubscription(uid, subId) {
  const ref = doc(db, 'users', uid, 'subscriptions', subId);
  await runTransaction(db, async transaction => {
    const current = await transaction.get(ref);
    if (!current.exists()) throw new Error('Conta recorrente não encontrada.');
    if (!current.data().isActive) return;
    transaction.update(ref, { isActive: false, cancelledOn: localDate(), cancelledAt: serverTimestamp() });
  });
  
  return {
    status: 'success',
    message: 'Recorrência encerrada. O histórico dos pagamentos foi preservado.'
  };
}

/**
 * Retorna o total mensal de assinaturas ativas.
 */
export async function getActiveSubscriptionsTotal(uid, now = new Date()) {
  const q = query(subsRef(uid), where('isActive', '==', true));
  const snap = await getDocs(q);
  
  const subs = snap.docs.map(item => ({ id: item.id, ...item.data() }));
  const from = localDate(new Date(now.getFullYear(), now.getMonth(), 1, 12));
  const to = localDate(new Date(now.getFullYear(), now.getMonth() + 1, 0, 12));
  const total = sumMoney(subs.flatMap(sub => isRecurringAccount(sub)
    ? recurringOccurrences(sub, from, to).map(item => item.amount)
    : (!sub.startMonth || sub.startMonth <= from.slice(0, 7)) ? [sub.amount || 0] : []));
  
  return { total, subs };
}
