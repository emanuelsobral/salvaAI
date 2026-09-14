import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAiAvailability } from '../src/utils/aiAvailability.js';

test('429 e 503 usam retryAfterSeconds do backend e liberam após o prazo', async () => {
  // Com retryAfterSeconds no corpo: 429 com 45s, 503 com 15s
  for (const [status, seconds] of [[429, 45], [503, 15]]) {
    let now = 0, calls = 0;
    const run = createAiAvailability(() => now);
    const operation = async () => {
      calls++;
      return new Response(JSON.stringify({ error: 'teste', retryAfterSeconds: seconds }), { status });
    };
    await run(operation);
    await assert.rejects(run(operation), /em pausa/);
    now = seconds * 1000 - 1;
    await assert.rejects(run(operation), /1 segundos/);
    assert.equal(calls, 1);
    now = seconds * 1000;
    await run(operation);
    assert.equal(calls, 2);
  }
  // Sem retryAfterSeconds: fallback 60s para 429, 30s para 503
  for (const [status, pause] of [[429, 60000], [503, 30000]]) {
    let now = 0, calls = 0;
    const run = createAiAvailability(() => now);
    const operation = async () => { calls++; return new Response('{}', { status }); };
    await run(operation);
    now = pause - 1;
    await assert.rejects(run(operation), /em pausa/);
    now = pause;
    await run(operation);
    assert.equal(calls, 2);
  }
});

test('ações simultâneas não duplicam chamadas e falha de rede libera a próxima', async () => {
  const run = createAiAvailability();
  let finish;
  const first = run(() => new Promise(resolve => { finish = resolve; }));
  let called = false;
  await assert.rejects(run(async () => { called = true; }), /andamento/);
  assert.equal(called, false);
  finish({ status: 200 });
  await first;
  await assert.rejects(run(async () => { throw Error('network'); }), /network/);
  assert.deepEqual(await run(async () => ({ status: 200 })), { status: 200 });
});
