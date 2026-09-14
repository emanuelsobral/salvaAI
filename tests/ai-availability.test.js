import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAiAvailability } from '../src/utils/aiAvailability.js';

test('429 e 503 impedem novas chamadas durante a pausa e liberam após o prazo', async () => {
  for (const [status, pause] of [[429, 60000], [503, 30000]]) {
    let now = 0, calls = 0;
    const run = createAiAvailability(() => now);
    const operation = async () => { calls++; return { status }; };
    await run(operation);
    await assert.rejects(run(operation), /em pausa/);
    now = pause - 1;
    await assert.rejects(run(operation), /1 segundos/);
    assert.equal(calls, 1);
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
