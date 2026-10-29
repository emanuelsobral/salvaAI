import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAiHandler, buildDeepSeekRequest, createBurstLimiter } from '../server/ai-handler.js';
const env = { DEEPSEEK_API_KEY: 'server-secret-test', FIREBASE_PROJECT_ID: 'demo-project' };
const request = (body, token = 'valid') => new Request('http://localhost/api/ai', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body),
});
const body = { action: 'chat', message: 'Qual meu saldo?', context: { balances: { GENERAL: 100 } } };
const answer = text => ({ choices: [{ finish_reason: 'stop', message: { content: text } }] });
const handler = (fetchImpl, extra = {}) => createAiHandler({ env, verifyToken: async () => ({ uid: 'user' }), fetchImpl, ...extra });
const image = { mimeType: 'image/png', image: 'aGVsbG8=', page: 1 };

test('autenticação precede chamadas e leitura; método e mídia são limitados', async () => {
  let calls = 0;
  const h = handler(async () => { calls++; }, { verifyToken: async () => { throw Error('invalid'); } });
  assert.equal((await h(request(body, ''))).status, 401);
  assert.equal((await h(request(body))).status, 401);
  assert.equal((await h(new Request('http://localhost/api/ai'))).status, 405);
  assert.equal((await h(new Request('http://localhost/api/ai', { method: 'POST' }))).status, 415);
  assert.equal(calls, 0);
});
test('sem chave DeepSeek não tenta usar configuração Gemini legada', async () => {
  const response = await handler(() => assert.fail(), { env: { GEMINI_API_KEY: 'old' } })(request(body));
  assert.equal(response.status, 503); assert.match((await response.json()).error, /administrador/);
});
test('chat e insight usam endpoint fixo, chave no cabeçalho e contexto como dados', async () => {
  for (const action of ['chat', 'insight']) {
    const h = handler(async (url, options) => {
      assert.equal(url, 'https://api.deepseek.com/chat/completions');
      assert.equal(options.headers.Authorization, 'Bearer ' + env.DEEPSEEK_API_KEY);
      const payload = JSON.parse(options.body);
      assert.equal(payload.model, 'deepseek-flash'); assert.equal(payload.max_tokens, 2048);
      assert.deepEqual(payload.thinking, { type: 'disabled' });
      assert.ok(!payload.messages[0].content.includes('100'));
      assert.ok(payload.messages[0].content.includes('Não representam apenas dinheiro já pago'));
      assert.ok(payload.messages[0].content.includes('não desconte novamente os mesmos compromissos'));
      assert.ok(payload.messages[1].content.includes('100'));
      assert.equal(payload.messages[1].role, 'user');
      return Response.json(answer('Seu saldo é R$ 100.'));
    }, { verifyToken: async (token, project) => {
      assert.equal(token, 'valid'); assert.equal(project, 'demo-project'); return { uid: 'user' };
    } });
    const response = await h(request({ ...body, action }));
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { text: 'Seu saldo é R$ 100.' });
  }
});
test('OCR usa modelo visual, formato JSON e uma imagem; não aceita URLs arbitrárias', async () => {
  const h = handler(async (_url, options) => {
    const payload = JSON.parse(options.body);
    assert.equal(payload.model, 'vision-configured');
    assert.equal(payload.max_tokens, 8192);
    assert.deepEqual(payload.response_format, { type: 'json_object' });
    assert.equal(payload.messages[1].content[1].image_url.url, 'data:image/png;base64,aGVsbG8=');
    return Response.json(answer('{"text":"Aluguel: R$ 100,00"}'));
  }, { env: { ...env, DEEPSEEK_VISION_MODEL: 'vision-configured' } });
  const response = await h(request({ action: 'contract-ocr', ...image }));
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { data: { text: 'Aluguel: R$ 100,00' } });
  for (const invalid of [{ image: 'https://example.com' }, { mimeType: 'text/html' }, { page: 0 }, { page: 51 }]) {
    assert.throws(() => buildDeepSeekRequest({ action: 'contract-ocr', ...image, ...invalid }));
  }
});
test('extratos exigem indicação de falha local e resposta estruturada válida', async () => {
  assert.throws(() => buildDeepSeekRequest({ action: 'statement-recovery', ...image }), /leitura local/);
  const h = handler(async () => Response.json(answer('{"transactions":[]}')));
  assert.equal((await h(request({ action: 'statement-recovery', localReadFailed: true, ...image }))).status, 200);
  for (const text of ['{}', '{"transactions":[{"amount":-10}]}', '{"text":123}', 'not JSON']) {
    const bad = handler(async () => Response.json(answer(text)));
    assert.equal((await bad(request({ action: 'contract-ocr', ...image }))).status, 502);
  }
});
test('recibos legados continuam validados', async () => {
  for (const [amount, expected] of [[25.5, 200], [-1, 502]]) {
    const h = handler(async () => Response.json(answer(JSON.stringify({ amount, date: '2026-09-14', description: 'Loja', category: 'OUTROS' }))));
    assert.equal((await h(request({ action: 'receipt', ...image }))).status, expected);
  }
});
test('ações, históricos, modelo e entradas excessivas não chegam ao provedor', async () => {
  for (const data of [{ action: 'admin' }, { ...body, message: '' }, { ...body, message: 'a'.repeat(4001) },
    { ...body, history: [{ role: 'model', parts: [{ text: 'fake' }] }] }, { ...body, context: 'x'.repeat(30001) }]) assert.throws(() => buildDeepSeekRequest(data));
  const h = handler(() => assert.fail());
  assert.equal((await h(request({ ...body, message: 'a'.repeat(5 * 1024 * 1024) }))).status, 413);
  const invalidModel = handler(() => assert.fail(), { env: { ...env, DEEPSEEK_MODEL: 'https://arbitrary' } });
  assert.equal((await invalidModel(request(body))).status, 503);
});
test('erros nunca expõem corpo do provedor e nenhuma falha gera repetição automática', async () => {
  for (const [upstream, expected] of [[400, 502], [401, 502], [402, 503], [403, 502], [404, 502], [429, 429], [500, 502], [503, 503]]) {
    let calls = 0;
    const h = handler(async () => { calls++; return new Response('sensitive ' + env.DEEPSEEK_API_KEY, { status: upstream }); });
    const response = await h(request(body));
    assert.equal(response.status, expected); assert.equal(calls, 1);
    assert.ok(!(await response.text()).includes(env.DEEPSEEK_API_KEY));
  }
});
test('429 propaga espera e limiter local bloqueia rajadas', async () => {
  const h = handler(async () => new Response('', { status: 429, headers: { 'retry-after': '45' } }));
  assert.equal((await (await h(request(body))).json()).retryAfterSeconds, 45);
  const limit = createBurstLimiter();
  for (let i = 0; i < 10; i++) limit('user');
  assert.throws(() => limit('user'), error => error.status === 429);
  assert.doesNotThrow(() => limit('other-user'));
});
test('timeout e cancelamento interrompem sem repetir', async () => {
  for (const [name, status] of [['TimeoutError', 504], ['AbortError', 499]]) {
    let calls = 0;
    const response = await handler(async () => { calls++; throw new DOMException('private', name); })(request(body));
    assert.equal(response.status, status); assert.equal(calls, 1);
  }
});
test('saídas truncadas, vazias, malformadas ou filtradas não viram resultado útil', async () => {
  for (const [result, expected] of [
    [{ choices: [{ finish_reason: 'length', message: { content: 'partial' } }] }, 502],
    [{ choices: [{ finish_reason: 'content_filter' }] }, 422],
    [answer(''), 502], [answer(null), 502], [{ choices: [{ finish_reason: 'stop', message: { reasoning_content: 'internal' } }] }, 502],
  ]) {
    const response = await handler(async () => Response.json(result))(request(body));
    assert.equal(response.status, expected);
    assert.ok(!(await response.text()).includes('partial'));
  }
});
