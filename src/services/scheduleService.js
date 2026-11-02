import { collection, doc, getDocs, query, where, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { financialOperation } from './financialOperation';
import { getOrCreateAccount } from './accountService';
import { positiveMoney, requiredText, validDate, localDate, addMoney } from '../utils/finance';

export function monthlyDates(start, count) {
  validDate(start);
  if (!Number.isInteger(count) || count < 2 || count > 60) throw new Error('Informe de 2 a 60 ocorrências mensais.');
  const [year, month, day] = start.split('-').map(Number);
  return Array.from({ length: count }, (_, index) => {
    const first = new Date(year, month - 1 + index, 1, 12);
    return localDate(new Date(first.getFullYear(), first.getMonth(), Math.min(day, new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()), 12));
  });
}

export async function createScheduledSeries(uid, payload) {
  const amount = positiveMoney(payload.amount), description = requiredText(payload.description), category = requiredText(payload.category);
  if (!['INCOME', 'EXPENSE'].includes(payload.transaction_type) || !['GENERAL', 'VR', 'VA'].includes(payload.source_account)) throw new Error('Tipo ou conta inválidos.');
  const dates = monthlyDates(payload.date, Number(payload.recurrence_count));
  const account = await getOrCreateAccount(uid, payload.source_account);
  const seriesRef = doc(collection(db, 'users', uid, 'recurrences'));
  return financialOperation(uid, payload.operation_id, { kind: 'RECURRENCE', amount, description, category, dates, accountId: account.id, type: payload.transaction_type }, async (transaction, operationId) => {
    const current = await transaction.get(doc(db, 'users', uid, 'accounts', account.id));
    if (!current.exists()) throw new Error('Conta não encontrada.');
    transaction.set(seriesRef, { amount, description, category, type: payload.transaction_type, accountId: account.id, accountType: payload.source_account, startDate: dates[0], count: dates.length, isActive: true, createdAt: serverTimestamp() });
    dates.forEach((date, index) => transaction.set(doc(db, 'users', uid, 'transactions', operationId + '_' + index), { accountId: account.id, accountType: payload.source_account, type: payload.transaction_type, amount, description, category, kind: 'REGULAR', status: 'PENDING', transactionDate: date, recurrenceId: seriesRef.id, occurrenceIndex: index, createdAt: serverTimestamp() }));
    return { status: 'success', recurrence_id: seriesRef.id, count: dates.length };
  });
}

export async function completeScheduled(uid, transactionId) {
  if (!transactionId.startsWith('txn_')) throw new Error('Somente movimentações agendadas podem ser confirmadas aqui.');
  const ref = doc(db, 'users', uid, 'transactions', transactionId.slice(4));
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Movimentação não encontrada.');
    const row = snapshot.data();
    if (row.status === 'COMPLETED') return;
    if (row.status !== 'PENDING' || row.kind !== 'REGULAR') throw new Error('Esta movimentação não pode ser confirmada.');
    const accountRef = doc(db, 'users', uid, 'accounts', row.accountId), account = await transaction.get(accountRef);
    if (!account.exists()) throw new Error('Conta não encontrada.');
    transaction.update(accountRef, { balance: addMoney(account.data().balance, row.type === 'INCOME' ? positiveMoney(row.amount) : -positiveMoney(row.amount)) });
    transaction.update(ref, { status: 'COMPLETED', completedAt: serverTimestamp(), updatedAt: serverTimestamp(), revision: (row.revision || 0) + 1 });
  });
}

export async function cancelRecurrence(uid, recurrenceId) {
  const ref = doc(db, 'users', uid, 'recurrences', recurrenceId);
  const candidates = await getDocs(query(collection(db, 'users', uid, 'transactions'), where('recurrenceId', '==', recurrenceId)));
  return runTransaction(db, async transaction => {
    const series = await transaction.get(ref);
    if (!series.exists()) throw new Error('Recorrência não encontrada.');
    const rows = await Promise.all(candidates.docs.map(row => transaction.get(row.ref)));
    transaction.update(ref, { isActive: false, updatedAt: serverTimestamp() });
    for (const row of rows) if (row.exists() && row.data().status === 'PENDING' && row.data().transactionDate >= localDate()) transaction.update(row.ref, { status: 'CANCELLED', updatedAt: serverTimestamp(), revision: (row.data().revision || 0) + 1 });
  });
}
