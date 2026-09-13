import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReceipt } from '../src/utils/receipt.js';
import { completedChatHistory } from '../src/utils/chat.js';

test('recibo exige valor/data válidos e aceita campos não identificados', () => {
  assert.deepEqual(validateReceipt({ amount: '25.50', date: '2026-09-13', description: 'Loja', category: 'ALIMENTACAO' }), { amount: 25.5, date: '2026-09-13', description: 'Loja', category: 'ALIMENTACAO' });
  assert.equal(validateReceipt({ amount: null }).amount, null);
  for (const amount of [-1, [], {}, '25abc', '25,50']) assert.throws(() => validateReceipt({ amount }));
  assert.throws(() => validateReceipt({ date: '2026-02-30' }));
  assert.throws(() => validateReceipt(null));
});

test('chat envia somente pares completos e limita contexto sem começar pelo modelo', () => {
  const user = text => ({ role: 'user', parts: [{ text }] });
  const model = text => ({ role: 'model', parts: [{ text }] });
  const history = [user('falhou'), { ...model('erro'), isError: true }, user('ok'), model('resposta')];
  assert.deepEqual(completedChatHistory(history), [user('ok'), model('resposta')]);
  const long = Array.from({ length: 20 }, (_, i) => [user(String(i)), model(String(i))]).flat();
  const trimmed = completedChatHistory(long);
  assert.equal(trimmed.length, 20);
  assert.equal(trimmed[0].role, 'user');
});
