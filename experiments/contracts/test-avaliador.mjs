import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { avaliarSinteticos, compararValores, CAMPOS } from './avaliar-sinteticos.mjs';
import { documentoFicticio, entradaFicticia, campoVazio, criarLoteDemonstracao } from './examples/lote-avaliacao-sintetico.mjs';

const avaliar = documentos => avaliarSinteticos({ natureza: 'sintetica', protocolo_versao: '1.0.0', documentos });
function um(modificar = () => {}) {
  const { gabarito, extracao } = documentoFicticio();
  modificar(gabarito, extracao);
  return entradaFicticia(gabarito, extracao);
}
const casos = JSON.parse(fs.readFileSync(new URL('./examples/casos-avaliacao.json', import.meta.url)));
for (const caso of casos.casos) {
  test('protocolo: ' + caso.id, () => {
    const d = criarLoteDemonstracao().documentos.find(d => d.gabarito.documento_id === caso.id);
    const r = avaliar([d]).global.exato;
    const nomes = { acerto_exato: 'acerto', precisao: 'precisao', revocacao: 'revocacao',
      taxa_nao_identificados: 'taxa_nao_identificados', erro_alta_confianca: 'erro_alta_confianca' };
    for (const [nome, esperado] of Object.entries(caso.esperado)) {
      const m = r.metricas[nomes[nome]];
      if (esperado === null) { assert.equal(m.valor, null); assert.equal(m.rotulo, 'não aplicável'); }
      else assert.deepEqual([m.numerador, m.denominador], esperado);
    }
    for (const [chave, esperado] of Object.entries({ TP: caso.verdadeiros_positivos, FP: caso.falsos_positivos,
      FN: caso.falsos_negativos, A: caso.ausencias_corretas, omissoes: caso.nao_identificados,
      alta: caso.respostas_alta_confianca, erros_alta: caso.erros_alta_confianca })) assert.equal(r.contagens[chave], esperado);
  });
}

