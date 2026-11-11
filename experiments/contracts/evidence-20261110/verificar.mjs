import fs from 'node:fs';
import assert from 'node:assert/strict';
import { avaliarSinteticos } from './comparador/avaliar-sinteticos.mjs';

const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const resultados = [];
for (const lote of ['reservados_v0125', 'preenchidos_v0125', 'S1_v0125', 'S2_v0125']) {
  const atual = avaliarSinteticos(read(`./entradas/${lote}.json`));
  const original = read(`./referencias/${lote}/relatorio.json`);
  // Hashes das strings mudam com as supressões; métricas e decisões precisam coincidir.
  for (const chave of ['processamento', 'global', 'campos', 'categorias', 'formatos']) {
    assert.deepEqual(atual[chave], original[chave], `${lote}: divergência em ${chave}`);
  }
  assert.deepEqual(atual.documentos.map(({ extracao_sha256, ...resto }) => resto),
    original.documentos.map(({ extracao_sha256, ...resto }) => resto), `${lote}: decisões divergentes`);
  resultados.push({ lote, metricas_e_decisoes_iguais: true });
}
console.log(JSON.stringify({ verificacao: 'edicao publica versus historico', resultados }, null, 2));
