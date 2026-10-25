import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_FIELDS, contractDraft, prepareSourceReview, validateSourceReview } from '../src/utils/contractExtraction.js';
import { harness } from './firestoreHarness.js';

function sample() {
  const page = 'Parcela de R$ 100,00. 12 parcelas. Vencimento dia 10. Vigencia de 01/01/2026 a 31/12/2026. Reajuste anual pelo IPCA.';
  const field = valor => ({ estado: 'encontrado', valor, evidencias: [{ pagina: 1, trecho: page }], motivo: 'Exemplo fictício', confianca: 'media' });
  const extraction = { version: '0.1.25', fields: {
    valor_parcela: field({ tipo: 'fixo', moeda: 'BRL', quantia: '100.00' }),
    numero_parcelas: field({ tipo: 'determinado', quantidade: 12 }),
    data_vencimento: field({ tipo: 'mensal', dia: 10 }),
    vigencia: field({ inicio: '2026-01-01', fim: '2026-12-31', duracao_meses: 12 }),
    regra_reajuste: field({ regra: 'Reajuste anual pelo IPCA.' }),
  } };
  return { extraction, pages: [page] };
}

test('PDF sugere cinco campos com evidências verificáveis e sem criar calendário', () => {
  const { extraction, pages } = sample();
  assert.deepEqual(contractDraft(extraction, pages), { amount: 100, installments: 12, dueRule: 'Todo dia 10.', startDate: '2026-01-01', endDate: '2026-12-31', adjustmentRule: 'Reajuste anual pelo IPCA.' });
});

test('campos ambíguos ou ausentes não preenchem formulário nem derivam parcelas ou datas', () => {
  const { extraction, pages } = sample();
  for (const field of Object.values(extraction.fields)) field.estado = 'ambiguo';
  assert.deepEqual(contractDraft(extraction, pages), {});
  extraction.fields.vigencia.estado = 'encontrado';
  extraction.fields.vigencia.valor = { duracao_meses: 12, inicio: null, fim: null };
  assert.deepEqual(contractDraft(extraction, pages), {});
});

test('evidência de outra página e valor fora dos limites são recusados ou deixados em branco', () => {
  const { extraction, pages } = sample();
  extraction.fields.valor_parcela.valor.quantia = '999999999999';
  assert.equal(contractDraft(extraction, pages).amount, undefined);
  extraction.fields.valor_parcela.evidencias[0].pagina = 2;
  assert.throws(() => contractDraft(extraction, pages), /evidência/);
});

test('origem revisada preserva os resultados e limita conteúdo inválido ou excessivo', () => {
  const { extraction, pages } = sample();
  const source = prepareSourceReview(extraction, pages, 'a'.repeat(64));
  assert.deepEqual(JSON.parse(source.resultJson), extraction.fields);
  for (const change of [{ pdfSha256: 'invalid' }, { resultJson: '{}' }, { resultJson: '[' }, { resultJson: 'x'.repeat(100001) }]) assert.throws(() => validateSourceReview({ ...source, ...change }));
  assert.equal(Object.keys(CONTRACT_FIELDS).length, 5);
});

test('cadastro por PDF salva evidências uma vez e mantém origem na edição manual', async () => {
  const h = await harness();
  const service = await h.service('contractService');
  const { extraction, pages } = sample();
  const sourceReview = prepareSourceReview(extraction, pages, 'a'.repeat(64));
  const payload = { title: 'Contrato fictício', ...contractDraft(extraction, pages), sourceReview };
  const [first, second] = await Promise.all([service.saveContract('test', payload, { operationId: 'pdf-save' }), service.saveContract('test', payload, { operationId: 'pdf-save' })]);
  assert.equal(first.id, second.id);
  await service.saveContract('test', { title: 'Corrigido', amount: 110 }, { id: first.id, expectedRevision: 0, operationId: 'edit' });
  assert.deepEqual(h.all('contracts')[0].sourceReview, sourceReview);
  assert.equal(h.all('contracts')[0].amount, 110);
  assert.equal(h.all('subscriptions').length, 0);
  assert.equal(h.all('transactions').length, 0);
});
