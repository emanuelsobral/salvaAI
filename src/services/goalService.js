import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getOrCreateAccount } from './accountService';
import { financialOperation } from './financialOperation';
import { positiveMoney, requiredText, localDate, addMoney } from '../utils/finance';

export async function createGoal(uid, payload) {
  const name = requiredText(payload.name, 'Nome');
  const target = positiveMoney(payload.target_value);
  const ref = doc(collection(db, 'users', uid, 'accounts'));
  return financialOperation(uid, payload.operation_id, { kind: 'GOAL', name, target }, async transaction => {
    transaction.set(ref, { name, type: 'CAIXINHA', balance: 0, goalAmount: target, createdAt: serverTimestamp() });
    return { status: 'success' };
  });
}

export async function depositToGoal(uid, goalId, value, operationId) {
  const amount = positiveMoney(value);
  const general = await getOrCreateAccount(uid, 'GENERAL');
  const generalRef = doc(db, 'users', uid, 'accounts', general.id);
  const goalRef = doc(db, 'users', uid, 'accounts', goalId);
  const sourceRef = doc(collection(db, 'users', uid, 'transactions'));
  const destinationRef = doc(collection(db, 'users', uid, 'transactions'));
  return financialOperation(uid, operationId, { kind: 'TRANSFER', goalId, amount }, async (transaction, transferId) => {
    const [source, destination] = await Promise.all([transaction.get(generalRef), transaction.get(goalRef)]);
    if (!source.exists() || !destination.exists() || destination.data().type !== 'CAIXINHA') throw new Error('Conta ou caixinha inválida.');
    if (source.data().balance < amount) throw new Error('Saldo livre insuficiente para o aporte.');
    transaction.update(generalRef, { balance: addMoney(source.data().balance, -amount) });
    transaction.update(goalRef, { balance: addMoney(destination.data().balance, amount) });
    const shared = { amount, kind: 'TRANSFER', transferId, transactionDate: localDate(), status: 'COMPLETED', createdAt: serverTimestamp() };
    transaction.set(sourceRef, { ...shared, accountId: general.id, accountType: 'GENERAL', type: 'EXPENSE', peerTransactionId: destinationRef.id, description: '[CAIXINHA] Transferência p/ ' + destination.data().name });
    transaction.set(destinationRef, { ...shared, accountId: goalId, accountType: 'CAIXINHA', type: 'INCOME', peerTransactionId: sourceRef.id, description: '[CAIXINHA] Depósito recebido da Conta Corrente' });
    return { status: 'success', message: 'Dinheiro aplicado com sucesso!' };
  });
}
