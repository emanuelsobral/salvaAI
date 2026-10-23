import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { conferir } from './conferir-gabarito.mjs';

const exemplo = JSON.parse(fs.readFileSync(new URL('./examples/gabarito-sintetico.json', import.meta.url), 'utf8'));
const item = { id: 'ficticio', sha256: 'a'.repeat(64), paginas: 1, status_coleta: 'baixado' };
function formulario() {
  const registro = structuredClone(exemplo);
  Object.assign(registro, { tipo_registro: 'gabarito', documento_id: item.id, pdf_sha256: item.sha256 });
  registro.anotacao = { anotador_id: 'pessoa-ficticia-a', revisor_id: null, estado_revisao: 'revisao_unica', data: '2026-10-13' };
  return { status: 'rascunho_nao_avaliavel', confirmacao_leitura_humana: true, registro };
}

test('aceita estrutura fictícia completa sem produzir gabarito real', () => {
  assert.deepEqual(conferir(formulario(), item), []);
});
test('rejeita leitura humana não confirmada', () => {
  const f = formulario(); f.confirmacao_leitura_humana = false;
  assert.ok(conferir(f, item).some(e => e.includes('Leitura humana')));
});
test('rejeita campo ainda não anotado e campo nulo', () => {
  for (const campo of [null, { ...formulario().registro.campos.valor_parcela, estado: null, valor: null }]) {
    const f = formulario(); f.registro.campos.valor_parcela = campo;
    assert.ok(conferir(f, item).length > 0);
  }
});
test('rejeita página fora do PDF e hash diferente', () => {
  const f = formulario(); f.registro.pdf_sha256 = 'b'.repeat(64);
  f.registro.campos.valor_parcela.evidencias[0].pagina = 2;
  const erros = conferir(f, item);
  assert.ok(erros.some(e => e.includes('hash')));
  assert.ok(erros.some(e => e.includes('página fora')));
});
test('rejeita data impossível e vigência invertida', () => {
  const f = formulario(); f.registro.anotacao.data = '2027-02-30';
  f.registro.campos.vigencia.valor.fim = '2026-01-01';
  const erros = conferir(f, item);
  assert.ok(erros.some(e => e.includes('date')));
  assert.ok(erros.some(e => e.includes('fim anterior')));
});
test('rejeita falsa revisão independente e divergência pendente', () => {
  const f = formulario();
  Object.assign(f.registro.anotacao, { estado_revisao: 'revisado', revisor_id: 'pessoa-ficticia-a' });
  assert.ok(conferir(f, item).some(e => e.includes('outro identificador')));
  f.registro.anotacao.estado_revisao = 'divergencias_pendentes';
  assert.ok(conferir(f, item).some(e => e.includes('divergências')));
});
test('não modifica formulário ao conferir', () => {
  const f = formulario(); const antes = structuredClone(f);
  conferir(f, item); assert.deepEqual(f, antes);
});
