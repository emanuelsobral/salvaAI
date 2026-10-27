import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewContractAdjustment, contractPlanSnapshot } from '../src/utils/contractAdjustment.js';
import { recurringOccurrences } from '../src/utils/recurrence.js';
import { previewContractPlan } from '../src/utils/contractPlan.js';
import { calculateDashboard } from '../src/utils/dashboard.js';
import { localDate } from '../src/utils/finance.js';
import { harness } from './firestoreHarness.js';

const fixedSub = { id: 'contract_a', contractId: 'a', billingMode: 'ACCOUNT', isActive: true, amount: 100.25, startDate: '2027-01-31', endDate: '2027-04-30', frequency: 'MONTHLY', payments: {} };
const input = { type: 'PERCENT', value: 10, effectiveFrom: '2027-02-01' };
const today = '2027-01-01';

test('snapshot ignora ordem das chaves do Firestore e detecta alterações reais', () => {
  const revision = previewContractAdjustment(fixedSub, input, today).revision;
  const payments = { '2027-01-31': { transactionId: 'a', paidDate: today, amount: 100.25 }, '2027-02-28': { transactionId: 'b', paidDate: today, amount: 110.28 } };
  const original = { ...fixedSub, revisions: [revision], payments };
  const reordered = { ...original, revisions: [Object.fromEntries(Object.entries(revision).reverse())], payments: Object.fromEntries(Object.entries(payments).reverse().map(([date, value]) => [date, Object.fromEntries(Object.entries(value).reverse())])) };
  assert.equal(contractPlanSnapshot(original), contractPlanSnapshot(reordered));
  for (const change of [{ amount: 120 }, { effectiveFrom: '2027-03-01' }, { adjustmentValue: 20 }, { frequency: 'YEARLY' }]) {
    assert.notEqual(contractPlanSnapshot(original), contractPlanSnapshot({ ...original, revisions: [{ ...revision, ...change }] }));
  }
  assert.notEqual(contractPlanSnapshot(original), contractPlanSnapshot({ ...original, payments: {} }));
  assert.notEqual(contractPlanSnapshot(original), contractPlanSnapshot({ ...original, isActive: false }));
});

test('reajuste preserva dia 31, mostra antes/depois e calcula percentuais em centavos', () => {
  const preview = previewContractAdjustment(fixedSub, input, today);
  assert.equal(preview.revision.amount, 110.28);
  assert.deepEqual(preview.rows.map(row => row.dueDate), ['2027-02-28', '2027-03-31', '2027-04-30']);
  assert.equal(preview.previousTotal, 300.75);
  assert.equal(preview.total, 330.84);
  const rows = recurringOccurrences({ ...fixedSub, revisions: [preview.revision] }, '2027-01-01', '2027-12-31', today);
  assert.deepEqual(rows.map(row => row.amount), [100.25, 110.28, 110.28, 110.28]);
  assert.equal(fixedSub.revisions, undefined);
  assert.equal(previewContractAdjustment(fixedSub, { ...input, value: -10 }, today).revision.amount, 90.23);
  assert.equal(previewContractAdjustment({ ...fixedSub, amount: 0.05 }, { ...input, value: 10 }, today).revision.amount, 0.06);
});

test('novo valor e reajustes sucessivos preservam versões e usam o último valor como base', () => {
  const first = previewContractAdjustment(fixedSub, { ...input, type: 'AMOUNT', value: 120 }, today);
  const sub = { ...fixedSub, revisions: [first.revision] };
  const second = previewContractAdjustment(sub, { ...input, effectiveFrom: '2027-03-01' }, today);
  assert.equal(second.revision.previousAmount, 120);
  assert.equal(second.revision.amount, 132);
  const rows = recurringOccurrences({ ...sub, revisions: [...sub.revisions, second.revision] }, '2027-01-01', '2027-12-31', today);
  assert.deepEqual(rows.map(row => row.amount), [100.25, 120, 132, 132]);
  assert.equal(rows.length, 4);
});

