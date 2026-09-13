import { addMoney, sumMoney, invoiceKey, localDate, unpaidSubscriptions, isTransfer, isInvoicePayment, legacyInvoiceKey } from './finance.js';
import { MESES_NOMES } from './formatters.js';

export function calculateDashboard({ accounts, transactions, cards, subscriptions, invoices }, now = new Date()) {
  const currentKey = invoiceKey(now.getMonth() + 1, now.getFullYear());
  const balances = { GENERAL: 0, VR: 0, VA: 0, CAIXINHA: 0 };
  for (const account of accounts) if (account.type in balances) balances[account.type] = addMoney(balances[account.type], account.balance || 0);
  const ledger = Object.fromEntries(invoices.map(item => [item.id, item]));
  const currentSubs = unpaidSubscriptions(subscriptions, ledger[currentKey], now.getMonth() + 1, now.getFullYear());
  const pendingCards = cards.filter(item => item.status === 'PENDING');
  const keyOfCard = item => invoiceKey(item.invoiceMonth, item.invoiceYear);
  const currentInvoice = sumMoney([
    ...pendingCards.filter(item => keyOfCard(item) === currentKey).map(item => item.amount),
    ...currentSubs.map(item => item.amount)
  ]);
  const overdue = sumMoney(pendingCards.filter(item => keyOfCard(item) < currentKey).map(item => item.amount));
  const pendingRegular = transactions.filter(item => item.status === 'PENDING' && item.type === 'EXPENSE' && (item.accountType || 'GENERAL') === 'GENERAL' && !isTransfer(item) && !isInvoicePayment(item));
  const pendingDue = sumMoney(pendingRegular.filter(item => item.transactionDate?.slice(0, 7) <= currentKey).map(item => item.amount));
  const available = sumMoney([balances.GENERAL, -overdue, -currentInvoice, -pendingDue]);

  // Competência do mês: compras pelo mês de compra; pagamento da fatura não é novo consumo.
  const inMonth = item => item.transactionDate?.slice(0, 7) === currentKey;
  const regular = transactions.filter(item => !isTransfer(item) && !isInvoicePayment(item) && item.status === 'COMPLETED' && inMonth(item));
  const income = sumMoney(regular.filter(item => item.type === 'INCOME').map(item => item.amount));
  const charges = transactions.filter(item => item.kind === 'INVOICE_PAYMENT' && item.invoiceKey === currentKey && item.status === 'COMPLETED').flatMap(item => item.subscriptionCharges || []);
  const expenses = [
    ...regular.filter(item => item.type === 'EXPENSE'),
    ...cards.filter(item => item.purchaseDate?.slice(0, 7) === currentKey),
    ...charges,
    ...currentSubs
  ];
  const categoryTotals = {};
  for (const item of expenses) {
    const category = item.category || /^\[([^\]]+)\]/.exec(item.description || '')?.[1] || 'OUTROS';
    categoryTotals[category] = addMoney(categoryTotals[category] || 0, item.amount);
  }
  const donut = { labels: Object.keys(categoryTotals), series: Object.values(categoryTotals) };
  let simulated = addMoney(balances.GENERAL, -overdue);
  const projection = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1, 12);
    const key = invoiceKey(date.getMonth() + 1, date.getFullYear());
    const subs = unpaidSubscriptions(subscriptions, ledger[key], date.getMonth() + 1, date.getFullYear());
    const invoice = sumMoney([...pendingCards.filter(item => keyOfCard(item) === key).map(item => item.amount), ...subs.map(item => item.amount)]);
    const regularDue = sumMoney(pendingRegular.filter(item => i === 0 ? item.transactionDate?.slice(0, 7) <= key : item.transactionDate?.slice(0, 7) === key).map(item => item.amount));
    simulated = sumMoney([simulated, -invoice, -regularDue]);
    projection.push({ v: simulated, c: simulated < 0 ? 'red' : simulated <= 500 ? 'orange' : 'green', label: MESES_NOMES[date.getMonth()] + '/' + String(date.getFullYear()).slice(2), fatura_prevista: invoice, despesas_previstas: regularDue });
  }
  const recent = [
    ...transactions.map(item => ({ ...item, id: 'txn_' + item.id, dt: item.transactionDate, account_type: item.accountType || 'GENERAL' })),
    ...cards.map(item => ({ ...item, id: 'ctxn_' + item.id, type: 'EXPENSE', dt: item.purchaseDate, account_type: 'CARTAO' }))
  ].sort((a, b) => (b.dt || '').localeCompare(a.dt || '') || a.id.localeCompare(b.id)).slice(0, 6).map(item => ({ ...item, date: item.dt?.split('-').reverse().join('/') || '--/--/----' }));
  const notifications = [];
  if (overdue > 0) notifications.push({ type: 'DANGER', message: 'Existem R$ ' + overdue.toFixed(2) + ' em parcelas de meses anteriores ainda pendentes.' });
  if (currentInvoice > 0) notifications.push({ type: 'WARNING', message: 'Fatura pendente deste mês: R$ ' + currentInvoice.toFixed(2) + '.' });
  const legacyPayments = transactions.filter(item => legacyInvoiceKey(item));
  if (legacyPayments.length) notifications.push({ type: 'WARNING', message: 'Há pagamentos antigos sem detalhamento de assinaturas. Concilie-os antes de confiar nos totais históricos ou repetir pagamentos nessas competências.' });
  for (let offset = 0; offset <= 1; offset++) {
    const target = new Date(now.getFullYear(), now.getMonth() + offset, 1, 12);
    const key = invoiceKey(target.getMonth() + 1, target.getFullYear());
    for (const sub of unpaidSubscriptions(subscriptions, ledger[key], target.getMonth() + 1, target.getFullYear())) {
      const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      const due = new Date(target.getFullYear(), target.getMonth(), Math.min(sub.dueDay || 1, lastDay), 12);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
      const days = Math.round((due - today) / 86400000);
      if (days >= 0 && days <= 5) notifications.push({ type: days === 0 ? 'DANGER' : 'WARNING', message: sub.name + ': R$ ' + sub.amount.toFixed(2) + (days === 0 ? ' vence hoje.' : ' vence em ' + days + ' dia(s).') });
    }
  }
  return {
    status: 'success', balances, recent_transactions: recent,
    lighthouse: { status: available < 0 ? 'RED' : available <= 500 ? 'ORANGE' : 'GREEN', value: available, total_income: income, total_expenses: sumMoney(expenses.map(item => item.amount)), message: 'Saldo após descontar a fatura atual, parcelas atrasadas e despesas pendentes até este mês. As barras mostram receitas e gastos de ' + currentKey + '.' },
    projection_12m: projection, charts: { donut, radar: donut, line: { labels: projection.map(item => item.label), series: projection.map(item => item.v) } },
    goals: accounts.filter(item => item.type === 'CAIXINHA').map(item => ({ id: item.id, name: item.name, balance: item.balance || 0, target: item.goalAmount || 0, progress_percent: item.goalAmount > 0 ? Math.max(0, Math.min(100, item.balance / item.goalAmount * 100)) : 0 })),
    notifications, curr_invoice: currentInvoice, curr_month: now.getMonth() + 1, curr_year: now.getFullYear(), period: currentKey, as_of: localDate(now),
    invoice_requires_reconciliation: legacyPayments.some(item => legacyInvoiceKey(item) === currentKey)
  };
}
