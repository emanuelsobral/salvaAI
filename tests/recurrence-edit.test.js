import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './firestoreHarness.js';
import { recurringOccurrences, prepareRecurringRevision, earliestRevisionDate } from '../src/utils/recurrence.js';
import { localDate } from '../src/utils/finance.js';
import { calculateDashboard } from '../src/utils/dashboard.js';

const bill = { id: 'rent', name: 'Aluguel', amount: 100, category: 'MORADIA', billingMode: 'ACCOUNT', frequency: 'MONTHLY', startDate: '2026-01-31', endDate: null, dueDay: 31, isActive: true, payments: {} };
const edit = { amount: 150, frequency: 'MONTHLY', effective_from: '2099-02-01', start_date: '2026-01-31', end_date: '', keep_calendar: true, expected_revision: 0, operation_id: 'edit-1' };
async function setup() {
  const h = await harness();
  h.seed('accounts', 'general', { type: 'GENERAL', name: 'Conta', balance: 1000 });
  h.seed('subscriptions', 'rent', bill);
  return { h, subs: await h.service('subscriptionService'), txns: await h.service('transactionService'), imports: await h.service('importService') };
}

test('reajuste preserva meses anteriores e o dia 31 depois de fevereiro; cadastro original não muda', async () => {
  const { h, subs } = await setup();
  await subs.editRecurringSubscription('test', 'rent', edit);
  const saved = h.all('subscriptions')[0];
  assert.equal(saved.amount, 100);
  assert.equal(saved.startDate, bill.startDate);
  const rows = recurringOccurrences(saved, '2099-01-01', '2099-03-31');
  assert.deepEqual(rows.map(item => [item.dueDate, item.amount]), [['2099-01-31', 100], ['2099-02-28', 150], ['2099-03-31', 150]]);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(h.all('transactions').length, 0);
});

test('novo calendário semanal substitui cobranças desde a vigência, sem sobrepor datas', async () => {
  const { h, subs } = await setup();
  await subs.editRecurringSubscription('test', 'rent', { ...edit, keep_calendar: false, frequency: 'WEEKLY', effective_from: '2099-01-31', start_date: '2099-02-02', end_date: '2099-02-16' });
  const rows = recurringOccurrences(h.all('subscriptions')[0], '2098-12-01', '2099-03-31');
  assert.deepEqual(rows.map(item => [item.dueDate, item.amount]), [['2098-12-31', 100], ['2099-02-02', 150], ['2099-02-09', 150], ['2099-02-16', 150]]);
});

test('duas alterações mantêm competências e projeção; nova condição pode renovar uma conta com término', async () => {
  const { h, subs } = await setup();
  await subs.editRecurringSubscription('test', 'rent', { ...edit, end_date: '2099-02-28' });
  await subs.editRecurringSubscription('test', 'rent', { ...edit, operation_id: 'edit-2', expected_revision: 1, effective_from: '2099-04-01', amount: 200, end_date: '2099-04-30' });
  const saved = h.all('subscriptions')[0];
  assert.deepEqual(recurringOccurrences(saved, '2099-01-01', '2099-12-31').map(item => [item.dueDate, item.amount]), [['2099-01-31', 100], ['2099-02-28', 150], ['2099-04-30', 200]]);
  const dashboard = calculateDashboard({ accounts: h.all('accounts'), transactions: [], subscriptions: [saved], cards: [], invoices: [] }, new Date(2099, 1, 1));
  assert.equal(dashboard.projection_12m[2].recorrentes_previstas, 200);
  assert.equal(dashboard.projection_12m[3].recorrentes_previstas, 0);
});

test('edição é idempotente e duas telas com a mesma revisão não sobrescrevem alterações', async () => {
  const { h, subs } = await setup();
  await Promise.all([subs.editRecurringSubscription('test', 'rent', edit), subs.editRecurringSubscription('test', 'rent', edit)]);
  assert.equal(h.all('subscriptions')[0].revisions.length, 1);
  await assert.rejects(subs.editRecurringSubscription('test', 'rent', { ...edit, operation_id: 'stale', amount: 300 }), /outra tela/);
  const next = { ...edit, expected_revision: 1, effective_from: '2099-03-01' };
  const results = await Promise.allSettled([subs.editRecurringSubscription('test', 'rent', { ...next, operation_id: 'next-a', amount: 200 }), subs.editRecurringSubscription('test', 'rent', { ...next, operation_id: 'next-b', amount: 250 })]);
  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(h.all('subscriptions')[0].revisions.length, 2);
  assert.equal(h.all('operations').length, 2);
});