test('reajuste recusa datas passadas, parcelas pagas, plano encerrado e valores inválidos', () => {
  for (const invalid of [{ effectiveFrom: today }, { effectiveFrom: '2026-12-31' }, { effectiveFrom: '2027-05-01' }, { effectiveFrom: '2027-02-30' }, { effectiveFrom: '2027-01-02' },
    { value: -100 }, { value: 10001 }, { value: 1.111 }, { value: NaN }, { value: Infinity }, { value: '10' }, { value: 0 }, { type: 'INDEX' }, { type: 'AMOUNT', value: 0 }, { type: 'AMOUNT', value: 1000000001 }, { type: 'AMOUNT', value: 1.111 }]) {
    assert.throws(() => previewContractAdjustment(fixedSub, { ...input, ...invalid }, today));
  }
  assert.throws(() => previewContractAdjustment({ ...fixedSub, isActive: false }, input, today), /ativo/);
  assert.throws(() => previewContractAdjustment({ ...fixedSub, payments: { '2027-03-31': { amount: 100.25 } } }, input, today), /pagamento/);
  assert.throws(() => previewContractAdjustment({ ...fixedSub, revisions: [previewContractAdjustment(fixedSub, input, today).revision] }, input, today), /posterior/);
  assert.throws(() => previewContractAdjustment({ ...fixedSub, revisions: Array(100).fill({}) }, input, today), /100 reajustes/);
});

async function setup() {
  const h = await harness();
  h.seed('accounts', 'general', { name: 'Conta', type: 'GENERAL', balance: 1000 });
  const service = await h.service('contractService');
  const contract = await service.saveContract('test', { title: 'Aluguel', amount: 100 }, { operationId: 'create' });
  const plan = previewContractPlan({ amount: 100, count: 4, frequency: 'MONTHLY', firstDueDate: localDate() });
  await service.createContractPlan('test', contract.id, plan, { expectedRevision: 0, operationId: 'plan' });
  const sub = h.all('subscriptions')[0];
  return { h, service, contract, plan, sub, change: { type: 'PERCENT', value: 10, effectiveFrom: plan.rows[1].dueDate }, options: { expectedRevision: 1, expectedSnapshot: contractPlanSnapshot(sub), operationId: 'adjust' } };
}

test('confirmação repetida e concorrente aplica só um reajuste sem mudar saldo ou cadastro', async () => {
  const { h, service, contract, sub, change, options, plan } = await setup();
  await Promise.all([service.adjustContractPlan('test', contract.id, change, options), service.adjustContractPlan('test', contract.id, change, options)]);
  const saved = h.all('subscriptions')[0];
  assert.equal(saved.revisions.length, 1);
  assert.equal(h.all('contracts')[0].revision, 2);
  assert.equal(h.all('contracts')[0].amount, 100);
  assert.equal(h.all('contracts')[0].commitmentPlan.amount, 100);
  assert.equal(saved.amount, sub.amount);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(h.all('transactions').length, 0);
  assert.deepEqual(recurringOccurrences(saved, plan.firstDueDate, plan.lastDueDate).map(row => row.amount), [100, 110, 110, 110]);
  await service.saveContract('test', { title: 'Cadastro revisado' }, { id: contract.id, expectedRevision: 2, operationId: 'edit' });
  assert.equal(h.all('subscriptions')[0].revisions.length, 1);
});

test('duas confirmações diferentes, prévia antiga e edição concorrente não sobrescrevem plano', async () => {
  const { h, service, contract, change, options } = await setup();
  const results = await Promise.allSettled(['one', 'two'].map(operationId => service.adjustContractPlan('test', contract.id, change, { ...options, operationId })));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.match(results.find(result => result.status === 'rejected').reason.message, /outra tela/);
  assert.equal(h.all('subscriptions')[0].revisions.length, 1);
  await assert.rejects(service.saveContract('test', { title: 'Antigo' }, { id: contract.id, expectedRevision: 1, operationId: 'stale' }), /outra tela/);
  await assert.rejects(service.adjustContractPlan('test', contract.id, { ...change, value: 20 }, { ...options, operationId: 'other' }), /outra tela/);
});

