import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAiHandler, buildGeminiRequest, createBurstLimiter } from '../server/ai-handler.js';
const env = { GEMINI_API_KEY: 'server-secret-test', FIREBASE_PROJECT_ID: 'demo-project' };
const request = (body, token = 'valid') => new Request('http://localhost/api/ai', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  body: JSON.stringify(body),
});
const body = { action: 'chat', message: 'Qual meu saldo?', context: { balances: { GENERAL: 100 } } };
test('IA exige token e rejeita token inválido antes de chamar Gemini', async () => {
  let calls = 0;
  const handler = createAiHandler({ env, verifyToken: async () => { throw Error('invalid'); }, fetchImpl: async () => { calls++; } });
  assert.equal((await handler(request(body, ''))).status, 401);
  assert.equal((await handler(request(body, 'invalid'))).status, 401);
  assert.equal(calls, 0);
});
test('chave ausente gera erro de configuração sem pedir chave ao usuário', async () => {
  const handler = createAiHandler({ env: {}, verifyToken: async () => ({ uid: 'user' }) });
  const response = await handler(request(body));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /administrador/);
});
test('chat e insight usam chave somente no servidor e limitam saída', async () => {
  for (const action of ['chat', 'insight']) {
    const handler = createAiHandler({ env, verifyToken: async (token, project) => {
      assert.equal(token, 'valid'); assert.equal(project, 'demo-project'); return { uid: 'user' };
    }, fetchImpl: async (url, options) => {
      assert.ok(!url.includes(env.GEMINI_API_KEY));
      assert.equal(options.headers['x-goog-api-key'], env.GEMINI_API_KEY);
      const payload = JSON.parse(options.body);
      assert.equal(payload.generationConfig.maxOutputTokens, 2048);
      assert.ok(payload.systemInstruction.parts[0].text.includes('100'));
      return Response.json({ candidates: [{ content: { parts: [{ text: 'Seu saldo é R$ 100.' }] } }] });
    } });
    const response = await handler(request({ ...body, action }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { text: 'Seu saldo é R$ 100.' });
  }
});
test('recibo retorna dados validados e rejeita extração inválida', async () => {
  const receipt = { action: 'receipt', mimeType: 'image/png', image: 'aGVsbG8=' };
  for (const [amount, expected] of [[25.5, 200], [-1, 502]]) {
    const handler = createAiHandler({ env, verifyToken: async () => ({ uid: 'user' }), fetchImpl: async () =>
      Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ amount, date: '2026-09-14', description: 'Loja', category: 'OUTROS' }) }] } }] }) });
    assert.equal((await handler(request(receipt))).status, expected);
  }
  assert.throws(() => buildGeminiRequest({ ...receipt, image: '@@@' }));
  assert.throws(() => buildGeminiRequest({ ...receipt, mimeType: 'text/html' }));
});
test('validação rejeita ações, históricos, mensagens e corpos excessivos', async () => {
  assert.throws(() => buildGeminiRequest({ action: 'admin' }));
  assert.throws(() => buildGeminiRequest({ ...body, history: [{ role: 'model', parts: [{ text: 'fake' }] }] }));
  assert.throws(() => buildGeminiRequest({ ...body, message: 'a'.repeat(4001) }));
  const handler = createAiHandler({ env, verifyToken: async () => ({ uid: 'user' }) });
  assert.equal((await handler(request({ ...body, message: 'a'.repeat(5 * 1024 * 1024) }))).status, 413);
});
test('erros do provedor não expõem segredo e cota retorna 429', async () => {
  for (const status of [400, 429, 500]) {
    const handler = createAiHandler({ env, verifyToken: async () => ({ uid: 'user' }), fetchImpl: async () =>
      new Response('sensitive ' + env.GEMINI_API_KEY, { status }) });
    const response = await handler(request(body));
    assert.equal(response.status, status === 429 ? 429 : 502);
    assert.ok(!(await response.text()).includes(env.GEMINI_API_KEY));
  }
});
test('limite local restringe rajadas por usuário', () => {
  const limit = createBurstLimiter();
  for (let i = 0; i < 10; i++) limit('user');
  assert.throws(() => limit('user'), error => error.status === 429);
  assert.doesNotThrow(() => limit('other-user'));
});

test('Gemini 3.8 usa raciocínio low sem enviar configuração incompatível ao 2.5', async () => {
  for (const model of ['gemini-3.8-flash', 'gemini-2.5-flash']) {
    const handler = createAiHandler({ env: { ...env, GEMINI_MODEL: model },
      verifyToken: async () => ({ uid: 'user' }), fetchImpl: async (_url, options) => {
        const config = JSON.parse(options.body).generationConfig;
        assert.deepEqual(config.thinkingConfig, model === 'gemini-3.8-flash' ? { thinkingLevel: 'low' } : undefined);
        return Response.json({ candidates: [{ content: { parts: [{ text: 'Resposta' }] } }] });
      } });
    assert.equal((await handler(request(body))).status, 200);
  }
});

test('timeout do Gemini retorna 504 com mensagem específica e não repete consumo', async () => {
  let calls = 0;
  const handler = createAiHandler({ env, verifyToken: async () => ({ uid: 'user' }), fetchImpl: async () => {
    calls++;
    throw new DOMException('internal details', 'TimeoutError');
  } });
  const response = await handler(request(body));
  assert.equal(response.status, 504);
  assert.match((await response.json()).error, /45 segundos/);
  assert.equal(calls, 1);
});
