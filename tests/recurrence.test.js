import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recurringOccurrences, validateSchedule } from '../src/utils/recurrence.js';
import { calculateDashboard } from '../src/utils/dashboard.js';
import { localDate } from '../src/utils/finance.js';
import { harness } from './firestoreHarness.js';

const bill = { id: 'rent', name: 'Aluguel', amount: 100, category: 'MORADIA', billingMode: 'ACCOUNT', frequency: 'MONTHLY', startDate: '2026-01-31', endDate: null, isActive: true, payments: {}, dueDay: 31 };
const dates = (sub, from, to) => recurringOccurrences(sub, from, to).map(item => item.dueDate);
const setup = async () => {
  const h = await harness();
  h.seed('accounts', 'general', { type: 'GENERAL', name: 'Conta corrente', balance: 1000 });
  h.seed('subscriptions', 'rent', bill);
  return { h, service: await h.service('subscriptionService'), txns: await h.service('transactionService') };
};

test('calendário mensal mantém o dia original e respeita início, término inclusivo e limites da consulta', () => {
  assert.deepEqual(dates({ ...bill, endDate: '2026-03-31' }, '2026-01-01', '2026-12-31'), ['2026-01-31', '2026-02-28', '2026-03-31']);
  assert.deepEqual(dates(bill, '2026-02-28', '2026-02-28'), ['2026-02-28']);
  assert.deepEqual(dates(bill, '2026-02-01', '2026-02-27'), []);
  assert.deepEqual(dates(bill, '2025-01-01', '2025-12-31'), []);
});

test('calendário semanal atravessa o ano e anual recupera 29 de fevereiro', () => {
  assert.deepEqual(dates({ ...bill, frequency: 'WEEKLY', startDate: '2025-12-29' }, '2026-01-01', '2026-01-19'), ['2026-01-05', '2026-01-12', '2026-01-19']);
  assert.deepEqual(dates({ ...bill, frequency: 'YEARLY', startDate: '2024-02-29' }, '2024-01-01', '2028-12-31'), ['2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29']);
  assert.deepEqual(dates({ ...bill, startDate: '9999-12-31' }, '9999-12-01', '9999-12-31'), ['9999-12-31']);
});

test('datas e frequências inválidas são rejeitadas e vencimento hoje não fica atrasado', () => {
  for (const fields of [{ frequency: 'DAILY' }, { startDate: '2026-02-30' }, { endDate: '2025-01-01' }]) assert.throws(() => validateSchedule({ ...bill, ...fields }));
  const rows = recurringOccurrences(bill, '2026-01-01', '2026-03-31', '2026-02-28');
  assert.deepEqual(rows.map(item => item.status), ['OVERDUE', 'PENDING', 'PENDING']);
});

test('cadastro recorrente é idempotente, não debita saldo e não entra na fatura legada', async () => {
  const { h, service } = await setup();
  const payload = { name: 'Internet', amount: 50, frequency: 'WEEKLY', start_date: '2026-02-01', end_date: '2026-02-28', operation_id: 'create' };
  await service.createSubscription('test', payload);
  await service.createSubscription('test', payload);
  assert.equal(h.all('subscriptions').length, 2);
  assert.equal(h.all('accounts')[0].balance, 1000);
  h.seed('subscriptions', 'legacy', { name: 'Streaming', amount: 20, isActive: true, dueDay: 1 });
  const cards = await h.service('cardService');
  await cards.payInvoice('test', 2, 2026);
  assert.equal(h.all('accounts')[0].balance, 980);
  assert.equal(h.all('transactions')[0].amount, 20);
  await assert.rejects(service.payRecurringBill('test', 'legacy', '2026-02-01', '2026-02-01'), /não pertence/);
});

test('falha no pagamento é atômica; chamadas concorrentes com chaves diferentes debitam uma única vez', async () => {
  const { h, service } = await setup();
  h.failNextCommit();
  await assert.rejects(service.payRecurringBill('test', 'rent', '2026-01-31', '2026-02-01', 'failed'), /Injected/);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(h.all('transactions').length, 0);
  assert.deepEqual(h.all('subscriptions')[0].payments, {});
  await Promise.all(['first', 'second'].map(key => service.payRecurringBill('test', 'rent', '2026-01-31', '2026-02-01', key)));
  await service.payRecurringBill('test', 'rent', '2026-01-31', '2026-02-01', 'first');
  assert.equal(h.all('accounts')[0].balance, 900);
  assert.equal(h.all('transactions').length, 1);
  const payment = h.all('subscriptions')[0].payments['2026-01-31'];
  assert.equal(payment.transactionId, h.all('transactions')[0].id);
  assert.equal(payment.paidDate, '2026-02-01');
});

