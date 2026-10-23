/** Quatro cenários fictícios do protocolo; nenhum documento real é consultado. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function campoVazio(estado) {
  return { estado, valor: null, evidencias: [], confianca: 'nao_aplicavel', regra_id: null,
    motivo: 'Estado definido para teste fictício, sem anotação humana.' };
}
export function documentoFicticio(id = 'teste-001') {
  const gabarito = JSON.parse(fs.readFileSync(new URL('./gabarito-sintetico.json', import.meta.url)));
  const extracao = JSON.parse(fs.readFileSync(new URL('./extracao-sintetica.json', import.meta.url)));
  gabarito.documento_id = extracao.documento_id = id;
  return { gabarito, extracao };
}
export function entradaFicticia(gabarito, extracao, extras = {}) {
  return { categoria: 'aluguel', formato: 'texto', gabarito,
    extracao_bruta: extracao === null ? null : JSON.stringify(extracao),
    simulacao: { status: extracao === null ? 'falhou' : 'concluido', duracao_ms: 1 }, ...extras };
}
export function criarLoteDemonstracao() {
  const documentos = [];
  const misto = documentoFicticio('misto');
  misto.gabarito.campos.regra_reajuste = campoVazio('ausente');
  misto.extracao.campos.regra_reajuste = campoVazio('nao_identificado');
  misto.extracao.campos.vigencia = campoVazio('nao_identificado');
  misto.extracao.campos.numero_parcelas.valor.quantidade = 13;
  misto.extracao.campos.data_vencimento.confianca = 'media';
  documentos.push(entradaFicticia(misto.gabarito, misto.extracao));
  for (const id of ['campo_ausente_preenchido', 'falha_total_com_gabarito_presente', 'ausencia_correta']) {
    const { gabarito, extracao } = documentoFicticio(id);
    for (const nome of Object.keys(gabarito.campos)) {
      if (nome !== 'valor_parcela') {
        gabarito.campos[nome] = campoVazio('ambiguo');
        extracao.campos[nome] = campoVazio('nao_identificado');
      }
    }
    if (id !== 'falha_total_com_gabarito_presente') gabarito.campos.valor_parcela = campoVazio('ausente');
    if (id === 'ausencia_correta') extracao.campos.valor_parcela = campoVazio('nao_identificado');
    documentos.push(entradaFicticia(gabarito, id === 'falha_total_com_gabarito_presente' ? null : extracao));
  }
  return { natureza: 'sintetica', protocolo_versao: '1.0.0', documentos };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(criarLoteDemonstracao(), null, 2) + '\n');
}
