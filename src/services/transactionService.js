/**
 * Transaction Service - Gerencia transações normais (Entrada/Saída).
 * Substitui routes_transactions.py (146 linhas Python).
 * 
 * Firestore Path: users/{uid}/transactions/{docId}
 * 
 * Documento:
 * {
 *   accountId: string,        // Referência à conta de origem/destino
 *   type: string,             // "INCOME" | "EXPENSE"
 *   amount: number,           // Valor absoluto (sempre positivo)
 *   transactionDate: string,  // "YYYY-MM-DD"
 *   description: string,      // "[CATEGORIA] Descrição"
 *   status: string,           // "COMPLETED" | "PENDING"
 *   accountType: string,      // "GENERAL" | "VR" | "VA" | "CAIXINHA" (denormalizado para queries)
 *   createdAt: Timestamp
 * }
 */

import {
  collection,
  doc,
  getDocs,
  runTransaction,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { cleanDescription, normalizePaymentMethod, PAYMENT_METHODS } from '../utils/transactionDetails';
import { getHistoryCategories } from '../utils/categories';
import { digest, normalizeMerchant } from '../utils/transactionIdentity';
import { createScheduledSeries } from './scheduleService';
import { getOrCreateAccount } from './accountService';
import { financialOperation } from './financialOperation';
import { positiveMoney, addMoney, requiredText, validDate, localDate, isTransfer, isInvoicePayment } from '../utils/finance';

const txnsRef = (uid) => collection(db, 'users', uid, 'transactions');

/**
 * Cria uma transação e atualiza o saldo da conta de origem.
 * Equivale a POST /api/transactions/
 */
export async function createTransaction(uid, payload) {
  const { transaction_type, date, source_account } = payload;
  const amount = positiveMoney(payload.amount);
  const description = requiredText(payload.description);
  const category = requiredText(payload.category, 'Categoria');
  validDate(date);
  if (!['INCOME', 'EXPENSE'].includes(transaction_type)) throw new Error('Tipo de transação inválido.');
  if (!['GENERAL', 'VR', 'VA'].includes(source_account)) throw new Error('Conta inválida.');
  if (payload.recurrence_count !== undefined && (!Number.isInteger(Number(payload.recurrence_count)) || Number(payload.recurrence_count) < 1 || Number(payload.recurrence_count) > 60)) throw new Error('Informe de 1 a 60 ocorrências.');
  if (Number(payload.recurrence_count) > 1) return createScheduledSeries(uid, payload);
  const status = payload.scheduled || date > localDate() ? 'PENDING' : 'COMPLETED';
  const account = await getOrCreateAccount(uid, source_account);
  const delta = transaction_type === 'INCOME' ? amount : -amount;
  const txnRef = doc(txnsRef(uid));
  const accountRef = doc(db, 'users', uid, 'accounts', account.id);
  return financialOperation(uid, payload.operation_id, { kind: 'TRANSACTION', transaction_type, amount, date, source_account, category, description, status }, async transaction => {
    const current = await transaction.get(accountRef);
    if (!current.exists()) throw new Error('Conta não encontrada.');
    const newBalance = addMoney(current.data().balance, delta);
    if (status === 'COMPLETED') transaction.update(accountRef, { balance: newBalance });
    transaction.set(txnRef, {
      accountId: account.id, accountType: source_account, type: transaction_type,
      amount, transactionDate: date, category, description: `[${category}] ${description}`,
      kind: 'REGULAR', status, createdAt: serverTimestamp()
    });
    return { status: 'success', transaction_id: txnRef.id, applied_account: account.name, new_balance: status === 'COMPLETED' ? newBalance : current.data().balance };
  });
}

/**
 * Lista todas as transações (normais + cartão) ordenadas por data desc.
 * Equivale a GET /api/transactions/all
 */
export async function getAllTransactions(uid) {
  // Transações normais
  const normalSnap = await getDocs(
    query(txnsRef(uid), orderBy('transactionDate', 'desc'))
  );
  
  // Transações de cartão
  const cardSnap = await getDocs(
    query(collection(db, 'users', uid, 'cardTransactions'), orderBy('purchaseDate', 'desc'))
  );
  
  const data = [];
  
  for (const d of normalSnap.docs) {
    const t = d.data();
    data.push({
      id: `txn_${d.id}`,
      dt: t.transactionDate,
      date: formatDateBR(t.transactionDate),
      description: t.description,
      category: t.category || /^\[([^\]]+)\]/.exec(t.description || '')?.[1] || 'OUTROS',
      title: cleanDescription(t.description),
      paymentMethod: normalizePaymentMethod(t.paymentMethod, t.originalDescription || t.description, t.accountType),
      revision: t.revision || 0,
      editable: t.status !== 'CANCELLED' && !isTransfer(t) && !isInvoicePayment(t),
      status: t.status, recurrenceId: t.recurrenceId || null, kind: t.kind || 'REGULAR',
      amount: t.amount,
      type: t.type,
      account_type: t.accountType || 'GENERAL',
      account_name: t.accountType === 'VR' ? 'VR Refeição' :
                     t.accountType === 'VA' ? 'VA Alimentação' :
                     t.accountType === 'CAIXINHA' ? 'Caixinha' : 'Conta Corrente'
    });
  }
  
  for (const d of cardSnap.docs) {
    const c = d.data();
    data.push({
      id: `ctxn_${d.id}`,
      dt: c.purchaseDate,
      date: formatDateBR(c.purchaseDate),
      description: c.description,
      category: c.category || /^\[([^\]]+)\]/.exec(c.description || '')?.[1] || 'OUTROS',
      title: cleanDescription(c.description),
      paymentMethod: normalizePaymentMethod(c.paymentMethod, c.description, 'CARTAO'),
      revision: c.revision || 0,
      editable: c.status === 'PENDING',
      status: c.status,
      amount: c.amount,
      type: 'EXPENSE',
      account_type: 'CARTAO',
      account_name: 'Fatura do Cartão'
    });
  }
  
  // Ordena por data desc
  data.sort((a, b) => (b.dt > a.dt ? 1 : -1));
  
  return { status: 'success', transactions: data };
}

