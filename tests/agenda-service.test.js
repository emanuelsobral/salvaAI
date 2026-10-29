import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './firestoreHarness.js';

test('agenda recusa cache vazio ou antigo e recupera leitura confirmada pelo servidor', async () => {
  const h = await harness();
  const service = await h.service('subscriptionService');
  h.cachedReads(true);
  await assert.rejects(service.getSubscriptions('test', { requireFresh: true }), /confirmar as contas no servidor/);
  h.seed('subscriptions', 'bill', { name: 'Conta fictícia', amount: 100 });
  await assert.rejects(service.getSubscriptions('test', { requireFresh: true }), /confirmar as contas no servidor/);
  h.cachedReads(false);
  assert.equal((await service.getSubscriptions('test', { requireFresh: true })).subs[0].amount, 100);
});

test('opção da agenda não altera o comportamento das outras consultas de recorrências', async () => {
  const h = await harness(); h.cachedReads(true);
  const service = await h.service('subscriptionService');
  assert.equal((await service.getSubscriptions('test')).subs.length, 0);
});
