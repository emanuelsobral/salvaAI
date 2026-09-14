import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAiResponse } from '../src/utils/aiResponse.js';

test('erros da hospedagem preservam status sem expor corpo HTML', async () => {
  for (const status of [403, 404, 429, 500, 502, 504]) {
    await assert.rejects(parseAiResponse(new Response('<html>internal details</html>', { status })), error => {
      assert.ok(error.message.includes(`HTTP ${status}`));
      assert.ok(!error.message.includes('internal details'));
      return true;
    });
  }
});

test('mensagens da API são preservadas e fallback SPA não é sucesso', async () => {
  await assert.rejects(parseAiResponse(Response.json({ error: 'A IA ainda não foi habilitada pelo administrador.' }, { status: 503 })), /administrador/);
  await assert.rejects(parseAiResponse(new Response('<html>SPA</html>')), /resposta válida/);
  assert.deepEqual(await parseAiResponse(Response.json({ text: 'Olá' })), { text: 'Olá' });
  assert.deepEqual(await parseAiResponse(Response.json({ data: { amount: 10 } })), { data: { amount: 10 } });
});