/**
 * Deleta uma transação e estorna o saldo.
 * Equivale a DELETE /api/transactions/{txn_id}
 */
export async function editTransaction(uid, txnId, payload) {
  const description = requiredText(payload.description);
  const amount = positiveMoney(payload.amount);
  const category = requiredText(payload.category, 'Categoria');
  const paymentMethod = payload.paymentMethod;
  if (!Object.hasOwn(PAYMENT_METHODS, paymentMethod)) throw new Error('Meio de pagamento inválido.');
  if (!/^(txn_|ctxn_)[a-zA-Z0-9_-]+$/.test(txnId)) throw new Error('Movimentação inválida.');
  const card = txnId.startsWith('ctxn_');
  const ref = doc(db, 'users', uid, card ? 'cardTransactions' : 'transactions', txnId.replace(/^(txn_|ctxn_)/, ''));
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Movimentação não encontrada.');
    const current = snapshot.data();
    if (current.status === 'CANCELLED') throw new Error('Uma ocorrência cancelada não pode ser editada.');
    if (!getHistoryCategories(card ? 'EXPENSE' : current.type).some(item => item.value === category)) throw new Error('Selecione uma categoria correspondente ao tipo da movimentação.');
    if ((current.revision || 0) !== payload.revision) throw new Error('Esta movimentação foi alterada. Recarregue o histórico antes de editar novamente.');
    if (isTransfer(current) || isInvoicePayment(current)) throw new Error('Estorne esta operação vinculada antes de alterá-la.');
    if (card && current.status !== 'PENDING') throw new Error('Estorne o pagamento antes de editar uma parcela paga.');
    if (!card && current.status === 'COMPLETED') {
      const accountRef = doc(db, 'users', uid, 'accounts', current.accountId);
      const account = await transaction.get(accountRef);
      if (!account.exists()) throw new Error('Conta não encontrada.');
      const difference = addMoney(amount, -positiveMoney(current.amount));
      transaction.update(accountRef, { balance: addMoney(account.data().balance, current.type === 'INCOME' ? difference : -difference) });
    }
    transaction.update(ref, { description, amount, category, paymentMethod, originalDescription: current.originalDescription || current.description, revision: (current.revision || 0) + 1, updatedAt: serverTimestamp() });
    if (payload.rememberCategory) {
      const key = await digest((card ? 'EXPENSE' : current.type) + ':' + normalizeMerchant(current.originalDescription || current.description));
      transaction.set(doc(db, 'users', uid, 'categoryPreferences', key), { type: card ? 'EXPENSE' : current.type, category, updatedAt: serverTimestamp() });
    }
    return { status: 'success' };
  });
}

