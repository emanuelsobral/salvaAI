import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewContractPlan } from '../src/utils/contractPlan.js';
import { recurringOccurrences } from '../src/utils/recurrence.js';
import { calculateDashboard } from '../src/utils/dashboard.js';
import { localDate } from '../src/utils/finance.js';
import { harness } from './firestoreHarness.js';

const input = { amount: 100.25, count: 3, firstDueDate: '2026-01-31', frequency: 'MONTHLY' };
async function setup() {
  const h = await harness();
  h.seed('accounts', 'general', { name: 'Conta', type: 'GENERAL', balance: 1000 });
  const service = await h.service('contractService');
  const contract = await service.saveContract('test', { title: 'Aluguel', amount: 100.25 }, { operationId: 'create' });
  return { h, service, contract };
}

test('prévia mensal recupera dia 31, anual recupera 29/02, semanal atravessa o ano', () => {
  const preview = previewContractPlan(input);
  assert.deepEqual(preview.rows.map(row => row.dueDate), ['2026-01-31', '2026-02-28', '2026-03-31']);
  assert.equal(preview.total, 300.75);
  assert.deepEqual(previewContractPlan({ ...input, frequency: 'YEARLY', firstDueDate: '2024-02-29', count: 5 }).rows.map(row => row.dueDate), ['2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29']);
  assert.deepEqual(previewContractPlan({ ...input, frequency: 'WEEKLY', firstDueDate: '2025-12-29', count: 2 }).rows.map(row => row.dueDate), ['2025-12-29', '2026-01-05']);
  assert.equal(previewContractPlan({ ...input, count: 1 }).lastDueDate, input.firstDueDate);
});

test('prévia exige campos explícitos e recusa datas, quantidades ou valores inválidos', () => {
  for (const change of [{ amount: 0 }, { amount: 1.234 }, { count: 0 }, { count: 1.5 }, { count: 1201 }, { count: null }, { frequency: '' }, { firstDueDate: '' }, { firstDueDate: '2026-02-30' }, { firstDueDate: '9999-12-31', count: 2 }]) {
    assert.throws(() => previewContractPlan({ ...input, ...change }));
  }
});

test('confirmação simultânea e repetida cria um plano, preserva saldo e limita a última parcela', async () => {
  const { h, service, contract } = await setup();
  const options = { expectedRevision: 0, operationId: 'plan' };
  const [a, b] = await Promise.all([service.createContractPlan('test', contract.id, input, options), service.createContractPlan('test', contract.id, input, options)]);
  assert.equal(a.commitmentPlan.subscriptionId, b.commitmentPlan.subscriptionId);
  const [sub] = h.all('subscriptions');
  assert.equal(h.all('subscriptions').length, 1);
  assert.equal(sub.contractId, contract.id);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(h.all('transactions').length, 0);
  const rows = recurringOccurrences(sub, '2026-01-01', '2026-12-31');
  assert.deepEqual(rows.map(row => row.dueDate), previewContractPlan(input).rows.map(row => row.dueDate));
  assert.ok(rows.every(row => row.contractId === contract.id));
});

test('chaves diferentes disputam o mesmo contrato sem duplicar plano', async () => {
  const { h, service, contract } = await setup();
  const results = await Promise.allSettled(['a', 'b'].map(operationId => service.createContractPlan('test', contract.id, input, { expectedRevision: 0, operationId })));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.match(results.find(result => result.status === 'rejected').reason.message, /já possui/);
  assert.equal(h.all('subscriptions').length, 1);
  assert.equal(h.all('contracts')[0].revision, 1);
});

test('contrato alterado após a prévia bloqueia confirmação sem escritas parciais', async () => {
  const { h, service, contract } = await setup();
  await service.saveContract('test', { title: 'Alterado' }, { id: contract.id, expectedRevision: 0, operationId: 'edit' });
  await assert.rejects(service.createContractPlan('test', contract.id, input, { expectedRevision: 0, operationId: 'stale-plan' }), /outra tela/);
  assert.equal(h.all('subscriptions').length, 0);
  assert.ok(!h.all('operations').some(item => item.id === 'stale-plan'));
});

test('editar cadastro preserva plano e edição genérica de recorrência é recusada', async () => {
  const { h, service, contract } = await setup();
  const saved = await service.createContractPlan('test', contract.id, input, { expectedRevision: 0, operationId: 'plan' });
  await service.saveContract('test', { title: 'Título atualizado', amount: 800 }, { id: contract.id, expectedRevision: 1, operationId: 'edit' });
  assert.deepEqual(h.all('contracts')[0].commitmentPlan, structuredClone(saved.commitmentPlan));
  assert.equal(h.all('subscriptions')[0].amount, input.amount);
  const subscriptions = await h.service('subscriptionService');
  await assert.rejects(subscriptions.editRecurringSubscription('test', saved.commitmentPlan.subscriptionId, { effective_from: localDate(), start_date: localDate(), frequency: 'MONTHLY', amount: 800, expected_revision: 0, operation_id: 'unsafe-edit' }), /Reajustar parcelas/);
});

test('plano integra projeção, pagamento único, estorno e encerramento sem cobrar duas vezes', async () => {
  const { h, service, contract } = await setup();
  const today = localDate();
  const plan = await service.createContractPlan('test', contract.id, { ...input, firstDueDate: today }, { expectedRevision: 0, operationId: 'plan' });
  const subId = plan.commitmentPlan.subscriptionId;
  const subscriptions = await h.service('subscriptionService');
  const txns = await h.service('transactionService');
  const dashboard = () => calculateDashboard({ accounts: h.all('accounts'), transactions: h.all('transactions'), subscriptions: h.all('subscriptions'), cards: [], invoices: [] });
  assert.equal(dashboard().projection_12m[0].recorrentes_previstas, input.amount);
  await Promise.all(['pay-a', 'pay-b'].map(key => subscriptions.payRecurringBill('test', subId, today, today, key, input.amount)));
  assert.equal(h.all('accounts')[0].balance, 899.75);
  assert.equal(h.all('transactions').length, 1);
  assert.equal(dashboard().projection_12m[0].recorrentes_previstas, 0);
  assert.equal(dashboard().projection_12m[0].v, 899.75);
  await txns.deleteTransaction('test', 'txn_' + h.all('transactions')[0].id);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(dashboard().projection_12m[0].recorrentes_previstas, input.amount);
  await subscriptions.deleteSubscription('test', subId);
  assert.deepEqual(recurringOccurrences(h.all('subscriptions')[0], today, '9999-12-31').map(row => row.dueDate), [today]);
  await assert.rejects(service.createContractPlan('test', contract.id, input, { expectedRevision: 1, operationId: 'replace' }), /já possui/);
});