test('segundo reajuste aceita plano idêntico retornado com campos em outra ordem', async () => {
  const { h, service, contract, change, options, plan } = await setup();
  await service.adjustContractPlan('test', contract.id, change, options);
  const sub = h.all('subscriptions')[0];
  const expectedSnapshot = contractPlanSnapshot(sub);
  h.seed('subscriptions', sub.id, { ...sub, revisions: sub.revisions.map(revision => Object.fromEntries(Object.entries(revision).reverse())) });
  await service.adjustContractPlan('test', contract.id, { type: 'AMOUNT', value: 120, effectiveFrom: plan.rows[2].dueDate }, { expectedRevision: 2, expectedSnapshot, operationId: 'second' });
  assert.deepEqual(recurringOccurrences(h.all('subscriptions')[0], plan.firstDueDate, plan.lastDueDate).map(row => row.amount), [100, 110, 120, 120]);
});

test('pagamento ou encerramento durante a revisão invalida a confirmação', async () => {
  const { h, service, contract, sub, change, options, plan } = await setup();
  const subscriptions = await h.service('subscriptionService');
  await subscriptions.payRecurringBill('test', sub.id, plan.rows[1].dueDate, localDate(), 'pay', 100);
  await assert.rejects(service.adjustContractPlan('test', contract.id, change, options), /pagamentos mudaram/);
  await assert.rejects(service.adjustContractPlan('test', contract.id, change, { ...options, expectedSnapshot: contractPlanSnapshot(h.all('subscriptions')[0]) }), /pagamento registrado/);
  assert.equal(h.all('subscriptions')[0].revisions, undefined);
  await subscriptions.deleteSubscription('test', sub.id);
  await assert.rejects(service.adjustContractPlan('test', contract.id, change, { ...options, expectedSnapshot: contractPlanSnapshot(h.all('subscriptions')[0]) }), /ativo/);
});

test('reajuste integra projeção, pagamento e estorno; parcelas antigas mantêm valor', async () => {
  const { h, service, contract, sub, change, options, plan } = await setup();
  const subscriptions = await h.service('subscriptionService'), txns = await h.service('transactionService');
  await service.adjustContractPlan('test', contract.id, change, options);
  const projection = calculateDashboard({ accounts: h.all('accounts'), transactions: [], subscriptions: h.all('subscriptions'), cards: [], invoices: [] });
  assert.equal(projection.projection_12m[1].recorrentes_previstas, 110);
  await assert.rejects(subscriptions.payRecurringBill('test', sub.id, plan.rows[1].dueDate, localDate(), 'stale-pay', 100), /valor.*mudou/);
  await subscriptions.payRecurringBill('test', sub.id, plan.rows[1].dueDate, localDate(), 'new-pay', 110);
  assert.equal(h.all('accounts')[0].balance, 890);
  await subscriptions.payRecurringBill('test', sub.id, plan.firstDueDate, localDate(), 'old-pay', 100);
  assert.equal(h.all('accounts')[0].balance, 790);
  const txn = h.all('transactions').find(item => item.amount === 110);
  await txns.deleteTransaction('test', 'txn_' + txn.id);
  assert.equal(h.all('accounts')[0].balance, 900);
  const reopened = recurringOccurrences(h.all('subscriptions')[0], plan.rows[1].dueDate, plan.rows[1].dueDate)[0];
  assert.equal(reopened.amount, 110);
  assert.equal(reopened.payment, undefined);
});

test('calendários semanal e anual mantêm datas e parcelas após reajuste', () => {
  for (const frequency of ['WEEKLY', 'YEARLY']) {
    const plan = previewContractPlan({ amount: 100.25, count: 4, frequency, firstDueDate: '2028-02-29' });
    const sub = { ...fixedSub, frequency, startDate: plan.firstDueDate, endDate: plan.lastDueDate };
    const preview = previewContractAdjustment(sub, { ...input, effectiveFrom: plan.rows[1].dueDate }, today);
    const rows = recurringOccurrences({ ...sub, revisions: [preview.revision] }, plan.firstDueDate, plan.lastDueDate, today);
    assert.deepEqual(rows.map(row => row.dueDate), plan.rows.map(row => row.dueDate));
    assert.deepEqual(rows.map(row => row.amount), [100.25, 110.28, 110.28, 110.28]);
  }
});
