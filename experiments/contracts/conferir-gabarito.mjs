/** Confere preenchimento humano e esquema; não gera nem corrige valores do gabarito. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const base = path.dirname(fileURLToPath(import.meta.url));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validar = ajv.compile(JSON.parse(fs.readFileSync(path.join(base, 'registro.schema.json'), 'utf8')));

export function conferir(formulario, item) {
  const erros = [];
  const r = formulario.registro;
  if (!r?.campos || !r.anotacao) return ['Estrutura do formulário incompleta.'];
  if (formulario.confirmacao_leitura_humana !== true) erros.push('Leitura humana independente ainda não confirmada.');
  if (!item || item.status_coleta !== 'baixado') erros.push('Documento fora da amostra coletada.');
  if (r.tipo_registro !== 'gabarito') erros.push('O registro deve ser gabarito, nunca saída do extrator.');
  if (item && (r.documento_id !== item.id || r.pdf_sha256 !== item.sha256)) erros.push('Identificador ou hash não corresponde ao PDF catalogado.');
  const pendentes = Object.entries(r.campos).filter(([, c]) => c?.estado == null).map(([nome]) => nome);
  if (pendentes.length) erros.push('Campos ainda não anotados: ' + pendentes.join(', ') + '.');
  if (!validar(r)) erros.push(...validar.errors.map(e => `${e.instancePath || '/'}: ${e.message}`));
  if (r.anotacao.estado_revisao === 'divergencias_pendentes') erros.push('Resolver divergências antes de avaliar.');
  if (r.anotacao.estado_revisao === 'revisado' && r.anotacao.anotador_id === r.anotacao.revisor_id) erros.push('A revisão independente exige outro identificador de pessoa.');
  for (const [nome, campo] of Object.entries(r.campos)) {
    for (const evidencia of Array.isArray(campo?.evidencias) ? campo.evidencias : []) {
      if (!Number.isInteger(evidencia?.pagina) || evidencia.pagina < 1 || evidencia.pagina > (item?.paginas ?? 0)) {
        erros.push(`${nome}: página fora do documento.`);
      }
    }
    if (nome === 'vigencia' && campo?.valor?.inicio && campo.valor?.fim && campo.valor.fim < campo.valor.inicio) {
      erros.push('vigencia: fim anterior ao início.');
    }
  }
  return [...new Set(erros)];
}

function main() {
  const [arquivo, ...opcoes] = process.argv.slice(2);
  if (!arquivo) throw new Error('Informe o arquivo ID.rascunho.json preenchido por uma pessoa.');
  if (opcoes.length && (opcoes.length !== 2 || opcoes[0] !== '--catalogo')) {
    throw new Error('Opção suportada: --catalogo caminho/arquivo.json');
  }
  const arquivoCatalogo = opcoes.length ? opcoes[1] : path.join(base, 'amostra-piloto-v1.json');
  const catalogo = JSON.parse(fs.readFileSync(arquivoCatalogo, 'utf8'));
  const formulario = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const item = catalogo.documentos.find(i => i.id === formulario.registro?.documento_id);
  const erros = conferir(formulario, item);
  if (item?.status_coleta === 'baixado') {
    const hash = createHash('sha256').update(fs.readFileSync(path.join(base, item.arquivo))).digest('hex');
    if (hash !== item.sha256) erros.push('O PDF local mudou desde o catálogo.');
  }
  if (erros.length) {
    console.error('PENDENTE — formulário não pronto para avaliação:\n- ' + erros.join('\n- '));
    process.exitCode = 1;
  } else {
    console.log('Estrutura e consistência aprovadas. Conteúdo, transcrição e independência exigem revisão humana.');
    console.log('Nenhum arquivo foi alterado, aprovado como verdade ou congelado por esta conferência.');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
