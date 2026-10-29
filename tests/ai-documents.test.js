import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDocumentAnswer, canRecoverStatement, statementRecoveryDrafts } from '../src/utils/aiDocuments.js';
import { aiHistory } from '../src/utils/aiHistory.js';
import { prepareSourceReview } from '../src/utils/contractExtraction.js';

const transaction = { date: '2026-10-28', description: 'Compra', amount: '25.50', direction: 'EXPENSE', evidence: '28/10/2026 Compra 25,50 D' };
test('leitura de IA mantém lacunas e rejeita datas, valores e evidências inválidas', () => {
  const validate = item => validateDocumentAnswer('statement-recovery', { transactions: [item] });
  assert.deepEqual(validate(transaction).transactions[0], transaction);
  assert.equal(validate({ ...transaction, date: null, amount: null, direction: null }).transactions[0].date, null);
  for (const invalid of [{ date: '2026-02-30' }, { date: '28/10' }, { amount: '-1.00' }, { amount: '1,00' }, { amount: '0.00' }, { amount: 10 }, { direction: 'credit' }, { evidence: '' }]) {
    assert.throws(() => validate({ ...transaction, ...invalid }));
  }
  assert.throws(() => validateDocumentAnswer('statement-recovery', { transactions: Array(101).fill(transaction) }));
  assert.throws(() => validateDocumentAnswer('contract-ocr', { text: 'x'.repeat(60001) }));
});
test('IA de extrato só é elegível na página com lacuna ou falha indicada pelo usuário', () => {
  const rows = [{ ...transaction, page: 1 }];
  assert.equal(canRecoverStatement(rows, 1), false);
  assert.equal(canRecoverStatement(rows, 1, true), true);
  assert.equal(canRecoverStatement(rows, 2), true);
  assert.equal(canRecoverStatement([{ ...rows[0], date: '' }], 1), true);
});
test('sugestões não alteram linhas locais, não são selecionadas e preservam repetição real', () => {
  const rows = [{ ...transaction, page: 1, include: true, id: 'local' }];
  const before = structuredClone(rows);
  const newRow = { ...transaction, amount: '70.00', date: null };
  const drafts = statementRecoveryDrafts({ transactions: [transaction, transaction, newRow] }, rows, 1);
  assert.deepEqual(rows, before); assert.equal(drafts.length, 2);
  assert.ok(drafts.every(row => !row.include && row.ai && row.page === 1));
  assert.equal(drafts[1].date, '');
  assert.equal(statementRecoveryDrafts({ transactions: [transaction] }, rows, 2).length, 1);
});
test('origem de transcrição DeepSeek fica distinta da leitura local', () => {
  const fields = Object.fromEntries(['valor_parcela', 'numero_parcelas', 'data_vencimento', 'vigencia', 'regra_reajuste'].map(key => [key, { estado: 'nao_identificado', motivo: 'Teste', evidencias: [], valor: null }]));
  const review = prepareSourceReview({ version: '0.1.25', fields }, ['Texto'], 'a'.repeat(64), { useAi: true });
  assert.equal(review.method, 'PDF_DEEPSEEK_OCR_REVIEW');
  assert.deepEqual(JSON.parse(review.resultJson), fields);
});
test('histórico não envia falhas ou pares incompletos e limita dez trocas', () => {
  const user = { role: 'user', parts: [{ text: 'Olá' }] }, model = { role: 'model', parts: [{ text: 'Resposta' }] };
  const history = aiHistory([...Array(12).fill([user, model]).flat(), user, { ...model, isError: true }, user]);
  assert.equal(history.length, 20); assert.equal(history.at(-1).role, 'model');
  assert.deepEqual(aiHistory([user, { ...model, isError: true }]), []);
});
