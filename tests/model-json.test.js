import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseModelJson } from '../src/utils/modelJson.js';
import { createAiHandler } from '../server/ai-handler.js';

// Minimal synthetic fixtures modelled on two DeepSeek failures (item 8, 2026-11-03).
const rawNewlines = '{"text":"24\n\nCLAUSULA 1\nTexto"}';
const missingBrace = '{"fields":{"a":{"estado":"encontrado","valor":{"regra":"x","evidencias":[]},"b":{"estado":"ambiguo"}}}';

test('quebras de linha literais dentro de strings são recuperadas sem alterar o texto', () => {
  const { data, recovered } = parseModelJson(rawNewlines);
  assert.equal(recovered, true);
  assert.equal(data.text, '24\n\nCLAUSULA 1\nTexto');
  assert.deepEqual(parseModelJson('{"text":"ok\\n"}'), { data: { text: 'ok\n' }, recovered: false });
  assert.equal(parseModelJson('{"t":"a\tb\r\u0001"}').data.t, 'a\tb\r\u0001');
});

test('estrutura incompleta ou ambígua continua rejeitada', () => {
  for (const bad of [missingBrace, '{"text":"abc\n', '{"text":"a\n"}}', '{"text":"a"', 'texto {"text":"a"}', '{"text":"a\n",}'])
    assert.throws(() => parseModelJson(bad), SyntaxError, bad);
});

test('quebras fora de strings não acionam recuperação', () => {
  assert.deepEqual(parseModelJson('{\n"text":\n"a"\n}'), { data: { text: 'a' }, recovered: false });
});

const env = { DEEPSEEK_API_KEY: 'server-secret-test', FIREBASE_PROJECT_ID: 'demo-project' };
const call = (action, content, extra = {}) => createAiHandler({
  env, verifyToken: async () => ({ uid: 'user' }),
  fetchImpl: async () => Response.json({ choices: [{ finish_reason: 'stop', message: { content } }] }),
})(new Request('http://localhost/api/ai', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t' },
  body: JSON.stringify({ action, ...extra }),
}));
const image = { mimeType: 'image/png', image: 'aGVsbG8=', page: 1 };

test('handler aceita OCR recuperado e ainda aplica o validador', async () => {
  const ok = await call('contract-ocr', rawNewlines, image);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).data.text, '24\n\nCLAUSULA 1\nTexto');
  const invalidSchema = await call('contract-ocr', '{"txt":"a\nb"}', image);
  assert.equal(invalidSchema.status, 502);
});

test('handler rejeita extração com chave ausente sem aplicar resultado parcial', async () => {
  const response = await call('contract-extract', missingBrace, { pages: ['Texto da página.'] });
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.match(body.error, /leitura inválida/);
  assert.equal(body.data, undefined);
});