test('total mensal de contas ativas conta todos os vencimentos semanais e respeita o término', async () => {
  const { service } = await setup();
  await service.createSubscription('test', { name: 'Aula', amount: 50, frequency: 'WEEKLY', start_date: '2026-02-01', end_date: '2026-02-28' });
  assert.equal((await service.getActiveSubscriptionsTotal('test', new Date(2026, 1, 1, 12))).total, 300);
  assert.equal((await service.getActiveSubscriptionsTotal('test', new Date(2026, 2, 1, 12))).total, 100);
});

test('estorno concorrente devolve saldo uma vez, reabre o vencimento e permite novo pagamento', async () => {
  const { h, service, txns } = await setup();
  const result = await service.payRecurringBill('test', 'rent', '2026-01-31', '2026-02-01', 'pay');
  await Promise.all([txns.deleteTransaction('test', 'txn_' + result.transaction_id), txns.deleteTransaction('test', 'txn_' + result.transaction_id)]);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(h.all('transactions').length, 0);
  assert.deepEqual(h.all('subscriptions')[0].payments, {});
  await service.payRecurringBill('test', 'rent', '2026-01-31', '2026-02-01', 'pay-again');
  assert.equal(h.all('accounts')[0].balance, 900);
});

test('pagamento rejeita data futura, vencimento inexistente e término vencido', async () => {
  const { h, service } = await setup();
  await assert.rejects(service.payRecurringBill('test', 'rent', '2026-01-31', '9999-12-31'), /futuro/);
  await assert.rejects(service.payRecurringBill('test', 'rent', '2026-01-30', '2026-01-30'), /não pertence/);
  h.seed('subscriptions', 'rent', { ...bill, endDate: '2026-01-31' });
  await assert.rejects(service.payRecurringBill('test', 'rent', '2026-02-28', '2026-02-28'), /não pertence/);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(h.all('transactions').length, 0);
});

test('cancelamento preserva débitos anteriores e pagamentos antecipados, sem gerar cobranças futuras', async () => {
  const cancelled = { ...bill, isActive: false, cancelledOn: '2026-02-15', payments: { '2026-03-31': { transactionId: 'advance', amount: 100, paidDate: '2026-01-01' } } };
  const rows = recurringOccurrences(cancelled, '2026-01-01', '2026-12-31', '2026-04-01');
  assert.deepEqual(rows.map(item => [item.dueDate, item.status]), [['2026-01-31', 'OVERDUE'], ['2026-03-31', 'PAID']]);
  const { h, service } = await setup();
  h.seed('subscriptions', 'rent', cancelled);
  await service.deleteSubscription('test', 'rent');
  assert.equal(h.all('subscriptions')[0].cancelledOn, '2026-02-15');
  await service.payRecurringBill('test', 'rent', '2026-01-31', '2026-02-01');
  await assert.rejects(service.payRecurringBill('test', 'rent', '2026-02-28', '2026-02-28'), /cancelado/);
});

test('encerrar uma conta ativa registra hoje e permite quitar vencimentos atrasados', async () => {
  const { h, service } = await setup();
  await service.deleteSubscription('test', 'rent');
  assert.equal(h.all('subscriptions')[0].isActive, false);
  assert.equal(h.all('subscriptions')[0].cancelledOn, localDate());
  await service.payRecurringBill('test', 'rent', '2026-01-31', '2026-02-01');
  assert.equal(h.all('accounts')[0].balance, 900);
});

test('projeções incluem atrasados no primeiro mês, param no término e não descontam pagamentos duas vezes', () => {
  const sub = { ...bill, startDate: '2026-01-10', endDate: '2026-03-10' };
  const input = { accounts: [{ type: 'GENERAL', balance: 1000 }], transactions: [], cards: [], invoices: [], subscriptions: [sub] };
  const now = new Date(2026, 1, 15, 12);
  const before = calculateDashboard(input, now);
  assert.equal(before.curr_invoice, 0);
  assert.equal(before.lighthouse.value, 800);
  assert.equal(before.projection_12m[0].recorrentes_previstas, 200);
  assert.equal(before.projection_12m[1].v, 700);
  assert.equal(before.projection_12m[11].v, 700);
  const after = calculateDashboard({ ...input, accounts: [{ type: 'GENERAL', balance: 900 }],
    subscriptions: [{ ...sub, payments: { '2026-02-10': { transactionId: 'paid', amount: 100, paidDate: '2026-02-15' } } }],
    transactions: [{ kind: 'RECURRING_PAYMENT', status: 'COMPLETED', type: 'EXPENSE', accountType: 'GENERAL', amount: 100, category: 'MORADIA', transactionDate: '2026-02-15' }]
  }, now);
  assert.equal(after.lighthouse.value, before.lighthouse.value);
  assert.equal(after.lighthouse.total_expenses, 100);
  assert.deepEqual(after.projection_12m.map(item => item.v), before.projection_12m.map(item => item.v));
});
