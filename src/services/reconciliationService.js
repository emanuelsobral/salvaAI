import { collection, doc, getDocs, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { recurringOccurrences } from '../utils/recurrence';
import { compatibleRow } from '../utils/reconciliation';
import { validDate } from '../utils/finance';

export async function getReconciliationCandidates(uid, occurrence) {
  const snap = await getDocs(collection(db, 'users', uid, 'transactions'));
  return snap.docs.map(item => ({ id: item.id, ...item.data() })).filter(item =>
    item.kind === 'REGULAR' && ['csv', 'ofx', 'pdf'].includes(item.importFormat) && item.status === 'COMPLETED'
    && item.accountType === 'GENERAL' && compatibleRow({ ...item, date: item.transactionDate }, occurrence));
}

export async function reconcileTransaction(uid, transactionId, subscriptionId, dueDate) {
  validDate(dueDate);
  const txnRef = doc(db, 'users', uid, 'transactions', transactionId);
  const subRef = doc(db, 'users', uid, 'subscriptions', subscriptionId);
  return runTransaction(db, async transaction => {
    const txnSnap = await transaction.get(txnRef), subSnap = await transaction.get(subRef);
    if (!txnSnap.exists() || !subSnap.exists()) throw new Error('Lançamento ou conta recorrente não encontrado. Atualize a lista.');
    const txn = txnSnap.data(), sub = subSnap.data();
    const occurrence = recurringOccurrences(sub, dueDate, dueDate)[0];
    if (occurrence?.payment?.transactionId === transactionId && txn.kind === 'RECURRING_PAYMENT' && txn.subscriptionId === subscriptionId && txn.dueDate === dueDate) return { message: 'Este lançamento já está vinculado ao vencimento.' };
    if (!occurrence || occurrence.payment) throw new Error('O vencimento já foi pago ou cancelado. Atualize a lista.');
    if (txn.kind !== 'REGULAR' || !['csv', 'ofx', 'pdf'].includes(txn.importFormat) || txn.status !== 'COMPLETED' || txn.accountType !== 'GENERAL' || !compatibleRow({ ...txn, date: txn.transactionDate }, occurrence)) {
      throw new Error('O lançamento não é compatível ou já foi conciliado.');
    }
    transaction.update(subRef, { payments: { ...sub.payments, [dueDate]: { transactionId, paidDate: txn.transactionDate, amount: txn.amount, source: 'IMPORT' } } });
    transaction.update(txnRef, { kind: 'RECURRING_PAYMENT', subscriptionId, dueDate });
    return { message: 'Pagamento vinculado. O saldo não foi alterado.' };
  });
}

export async function undoReconciliation(uid, transactionId) {
  const txnRef = doc(db, 'users', uid, 'transactions', transactionId);
  return runTransaction(db, async transaction => {
    const txnSnap = await transaction.get(txnRef);
    if (!txnSnap.exists()) throw new Error('Lançamento não encontrado.');
    const txn = txnSnap.data();
    if (txn.kind === 'REGULAR' && ['csv', 'ofx', 'pdf'].includes(txn.importFormat)) return;
    if (txn.kind !== 'RECURRING_PAYMENT' || !['csv', 'ofx', 'pdf'].includes(txn.importFormat)) throw new Error('Este pagamento não foi conciliado de um extrato.');
    const subRef = doc(db, 'users', uid, 'subscriptions', txn.subscriptionId);
    const subSnap = await transaction.get(subRef);
    if (!subSnap.exists() || subSnap.data().payments?.[txn.dueDate]?.transactionId !== transactionId) throw new Error('Vínculo inconsistente. Nenhuma alteração foi feita.');
    const payments = { ...subSnap.data().payments };
    delete payments[txn.dueDate];
    transaction.update(subRef, { payments });
    transaction.update(txnRef, { kind: 'REGULAR', subscriptionId: null, dueDate: null });
  });
}
