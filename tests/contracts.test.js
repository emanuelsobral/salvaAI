import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeContract } from '../src/utils/contracts.js';
import { harness } from './firestoreHarness.js';

test('contrato preserva campos desconhecidos e não deduz parcelas pela vigência', () => {
  const result = normalizeContract({ title: ' Aluguel ', startDate: '2026-01-01', endDate: '2026-12-31' });
  assert.equal(result.title, 'Aluguel');
  assert.equal(result.installments, null);
  assert.equal(result.amount, null);
  assert.equal(result.dueRule, '');
});

test('contrato rejeita valores inválidos, datas impossíveis e término anterior', () => {
  for (const amount of [0, -5, 1.234, NaN, Infinity, '2.200,00']) assert.throws(() => normalizeContract({ title: 'Teste', amount }));
  for (const installments of [0, -1, 1.5, 1201, '12']) assert.throws(() => normalizeContract({ title: 'Teste', installments }));
  for (const fields of [{ title: ' ' }, { title: 'x'.repeat(501) }, { startDate: '2026-02-30' }, { startDate: '2026-12-01', endDate: '2026-01-01' }, { notes: 'x'.repeat(3001) }]) {
    assert.throws(() => normalizeContract({ title: 'Teste', ...fields }));
  }
});

test('criação repetida usa um contrato e não movimenta contas ou agenda', async () => {
  const h = await harness();
  const service = await h.service('contractService');
  const input = { title: 'Aluguel', amount: 2200, dueRule: 'Dia 20 do mês seguinte' };
  const options = { operationId: 'create-contract' };
  const results = await Promise.all([service.saveContract('test', input, options), service.saveContract('test', input, options)]);
  assert.equal(results[0].id, results[1].id);
  assert.equal(h.all('contracts').length, 1);
  for (const collection of ['accounts', 'transactions', 'subscriptions']) assert.equal(h.all(collection).length, 0);
  await assert.rejects(service.saveContract('test', { ...input, amount: 3000 }, options), /outra operação/);
});

test('edição salva uma vez e recusa formulário antigo sem perder a versão nova', async () => {
  const h = await harness();
  const service = await h.service('contractService');
  const original = { title: 'Escola', amount: 500, installments: 12 };
  const { id } = await service.saveContract('test', original, { operationId: 'create' });
  const updated = { ...original, amount: 600, installments: null };
  const options = { id, expectedRevision: 0, operationId: 'edit' };
  await Promise.all([service.saveContract('test', updated, options), service.saveContract('test', updated, options)]);
  await assert.rejects(service.saveContract('test', original, { id, expectedRevision: 0, operationId: 'stale' }), /outra tela/);
  const [saved] = await service.getContracts('test');
  assert.equal(saved.amount, 600);
  assert.equal(saved.installments, null);
  assert.equal(saved.revision, 1);
});

test('cadastro valida usuário, edição inexistente e retorna apenas contratos do usuário', async () => {
  const h = await harness();
  const service = await h.service('contractService');
  h.seed('contracts', 'other', { title: 'Privado' }, 'other-user');
  await assert.rejects(service.getContracts(''), /Entre/);
  await assert.rejects(service.saveContract('test', { title: 'A' }, { id: 'missing', expectedRevision: 0, operationId: 'missing' }), /não encontrado/);
  assert.equal((await service.getContracts('test')).length, 0);
  assert.equal(h.all('operations').length, 0);
});