test('um centavo tolerado não apaga o erro de alta confiança', () => {
  const r = avaliar([um((g, p) => { p.campos.valor_parcela.valor.quantia = '1200.01'; })]);
  assert.equal(r.campos.valor_parcela.exato.contagens.TP, 0);
  assert.equal(r.campos.valor_parcela.tolerante.contagens.TP, 1);
  for (const modo of ['exato', 'tolerante']) {
    assert.equal(r.campos.valor_parcela[modo].metricas.erro_alta_confianca.valor, 1);
  }
});
test('dois centavos e um dia de diferença falham também na comparação tolerante', () => {
  const r = avaliar([um((g, p) => {
    p.campos.valor_parcela.valor.quantia = '1200.02';
    for (const c of [g.campos.data_vencimento, p.campos.data_vencimento]) {
      c.valor = { tipo: 'data_unica', data: '2027-01-10', dia: null, regra: null };
    }
    p.campos.data_vencimento.valor.data = '2027-01-11';
  })]);
  for (const campo of ['valor_parcela', 'data_vencimento']) assert.equal(r.campos[campo].tolerante.contagens.FP, 1);
});
test('compara o objeto inteiro: taxa e condição não são descartadas', () => {
  const { gabarito } = documentoFicticio();
  const original = gabarito.campos.regra_reajuste.valor;
  for (const alteracao of [{ periodicidade_meses: 6 }, { regra: original.regra + ' Exceto no primeiro ano.' }, { indices: ['IPCA-E'] }]) {
    assert.deepEqual(compararValores('regra_reajuste', original, { ...original, ...alteracao }), { exato: false, tolerante: false });
  }
  const dinheiro = gabarito.campos.valor_parcela.valor;
  assert.equal(compararValores('valor_parcela', dinheiro, { ...dinheiro, quantia: '1200.01', regra: 'Sob condição.' }).tolerante, false);
});
test('normaliza NFC, espaços, caixa e aliases completos sem remover negações', () => {
  const a = { tipo: 'indice', indices: ['IGP-M', 'INPC'], percentual: null, periodicidade_meses: 12, regra: 'Reajuste NÃO automático.' };
  const b = { ...a, indices: ['Índice Nacional de Preços ao Consumidor', 'IGPM', 'IGP M'], regra: ' REAJUSTE\n não  automático. '.normalize('NFD') };
  assert.equal(compararValores('regra_reajuste', a, b).exato, true);
  assert.equal(compararValores('regra_reajuste', a, { ...b, regra: 'Reajuste automático.' }).exato, false);
  assert.equal(compararValores('regra_reajuste', a, { ...b, regra: 'Reajuste NÃO automático!' }).exato, false);
});
test('chaves em outra ordem não mudam a comparação', () => {
  assert.equal(compararValores('numero_parcelas', { tipo: 'determinado', quantidade: 12 }, { quantidade: 12, tipo: 'determinado' }).exato, true);
});
test('dinheiro é comparado em centavos sem arredondamento binário', () => {
  const a = { tipo: 'fixo', moeda: 'BRL', quantia: '9999999999999999.99', regra: null };
  assert.equal(compararValores('valor_parcela', a, { ...a, quantia: '10000000000000000.00' }).tolerante, true);
  assert.equal(compararValores('valor_parcela', a, { ...a, quantia: '10000000000000000.01' }).tolerante, false);
});
test('ambíguos e ilegíveis ficam fora do denominador, com respostas arriscadas registradas', () => {
  const r = avaliar([um(g => {
    g.campos.valor_parcela = campoVazio('ambiguo');
    g.campos.numero_parcelas = campoVazio('ilegivel');
  })]).global.exato.contagens;
  assert.equal(r.D, 3); assert.equal(r.ambiguos, 1); assert.equal(r.ilegiveis, 1);
  assert.equal(r.respostas_excluidas, 2); assert.equal(r.alta_excluida, 2);
  assert.equal(r.erros_alta, 0);
});
test('falha de leitura de campo ausente não recebe acerto de ausência', () => {
  const r = avaliar([um((g, p) => {
    g.campos.valor_parcela = campoVazio('ausente');
    p.campos.valor_parcela = campoVazio('erro_leitura');
  })]).campos.valor_parcela.exato;
  assert.equal(r.contagens.A, 0); assert.equal(r.metricas.acerto.valor, 0);
  assert.equal(r.metricas.revocacao.valor, null);
});
test('JSON malformado ou um único campo inválido anulam a saída inteira', () => {
  for (const bruto of ['{', JSON.stringify({ ...JSON.parse(um().extracao_bruta), campo_extra: true }),
    um((g, p) => { p.campos.valor_parcela.valor.quantia = '1200,00'; }).extracao_bruta]) {
    const r = avaliar([{ ...um(), extracao_bruta: bruto }]);
    assert.equal(r.processamento.jsons_invalidos, 1);
    assert.equal(r.global.exato.contagens.FN, 5);
    assert.equal(r.global.exato.contagens.omissoes, 5);
    assert.equal(r.global.exato.contagens.TP, 0);
  }
});
test('falha completa não desaparece do denominador', () => {
  const r = avaliar([{ ...um(), simulacao: { status: 'falhou', duracao_ms: 17 } }]);
  assert.equal(r.global.exato.contagens.D, 5); assert.equal(r.global.exato.contagens.FN, 5);
  assert.equal(r.documentos[0].simulacao.duracao_ms, 17);
});
test('falha parcial válida preserva os estados por campo e é contabilizada', () => {
  const d = um((g, p) => {
    p.campos.valor_parcela = campoVazio('erro_leitura');
    p.campos.vigencia = campoVazio('erro_leitura');
  });
  d.simulacao.status = 'parcial';
  const r = avaliar([d]);
  assert.equal(r.processamento.parciais, 1);
  assert.equal(r.global.exato.contagens.D, 5);
  assert.equal(r.global.exato.contagens.FN, 2);
  assert.equal(r.global.exato.contagens.TP, 3);
  assert.equal(r.documentos[0].codigo, 'FALHA_PARCIAL');
});
test('data impossível e vigência invertida invalidam o registro', () => {
  for (const fim of ['2027-02-30', '2026-12-31']) {
    const r = avaliar([um((g, p) => { p.campos.vigencia.valor.fim = fim; })]);
    assert.equal(r.processamento.jsons_invalidos, 1);
  }
  assert.throws(() => avaliar([um(g => { g.campos.vigencia.valor.fim = '2027-02-30'; })]), /Gabarito/);
  assert.throws(() => avaliar([um(g => { g.anotacao.estado_revisao = 'divergencias_pendentes'; })]), /Gabarito/);
});
test('média global soma contagens em vez de tirar média de grupos', () => {
  const d1 = um(); d1.gabarito.documento_id = 'grupo-a';
  const p1 = JSON.parse(d1.extracao_bruta); p1.documento_id = 'grupo-a'; d1.extracao_bruta = JSON.stringify(p1);
  const d2 = criarLoteDemonstracao().documentos[2]; d2.categoria = 'saude'; d2.formato = 'digitalizado';
  const r = avaliar([d1, d2]);
  assert.deepEqual([r.global.exato.metricas.acerto.numerador, r.global.exato.metricas.acerto.denominador], [5, 6]);
  assert.equal(r.categorias.aluguel.global.exato.metricas.acerto.valor, 1);
  assert.equal(r.formatos.digitalizado.global.exato.metricas.acerto.valor, 0);
  assert.deepEqual(Object.keys(r.campos), CAMPOS);
});
test('recusa duplicidades, identidades divergentes e registros reais', () => {
  const d = um(); assert.throws(() => avaliar([d, d]), /duplicado/);
  assert.throws(() => avaliar([um((g, p) => { p.documento_id = 'outro'; })]), /Identidade/);
  assert.throws(() => avaliar([um(g => { g.tipo_registro = 'gabarito'; g.pdf_sha256 = 'a'.repeat(64); })]), /Gabarito/);
  assert.throws(() => avaliar([um((g, p) => { p.tipo_registro = 'extracao'; })]), /reais/);
  assert.throws(() => avaliar([]), /não vazio/);
  assert.throws(() => avaliar([{ ...d, categoria: '__proto__' }]), /Categoria/);
});
test('não altera gabarito, exemplos ou saída bruta', () => {
  const lote = criarLoteDemonstracao(); const antes = structuredClone(lote);
  avaliarSinteticos(lote); assert.deepEqual(lote, antes);
});
test('CLI preserva entrada bruta e recusa sobrescrever rodada', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'salvaai-avaliador-'));
  const entrada = path.join(dir, 'entrada.json'), saida = path.join(dir, 'rodada');
  const bytes = JSON.stringify(criarLoteDemonstracao(), null, 2);
  fs.writeFileSync(entrada, bytes);
  const args = [fileURLToPath(new URL('./avaliar-sinteticos.mjs', import.meta.url)), '--sintetico', entrada, '--saida', saida];
  assert.equal(spawnSync(process.execPath, args, { encoding: 'utf8' }).status, 0);
  assert.equal(fs.readFileSync(path.join(saida, 'entrada-sintetica.json'), 'utf8'), bytes);
  const antes = fs.readFileSync(path.join(saida, 'relatorio.json'), 'utf8');
  assert.equal(spawnSync(process.execPath, args, { encoding: 'utf8' }).status, 1);
  assert.equal(fs.readFileSync(path.join(saida, 'relatorio.json'), 'utf8'), antes);
  assert.equal(JSON.parse(antes).natureza, 'sintetica');
});
