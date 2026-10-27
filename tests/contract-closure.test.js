import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './firestoreHarness.js';
import { previewContractClosure } from '../src/utils/contractClosure.js';
import { contractPlanSnapshot } from '../src/utils/contractAdjustment.js';
import { previewContractPlan } from '../src/utils/contractPlan.js';
import { recurringOccurrences } from '../src/utils/recurrence.js';
import { localDate } from '../src/utils/finance.js';
import { calculateDashboard } from '../src/utils/dashboard.js';

const contract = { id: 'a', commitmentPlan: { subscriptionId: 'contract_a' } };
const sub = { id: 'contract_a', contractId: 'a', billingMode: 'ACCOUNT', isActive: true, amount: 100, frequency: 'MONTHLY', startDate: '2027-01-31', endDate: '2027-05-31', payments: { '2027-03-31': { transactionId: 'p', amount: 100, paidDate: '2027-02-28' } }, revisions: [{ effectiveFrom: '2027-04-01', amount: 120, frequency: 'MONTHLY', startDate: '2027-01-31', endDate: '2027-05-31' }] };

test('prévia separa vencidas e de hoje, antecipações e futuras com valor reajustado', () => {
  const preview = previewContractClosure(contract, sub, { closedOn: '2027-02-28', reason: '  Fim da locação  ' }, '2027-02-28');
  assert.deepEqual(preview.cancelled.map(row => row.dueDate), ['2027-04-30', '2027-05-31']);
  assert.equal(preview.cancelledTotal, 240);
  assert.deepEqual(preview.pending.map(row => row.dueDate), ['2027-01-31', '2027-02-28']);
  assert.equal(preview.pendingTotal, 200);
  assert.equal(preview.paid.length, 1);
  assert.equal(preview.closure.reason, 'Fim da locação');
  assert.equal(sub.isActive, true);
});

test('encerramento sem plano e após encerramento da recorrência não inventa cancelamentos', () => {
  const input = { closedOn: '2027-02-28', reason: '' };
  const empty = previewContractClosure({ id: 'b' }, null, input, input.closedOn);
  assert.equal(empty.snapshot, null); assert.equal(empty.closure.subscriptionId, null);
  assert.deepEqual(empty.cancelled, []);
  const legacy = previewContractClosure(contract, { ...sub, isActive: false, cancelledOn: '2027-01-31' }, input, input.closedOn);
  assert.equal(legacy.cancelled.length, 0);
  assert.equal(legacy.pending.length, 1);
  assert.equal(legacy.paid.length, 1);
  assert.equal(legacy.previouslyCancelled, true);
});

test('prévia recusa contrato encerrado, data antiga ou futura, motivo longo e plano divergente', () => {
  const input = { closedOn: '2027-02-28', reason: '' };
  for (const invalid of [{ closedOn: '2027-02-27' }, { closedOn: '2027-03-01' }, { closedOn: '2027-02-30' }, { reason: 'x'.repeat(601) }, { reason: null }]) assert.throws(() => previewContractClosure(contract, sub, { ...input, ...invalid }, input.closedOn));
  assert.throws(() => previewContractClosure({ ...contract, closure: input }, sub, input, input.closedOn), /encerrado/);
  assert.throws(() => previewContractClosure(contract, null, input, input.closedOn), /plano/);
  assert.throws(() => previewContractClosure(contract, { ...sub, contractId: 'other' }, input, input.closedOn), /plano/);
});

async function setup(withPlan = true) {
  const h = await harness();
  h.seed('accounts', 'general', { name: 'Conta', type: 'GENERAL', balance: 1000 });
  const service = await h.service('contractService');
  const created = await service.saveContract('test', { title: 'Contrato fictício' }, { operationId: 'contract' });
  const plan = previewContractPlan({ amount: 100, count: 4, frequency: 'MONTHLY', firstDueDate: localDate() });
  if (withPlan) await service.createContractPlan('test', created.id, plan, { expectedRevision: 0, operationId: 'plan' });
  const options = () => ({ expectedRevision: h.all('contracts')[0].revision, expectedSnapshot: withPlan ? contractPlanSnapshot(h.all('subscriptions')[0]) : null, operationId: 'close' });
  return { h, service, id: created.id, plan, options, input: { closedOn: localDate(), reason: 'Fim do serviço' } };
}