export async function deleteTransaction(uid, txnId) {
  const card = txnId.startsWith('ctxn_');
  const realId = txnId.replace(/^(ctxn_|txn_)/, '');
  const ref = doc(db, 'users', uid, card ? 'cardTransactions' : 'transactions', realId);
  return runTransaction(db, async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return { status: 'success', message: 'Esta movimentação já foi excluída.' };
    const txn = snap.data();
    if (card) {
      if (txn.status !== 'PENDING') throw new Error('Estorne o pagamento da fatura antes de excluir uma parcela paga.');
      transaction.delete(ref);
      return { status: 'success', message: 'Parcela pendente excluída.' };
    }
    if (isTransfer(txn) && !txn.peerTransactionId) throw new Error('Transferência antiga sem vínculo entre as contas. Concilie os dois lados antes do estorno.');
    if (isInvoicePayment(txn) && !txn.invoiceKey) throw new Error('Pagamento antigo sem vínculo com a fatura. Concilie os registros antes do estorno.');
    const accountRef = doc(db, 'users', uid, 'accounts', txn.accountId);
    const account = await transaction.get(accountRef);
    if (!account.exists()) throw new Error('Conta não encontrada.');
    const amount = positiveMoney(txn.amount);
    let peerRef, peer, peerAccountRef, peerAccount, invoiceRef, invoice, paidCards = [];
    if (isTransfer(txn)) {
      peerRef = doc(txnsRef(uid), txn.peerTransactionId);
      peer = await transaction.get(peerRef);
      if (!peer.exists() || peer.data().peerTransactionId !== realId || peer.data().amount !== amount || peer.data().type === txn.type || peer.data().accountId === txn.accountId) {
        throw new Error('Transferência inconsistente. Nenhum saldo foi alterado.');
      }
      peerAccountRef = doc(db, 'users', uid, 'accounts', peer.data().accountId);
      peerAccount = await transaction.get(peerAccountRef);
      if (!peerAccount.exists()) throw new Error('Conta da transferência não encontrada.');
      const destination = txn.type === 'INCOME' ? account : peerAccount;
      if (destination.data().balance < amount) throw new Error('A caixinha não possui saldo suficiente para estornar o aporte.');
    }
    if (isInvoicePayment(txn)) {
      invoiceRef = doc(db, 'users', uid, 'invoices', txn.invoiceKey);
      invoice = await transaction.get(invoiceRef);
      paidCards = await Promise.all((txn.cardTransactionIds || []).map(id => transaction.get(doc(db, 'users', uid, 'cardTransactions', id))));
      if (!invoice.exists() || paidCards.some(item => !item.exists() || item.data().paymentId !== realId) || (txn.subscriptionIds || []).some(id => invoice.data().subscriptionPayments?.[id] !== realId)) {
        throw new Error('Vínculos da fatura inconsistentes. Nenhum saldo foi alterado.');
      }
    }
    if (txn.status === 'COMPLETED') transaction.update(accountRef, { balance: addMoney(account.data().balance, txn.type === 'INCOME' ? -amount : amount) });
    if (peer) {
      transaction.update(peerAccountRef, { balance: addMoney(peerAccount.data().balance, peer.data().type === 'INCOME' ? -amount : amount) });
      transaction.delete(peerRef);
    }
    if (invoice) {
      const subscriptionPayments = { ...invoice.data().subscriptionPayments };
      for (const id of txn.subscriptionIds || []) delete subscriptionPayments[id];
      transaction.set(invoiceRef, { ...invoice.data(), subscriptionPayments, updatedAt: serverTimestamp() });
      for (const item of paidCards) transaction.update(item.ref, { status: 'PENDING', paymentId: null });
    }
    transaction.delete(ref);
    return { status: 'success', message: 'Movimentação estornada integralmente e excluída.' };
  });
}

/**
 * Busca as N transações mais recentes (para o dashboard).
 */
export async function getRecentTransactions(uid, limitCount = 6) {
  const normalSnap = await getDocs(
    query(txnsRef(uid), orderBy('transactionDate', 'desc'), limit(limitCount))
  );
  
  const cardSnap = await getDocs(
    query(
      collection(db, 'users', uid, 'cardTransactions'),
      orderBy('purchaseDate', 'desc'),
      limit(limitCount)
    )
  );
  
  const all = [];
  
  for (const d of normalSnap.docs) {
    const t = d.data();
    all.push({
      id: `txn_${d.id}`,
      type: t.type,
      amount: t.amount,
      dt: t.transactionDate,
      date: formatDateBR(t.transactionDate),
      description: t.description,
      account_type: t.accountType || 'GENERAL'
    });
  }
  
  for (const d of cardSnap.docs) {
    const c = d.data();
    all.push({
      id: `ctxn_${d.id}`,
      type: 'EXPENSE',
      amount: c.amount,
      dt: c.purchaseDate,
      date: formatDateBR(c.purchaseDate),
      description: c.description,
      account_type: 'CARTAO'
    });
  }
  
  all.sort((a, b) => (b.dt > a.dt ? 1 : -1));
  return all.slice(0, limitCount);
}

/**
 * Formata data YYYY-MM-DD para DD/MM/YYYY.
 */
function formatDateBR(dateStr) {
  if (!dateStr) return '--/--/----';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}