test('pagamentos futuros impedem reescrever o calendário; edição posterior preserva pagamento e estorno', async () => {
  const { h, subs, txns } = await setup();
  const paid = await subs.payRecurringBill('test', 'rent', '2099-02-28', localDate(), 'advance');
  await assert.rejects(subs.editRecurringSubscription('test', 'rent', edit), /pagamento registrado/);
  await subs.editRecurringSubscription('test', 'rent', { ...edit, effective_from: '2099-03-01' });
  assert.equal(h.all('subscriptions')[0].payments['2099-02-28'].amount, 100);
  await txns.deleteTransaction('test', 'txn_' + paid.transaction_id);
  assert.equal(recurringOccurrences(h.all('subscriptions')[0], '2099-02-28', '2099-02-28')[0].amount, 100);
  assert.equal(h.all('accounts')[0].balance, 1000);
});

test('pagamento usa o valor da competência e rejeita confirmação com valor desatualizado', async () => {
  const { h, subs } = await setup();
  await subs.editRecurringSubscription('test', 'rent', edit);
  await assert.rejects(subs.payRecurringBill('test', 'rent', '2099-02-28', localDate(), 'stale-pay', 100), /valor.*mudou/);
  await subs.payRecurringBill('test', 'rent', '2099-01-31', localDate(), 'old-pay', 100);
  await subs.payRecurringBill('test', 'rent', '2099-02-28', localDate(), 'new-pay', 150);
  assert.equal(h.all('accounts')[0].balance, 750);
  assert.deepEqual(h.all('transactions').map(item => item.amount), [100, 150]);
});

test('datas retroativas, versões fora de ordem e contas legadas/encerradas são bloqueadas', () => {
  for (const payload of [
    { ...edit, effective_from: '2025-01-01' },
    { ...edit, keep_calendar: false, start_date: '2099-01-01' },
    { ...edit, end_date: '2099-01-31' },
    { ...edit, frequency: 'DAILY', keep_calendar: false, start_date: '2099-02-01' }
  ]) assert.throws(() => prepareRecurringRevision(bill, payload, '2026-10-12'));
  assert.throws(() => prepareRecurringRevision({ ...bill, isActive: false }, edit), /ativas/);
  assert.throws(() => prepareRecurringRevision({ ...bill, billingMode: undefined }, edit), /ativas/);
  const revision = prepareRecurringRevision(bill, edit);
  assert.throws(() => prepareRecurringRevision({ ...bill, revisions: [revision] }, { ...edit, expected_revision: 1 }), /posterior/);
});

test('manter calendário anual conserva o dia bissexto e data mínima respeita pagamentos e alterações', () => {
  const annual = { ...bill, frequency: 'YEARLY', startDate: '2024-02-29' };
  const revision = prepareRecurringRevision(annual, { ...edit, effective_from: '2027-01-01' }, '2026-10-12');
  assert.deepEqual(recurringOccurrences({ ...annual, revisions: [revision] }, '2027-01-01', '2028-12-31').map(item => item.dueDate), ['2027-02-28', '2028-02-29']);
  assert.equal(earliestRevisionDate({ ...bill, revisions: [revision], payments: { '2028-02-29': {} } }, '2026-10-12'), '2028-03-01');
  assert.equal(earliestRevisionDate({ ...bill, payments: { '9999-12-31': {} } }), null);
});

test('conciliação revalida o valor da versão vigente e mantém o vínculo do período anterior', async () => {
  const { h, subs, imports } = await setup();
  // A edição parte de hoje para testar extrato já ocorrido, sem datas bancárias futuras.
  const today = localDate();
  h.seed('subscriptions', 'rent', { ...bill, startDate: '2026-01-01', dueDay: 1 });
  await subs.editRecurringSubscription('test', 'rent', { ...edit, effective_from: today, keep_calendar: false, start_date: today });
  const options = { reconciliations: [{ rowIndex: 0, subscriptionId: 'rent', dueDate: today }] };
  await assert.rejects(imports.importStatement('test', today + ';Aluguel;-100,00', options), /não corresponde/);
  await imports.importStatement('test', today + ';Aluguel;-150,00', options);
  assert.equal(h.all('accounts')[0].balance, 850);
  assert.equal(h.all('subscriptions')[0].payments[today].amount, 150);
});
