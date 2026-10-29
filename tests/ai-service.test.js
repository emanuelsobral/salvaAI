import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { validateReceipt } from '../src/utils/receipt.js';
import { parseAiResponse } from '../src/utils/aiResponse.js';
import { createAiAvailability } from '../src/utils/aiAvailability.js';

async function service(auth, fetchImpl) {
  const context = vm.createContext({ fetch: fetchImpl, AbortSignal });
  const stub = values => new vm.SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  const module = new vm.SourceTextModule(await readFile(new URL('../src/services/aiService.js', import.meta.url), 'utf8'), { context });
  await module.link(name => stub(name.includes('firebase') ? { auth } : name.includes('receipt') ? { validateReceipt } : name.includes('aiResponse') ? { parseAiResponse } : { createAiAvailability }));
  await module.evaluate(); return module.namespace;
}
test('cliente não envia contexto de uma conta após troca de usuário', async () => {
  const auth = { currentUser: { uid: 'alice', getIdToken: async () => { auth.currentUser = { uid: 'bob' }; return 'alice-token'; } } };
  const client = await service(auth, () => assert.fail('Não pode enviar após troca de conta'));
  await assert.rejects(client.chatWithAI([], 'Saldo?', {}, { uid: 'alice' }), /conta mudou/);
  await assert.rejects(client.chatWithAI([], 'Saldo?', {}, { uid: 'alice' }), /conta mudou/);
});
test('cliente respeita cancelamento antes de enviar imagem', async () => {
  const controller = new AbortController(); controller.abort();
  const client = await service({ currentUser: { uid: 'alice', getIdToken: async () => 'token' } }, () => assert.fail('Não pode enviar após cancelar'));
  await assert.rejects(client.readDocumentWithAI('contract-ocr', 'image', 1, { signal: controller.signal }), /cancelada/);
});
test('chat envia resumo sem coleção de transações, identidade ou chave de API', async () => {
  let sent;
  const client = await service({ currentUser: { uid: 'alice', getIdToken: async () => 'firebase-token' } }, async (url, options) => {
    assert.equal(url, '/api/ai'); assert.equal(options.headers.Authorization, 'Bearer firebase-token');
    sent = JSON.parse(options.body); return Response.json({ text: 'Resposta' });
  });
  await client.chatWithAI([], 'Saldo?', { balances: { GENERAL: 100 }, transactions: [{ secret: 'private' }], email: 'private', apiKey: 'private' }, { uid: 'alice' });
  assert.deepEqual(sent.context, { balances: { GENERAL: 100 } });
});
