import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateContractAi } from '../src/utils/contractAi.js';
import { contractDraft, prepareSourceReview, validateSourceReview } from '../src/utils/contractExtraction.js';
import { selectContractAmount } from '../src/utils/contractAlternatives.js';
import { harness } from './firestoreHarness.js';
const pages = ['Mensalidades: Fundamental R$ 800,00; Ensino Médio R$ 1.100,00 (turno integral).'];
function response() {
  const fields = Object.fromEntries(['valor_parcela','numero_parcelas','data_vencimento','vigencia','regra_reajuste'].map(k => [k, { estado: 'nao_identificado', valor: null, motivo: 'Ausente', evidencias: [] }]));
  fields.valor_parcela = { estado: 'ambiguo', valor: null, motivo: 'Escolha a matrícula.', evidencias: [{ pagina: 1, trecho: pages[0] }], alternativas: [
    { rotulo: 'Fundamental', quantia: '800.00', periodicidade: 'mensal', condicoes: '', evidencias: [{ pagina: 1, trecho: 'Fundamental R$ 800,00' }] },
    { rotulo: 'Ensino Médio', quantia: '1100.00', periodicidade: 'mensal', condicoes: 'turno integral', evidencias: [{ pagina: 1, trecho: 'Ensino Médio R$ 1.100,00 (turno integral)' }] },
  ] };
  return { fields };
}
function source() { return prepareSourceReview(validateContractAi(response(), pages), pages, 'a'.repeat(64), { useFieldAi: true }); }

test('alternativas preservam ambiguidade e não preenchem valor antes da escolha', () => {
  const data = validateContractAi(response(), pages);
  assert.deepEqual(contractDraft(data, pages), {});
  assert.equal(data.fields.valor_parcela.alternativas.length, 2);
  const original = source();
  const result = selectContractAmount(original, 1);
  assert.equal(result.amount, 1100);
  const field = JSON.parse(validateSourceReview(result.sourceReview).resultJson).valor_parcela;
  assert.equal(field.estado, 'ambiguo'); assert.equal(field.valor, null);
  assert.equal(field.selecaoUsuario.origem, 'usuario');
  assert.equal(JSON.parse(original.resultJson).valor_parcela.selecaoUsuario, undefined);
  const manual = selectContractAmount(result.sourceReview, null);
  assert.equal(manual.amount, ''); assert.equal(JSON.parse(manual.sourceReview.resultJson).valor_parcela.selecaoUsuario, undefined);
  assert.throws(() => selectContractAmount(original, 99));
});

test('recusa opções inventadas, associação trocada, moeda inválida, duplicação e escolha feita pela IA', () => {
  for (const mutate of [
    f => { f.alternativas[0].evidencias[0].pagina = 2; },
    f => { f.alternativas[0].quantia = '1100.00'; },
    f => { f.alternativas[0].rotulo = 'Superior'; },
    f => { f.alternativas[0].quantia = '0.00'; },
    f => { f.alternativas[0].quantia = '800.001'; },
    f => { f.alternativas[0].periodicidade = 'anual'; },
    f => { f.alternativas[0].evidencias[0].trecho = 'Fundamental R$ 800,00 inventado'; },
    f => { f.alternativas.push(f.alternativas[0]); },
    f => { f.alternativas = Array(13).fill(f.alternativas[0]); },
    f => { f.estado = 'encontrado'; },
    f => { f.selecaoUsuario = { indice: 0, quantia: '800.00', origem: 'usuario' }; },
  ]) { const data = response(); mutate(data.fields.valor_parcela); assert.throws(() => validateContractAi(data, pages)); }
});

test('valor remetido a proposta externa continua sem alternativas e sem preenchimento', () => {
  const data = response(); delete data.fields.valor_parcela.alternativas;
  data.fields.valor_parcela.evidencias = []; data.fields.valor_parcela.motivo = 'Anexe a proposta externa.';
  const validated = validateContractAi(data, pages);
  assert.equal(validated.fields.valor_parcela.alternativas, undefined);
  assert.deepEqual(contractDraft(validated, pages), {});
});

test('persistência guarda escolha e evidência sem movimentação e recusa divergência de valor', async () => {
  const h = await harness(); const service = await h.service('contractService');
  const chosen = selectContractAmount(source(), 1);
  await assert.rejects(service.saveContract('test', { title: 'Escola', amount: 800, sourceReview: chosen.sourceReview }, { operationId: 'bad-choice' }), /valor mudou/);
  await service.saveContract('test', { title: 'Escola', amount: chosen.amount, sourceReview: chosen.sourceReview }, { operationId: 'choice' });
  const [saved] = await service.getContracts('test');
  assert.equal(saved.amount, 1100);
  assert.equal(JSON.parse(saved.sourceReview.resultJson).valor_parcela.selecaoUsuario.indice, 1);
  assert.equal(JSON.parse(saved.sourceReview.resultJson).valor_parcela.estado, 'ambiguo');
  assert.equal(h.all('subscriptions').length, 0);
  const tampered = JSON.parse(chosen.sourceReview.resultJson); tampered.valor_parcela.selecaoUsuario.quantia = '999.00';
  assert.throws(() => validateSourceReview({ ...chosen.sourceReview, resultJson: JSON.stringify(tampered) }));
});
