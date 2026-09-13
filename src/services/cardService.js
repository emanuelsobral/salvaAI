import { collection, doc, getDocs, runTransaction, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getOrCreateAccount } from './accountService';
import { financialOperation } from './financialOperation';
import { addMoney, positiveMoney, requiredText, validDate, localDate, splitInstallments, sumMoney, invoiceKey, unpaidSubscriptions, legacyInvoiceKey } from '../utils/finance';

const cardTxnsRef = uid => collection(db, 'users', uid, 'cardTransactions');
const creditCardsRef = uid => collection(db, 'users', uid, 'creditCards');

async function getOrCreateCard(uid) {
  const snap = await getDocs(creditCardsRef(uid));
  if (!snap.empty) {
    if (snap.docs.length > 1) throw new Error('Há mais de um cartão. Selecione/concilie o cartão principal antes de lançar.');
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  const ref = doc(creditCardsRef(uid), 'PRIMARY');
  return runTransaction(db, async transaction => {
    const current = await transaction.get(ref);
    if (current.exists()) return { id: ref.id, ...current.data() };
    const data = { name: 'Cartão Principal', closingDay: 5, dueDay: 10, creditLimit: 5000 };
    transaction.set(ref, { ...data, createdAt: serverTimestamp() });
    return { id: ref.id, ...data };
  });
}

export async function createCardTransaction(uid, payload) {
  const amount = positiveMoney(payload.amount_total);
  const values = splitInstallments(amount, payload.installments);
  const date = validDate(payload.purchase_date);
  const description = requiredText(payload.description);
  const category = requiredText(payload.category, 'Categoria');
  const card = await getOrCreateCard(uid);
  const [year, month] = date.split('-').map(Number);
  const firstMonth = month + (payload.current_month ? 0 : 1);
  const refs = values.map(() => doc(cardTxnsRef(uid)));
  return financialOperation(uid, payload.operation_id, { kind: 'CARD_PURCHASE', amount, count: values.length, date, description, category, firstMonth }, async (transaction, purchaseId) => {
    for (let i = 0; i < values.length; i++) {
      const target = firstMonth + i;
      transaction.set(refs[i], {
        creditCardId: card.id, purchaseId, category,
        description: '[' + category + '] ' + description + (values.length > 1 ? ' (' + (i + 1) + '/' + values.length + ')' : ''),
        amount: values[i], purchaseDate: date,
        invoiceMonth: ((target - 1) % 12) + 1, invoiceYear: year + Math.floor((target - 1) / 12),
        installmentNumber: i + 1, totalInstallments: values.length,
        status: 'PENDING', createdAt: serverTimestamp()
      });
    }
    return { status: 'success', message: 'Compra registrada em ' + values.length + ' parcela(s), total de R$ ' + amount.toFixed(2) + '.' };
  });
}

// Cada assinatura tem quitação por competência. Compras posteriores ainda podem ser pagas.
// Leituras da query selecionam candidatos; a transação relê os documentos antes de debitar.
export async function payInvoice(uid, month, year, operationId) {
  const key = invoiceKey(month, year);
  const [cards, subscriptions, history] = await Promise.all([
    getDocs(query(cardTxnsRef(uid), where('status', '==', 'PENDING'))),
    getDocs(query(collection(db, 'users', uid, 'subscriptions'), where('isActive', '==', true))),
    getDocs(query(collection(db, 'users', uid, 'transactions'), where('type', '==', 'EXPENSE')))
  ]);
  if (history.docs.some(item => legacyInvoiceKey(item.data()) === key)) {
    throw new Error('Há pagamento antigo nesta competência sem vínculo com as assinaturas. Concilie-o antes de pagar novamente.');
  }
  const candidates = cards.docs.filter(item => item.data().invoiceMonth === month && item.data().invoiceYear === year);
  if (candidates.length + subscriptions.docs.length > 400) throw new Error('Fatura muito grande para uma operação. Divida a conciliação antes de pagar.');
  const account = await getOrCreateAccount(uid, 'GENERAL');
  const accountRef = doc(db, 'users', uid, 'accounts', account.id);
  const invoiceRef = doc(db, 'users', uid, 'invoices', key);
  const paymentRef = doc(collection(db, 'users', uid, 'transactions'));
  return financialOperation(uid, operationId, { kind: 'PAY_INVOICE', key }, async transaction => {
    const [accountSnap, invoiceSnap, ...items] = await Promise.all([
      transaction.get(accountRef), transaction.get(invoiceRef),
      ...candidates.map(item => transaction.get(item.ref)),
      ...subscriptions.docs.map(item => transaction.get(item.ref))
    ]);
    if (!accountSnap.exists()) throw new Error('Conta não encontrada.');
    const invoice = invoiceSnap.exists() ? invoiceSnap.data() : {};
    const pending = items.slice(0, candidates.length).filter(item => item.exists() && item.data().status === 'PENDING' && item.data().invoiceMonth === month && item.data().invoiceYear === year);
    const subs = unpaidSubscriptions(items.slice(candidates.length).filter(item => item.exists()).map(item => ({ id: item.id, ...item.data() })), invoice, month, year);
    const amount = sumMoney([...pending.map(item => positiveMoney(item.data().amount)), ...subs.map(item => positiveMoney(item.amount))]);
    if (!amount) return { status: 'success', message: 'Não há itens pendentes nesta fatura.' };
    const subscriptionPayments = { ...invoice.subscriptionPayments };
    for (const sub of subs) subscriptionPayments[sub.id] = paymentRef.id;
    transaction.update(accountRef, { balance: addMoney(accountSnap.data().balance, -amount) });
    transaction.set(paymentRef, {
      accountId: account.id, accountType: 'GENERAL', type: 'EXPENSE', kind: 'INVOICE_PAYMENT',
      amount, transactionDate: localDate(), invoiceKey: key,
      description: '[CARTAO] Fatura Paga ' + String(month).padStart(2, '0') + '/' + year,
      cardTransactionIds: pending.map(item => item.id), subscriptionIds: subs.map(sub => sub.id),
      subscriptionCharges: subs.map(sub => ({ id: sub.id, name: sub.name, category: sub.category || 'ASSINATURAS', amount: sub.amount })),
      status: 'COMPLETED', createdAt: serverTimestamp()
    });
    transaction.set(invoiceRef, { ...invoice, subscriptionPayments, updatedAt: serverTimestamp() });
    for (const item of pending) transaction.update(item.ref, { status: 'PAID', paymentId: paymentRef.id });
    return { status: 'success', message: 'Pagamento de R$ ' + amount.toFixed(2) + ' registrado e debitado do saldo livre.' };
  });
}

export async function getInvoiceDetails(uid) {
  const [cards, subscriptions, invoiceSnap] = await Promise.all([
    getDocs(query(cardTxnsRef(uid), where('status', '==', 'PENDING'))),
    getDocs(query(collection(db, 'users', uid, 'subscriptions'), where('isActive', '==', true))),
    getDocs(collection(db, 'users', uid, 'invoices'))
  ]);
  const invoices = Object.fromEntries(invoiceSnap.docs.map(item => [item.id, item.data()]));
  const subs = subscriptions.docs.map(item => ({ id: item.id, ...item.data() }));
  const groups = {};
  for (const item of cards.docs) {
    const data = item.data();
    const key = invoiceKey(data.invoiceMonth, data.invoiceYear);
    (groups[key] ||= []).push({ id: item.id, date: data.purchaseDate.split('-').reverse().join('/'), description: data.description, amount: data.amount, type: 'INSTALLMENT' });
  }
  const today = new Date();
  groups[invoiceKey(today.getMonth() + 1, today.getFullYear())] ||= [];
  return { status: 'success', invoices: Object.keys(groups).sort().map(key => {
    const [year, month] = key.split('-').map(Number);
    const items = [...groups[key], ...unpaidSubscriptions(subs, invoices[key], month, year).map(sub => ({
      id: 'sub_' + sub.id, date: 'Dia ' + sub.dueDay, description: '[ASSINATURAS] ' + sub.name, amount: sub.amount, type: 'SUBSCRIPTION'
    }))];
    return { month_label: String(month).padStart(2, '0') + '/' + year, total: sumMoney(items.map(item => item.amount)), items };
  }) };
}

export async function getCurrentInvoiceTotal(uid) {
  const now = new Date();
  const month = now.getMonth() + 1, year = now.getFullYear();
  const result = await getInvoiceDetails(uid);
  return { total: result.invoices.find(item => item.month_label === String(month).padStart(2, '0') + '/' + year)?.total || 0, month, year };
}