test('encerramento atômico preserva pagamentos e saldo; estorno não reabre futura cancelada', async () => {
  const { h, service, id, plan, options, input } = await setup();
  const subscriptions = await h.service('subscriptionService'), txns = await h.service('transactionService');
  const subId = h.all('subscriptions')[0].id;
  await subscriptions.payRecurringBill('test', subId, plan.rows[1].dueDate, localDate(), 'advance', 100);
  const previousPayments = h.all('subscriptions')[0].payments;
  await service.closeContract('test', id, input, options());
  assert.equal(h.all('accounts')[0].balance, 900);
  assert.deepEqual(h.all('subscriptions')[0].payments, previousPayments);
  assert.equal(h.all('contracts')[0].closure.closedOn, localDate());
  assert.deepEqual(recurringOccurrences(h.all('subscriptions')[0], plan.firstDueDate, plan.lastDueDate).map(row => row.dueDate), [plan.firstDueDate, plan.rows[1].dueDate]);
  const dashboard = calculateDashboard({ accounts: h.all('accounts'), transactions: h.all('transactions'), subscriptions: h.all('subscriptions'), cards: [], invoices: [] });
  assert.equal(dashboard.projection_12m[0].recorrentes_previstas, 100);
  assert.equal(dashboard.projection_12m[2].recorrentes_previstas, 0);
  await assert.rejects(subscriptions.payRecurringBill('test', subId, plan.rows[2].dueDate, localDate(), 'cancelled', 100), /cancelado/);
  await txns.deleteTransaction('test', 'txn_' + h.all('transactions')[0].id);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(recurringOccurrences(h.all('subscriptions')[0], plan.rows[1].dueDate, plan.rows[1].dueDate).length, 0);
  await subscriptions.payRecurringBill('test', subId, plan.firstDueDate, localDate(), 'pay-today', 100);
  await txns.deleteTransaction('test', 'txn_' + h.all('transactions')[0].id);
  assert.equal(recurringOccurrences(h.all('subscriptions')[0], plan.firstDueDate, plan.firstDueDate)[0].payment, undefined);
});

test('contrato sem plano é encerrado sem criar recorrência; cadastro não pode ser reaberto', async () => {
  const { h, service, id, plan, options, input } = await setup(false);
  await service.closeContract('test', id, input, options());
  assert.equal(h.all('subscriptions').length, 0);
  assert.equal(h.all('transactions').length, 0);
  assert.equal(h.all('accounts')[0].balance, 1000);
  await assert.rejects(service.saveContract('test', { title: 'Reabrir' }, { id, expectedRevision: 1, operationId: 'edit' }), /consulta/);
  await assert.rejects(service.createContractPlan('test', id, plan, { expectedRevision: 1, operationId: 'late-plan' }), /encerrado/);
});

test('recorrência já encerrada mantém a data anterior e não reabre pendências canceladas', async () => {
  const { h, service, id, options, input, plan } = await setup();
  const previous = h.all('subscriptions')[0];
  h.seed('subscriptions', previous.id, { ...previous, isActive: false, cancelledOn: '2000-01-01', cancelledAt: { seconds: 1 } });
  const saved = h.all('subscriptions')[0];
  await service.closeContract('test', id, input, options());
  assert.deepEqual(h.all('subscriptions')[0], saved);
  assert.equal(recurringOccurrences(saved, plan.firstDueDate, plan.lastDueDate).length, 0);
});

test('pagamento, reajuste ou edição após prévia bloqueiam encerramento sem gravação parcial', async () => {
  for (const change of ['payment', 'adjustment', 'edit']) {
    const { h, service, id, options, input, plan } = await setup();
    const stale = options();
    if (change === 'payment') await (await h.service('subscriptionService')).payRecurringBill('test', h.all('subscriptions')[0].id, plan.rows[1].dueDate, localDate(), 'pay', 100);
    if (change === 'adjustment') await service.adjustContractPlan('test', id, { type: 'AMOUNT', value: 120, effectiveFrom: plan.rows[1].dueDate }, { ...options(), operationId: 'adjust' });
    if (change === 'edit') await service.saveContract('test', { title: 'Editado' }, { id, expectedRevision: 1, operationId: 'edit' });
    await assert.rejects(service.closeContract('test', id, input, stale), /mudaram/);
    assert.equal(h.all('subscriptions')[0].isActive, true);
    assert.equal(h.all('contracts')[0].closure, undefined);
  }
});

test('duas confirmações não duplicam encerramento e repetição usa a operação já salva', async () => {
  const { h, service, id, options, input, plan } = await setup();
  const original = options();
  const outcomes = await Promise.allSettled(['first', 'second'].map(operationId => service.closeContract('test', id, input, { ...original, operationId })));
  assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1);
  assert.equal(h.all('contracts')[0].revision, 2);
  const operationId = outcomes[0].status === 'fulfilled' ? 'first' : 'second';
  await service.closeContract('test', id, input, { ...original, operationId });
  assert.equal(h.all('contracts')[0].revision, 2);
  await assert.rejects(service.adjustContractPlan('test', id, { type: 'AMOUNT', value: 120, effectiveFrom: plan.rows[1].dueDate }, { ...options(), operationId: 'late-adjust' }), /encerrado/);
});

test('encerramento aceita reajustes idênticos com ordem de campos diferente após a prévia', async () => {
  const { h, service, id, options, input, plan } = await setup();
  await service.adjustContractPlan('test', id, { type: 'AMOUNT', value: 120, effectiveFrom: plan.rows[1].dueDate }, { ...options(), operationId: 'adjust' });
  const reviewed = options();
  const sub = h.all('subscriptions')[0];
  h.seed('subscriptions', sub.id, { ...sub, revisions: sub.revisions.map(revision => Object.fromEntries(Object.entries(revision).reverse())) });
  await service.closeContract('test', id, input, reviewed);
  assert.equal(h.all('contracts')[0].closure.closedOn, localDate());
  assert.equal(h.all('subscriptions')[0].isActive, false);
  assert.equal(h.all('subscriptions')[0].revisions[0].amount, 120);
});
