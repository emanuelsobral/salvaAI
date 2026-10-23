/** Preparação de E06: somente exemplos, sem acesso a PDFs ou gabaritos reais. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const base = path.dirname(fileURLToPath(import.meta.url));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const esquema = fs.readFileSync(path.join(base, 'registro.schema.json'));
const validar = ajv.compile(JSON.parse(esquema));
export const CAMPOS = ['valor_parcela', 'numero_parcelas', 'data_vencimento', 'vigencia', 'regra_reajuste'];
export const VERSAO_AVALIADOR = '0.1.0';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const texto = s => s.normalize('NFC').toLowerCase().replace(/\s+/gu, ' ').trim();
const aliases = new Map([
  ['ipca', 'ipca'], ['índice nacional de preços ao consumidor amplo', 'ipca'],
  ['igp-m', 'igp-m'], ['igp m', 'igp-m'], ['igpm', 'igp-m'],
  ['índice geral de preços - mercado', 'igp-m'], ['índice geral de preços do mercado', 'igp-m'],
  ['inpc', 'inpc'], ['índice nacional de preços ao consumidor', 'inpc'],
]);

function normalizarValor(valor) {
  const copia = structuredClone(valor);
  if (typeof copia?.regra === 'string') copia.regra = texto(copia.regra);
  if (Array.isArray(copia?.indices)) {
    copia.indices = [...new Set(copia.indices.map(i => aliases.get(texto(i)) ?? texto(i)))].sort();
  }
  return copia;
}

// Apenas para valores já validados no registro completo; não remove condições.
export function compararValores(campo, esperado, previsto) {
  if (!CAMPOS.includes(campo)) throw new Error('Campo desconhecido.');
  const a = normalizarValor(esperado), b = normalizarValor(previsto);
  const exato = isDeepStrictEqual(a, b);
  let tolerante = exato;
  if (!exato && campo === 'valor_parcela' && a?.tipo === 'fixo' && b?.tipo === 'fixo' &&
      /^\d+\.\d{2}$/.test(a.quantia) && /^\d+\.\d{2}$/.test(b.quantia)) {
    const diferenca = BigInt(a.quantia.replace('.', '')) - BigInt(b.quantia.replace('.', ''));
    tolerante = diferenca >= -1n && diferenca <= 1n &&
      isDeepStrictEqual({ ...a, quantia: null }, { ...b, quantia: null });
  }
  return { exato, tolerante };
}

function contagens() {
  return { D: 0, G: 0, P: 0, TP: 0, FP: 0, FN: 0, A: 0, omissoes: 0,
    alta: 0, erros_alta: 0, ambiguos: 0, ilegiveis: 0, respostas_excluidas: 0, alta_excluida: 0 };
}
const resumo = () => ({ exato: contagens(), tolerante: contagens() });
const grupo = () => ({ global: resumo(), campos: Object.fromEntries(CAMPOS.map(c => [c, resumo()])) });

export function fracao(numerador, denominador) {
  return { numerador, denominador, valor: denominador ? numerador / denominador : null,
    rotulo: denominador ? 'proporção' : 'não aplicável' };
}

function metricas(c) {
  return {
    acerto: fracao(c.TP + c.A, c.D), precisao: fracao(c.TP, c.TP + c.FP),
    revocacao: fracao(c.TP, c.TP + c.FN), taxa_nao_identificados: fracao(c.omissoes, c.G),
    erro_alta_confianca: fracao(c.erros_alta, c.alta),
    acerto_presentes: fracao(c.TP, c.G), acerto_ausentes: fracao(c.A, c.D - c.G),
    cobertura_alta_confianca: fracao(c.alta, c.D),
    proporcao_alta_entre_respostas: fracao(c.alta, c.P),
  };
}

function contar(c, g, p, correspondencia, exato) {
  const respondeu = p?.estado === 'encontrado';
  const alta = respondeu && p.confianca === 'alta';
  if (g.estado === 'ambiguo' || g.estado === 'ilegivel') {
    c[g.estado === 'ambiguo' ? 'ambiguos' : 'ilegiveis']++;
    c.respostas_excluidas += Number(respondeu);
    c.alta_excluida += Number(alta);
    return;
  }
  c.D++;
  const presente = g.estado === 'presente';
  c.G += Number(presente);
  c.P += Number(respondeu);
  const correto = presente && respondeu && correspondencia;
  c.TP += Number(correto);
  c.FP += Number(respondeu && !correto);
  c.FN += Number(presente && !correto);
  c.A += Number(!presente && p?.estado === 'nao_identificado');
  c.omissoes += Number(presente && !respondeu);
  c.alta += Number(alta);
  // A faixa de confiança sempre usa acerto exato, inclusive no relatório tolerante.
  c.erros_alta += Number(alta && !(presente && exato));
}

function finalizar(g) {
  for (const r of [g.global, ...Object.values(g.campos)]) {
    for (const modo of ['exato', 'tolerante']) r[modo] = { contagens: r[modo], metricas: metricas(r[modo]) };
  }
  return g;
}

function registroValido(r) {
  if (!validar(r)) return false;
  const v = r.campos.vigencia.valor;
  return !(v?.inicio && v?.fim && v.fim < v.inicio);
}

function lerPrevisao(d) {
  let r;
  try { r = JSON.parse(d.extracao_bruta); } catch { return { codigo: 'JSON_INVALIDO', registro: null }; }
  if (r?.tipo_registro === 'extracao' || r?.tipo_registro === 'gabarito' || r?.pdf_sha256 != null) {
    throw new Error('Registros reais não são aceitos nesta preparação sintética.');
  }
  if (r?.documento_id && r.documento_id !== d.gabarito.documento_id) throw new Error('Identidade da extração divergente.');
  if (r?.tipo_registro !== 'exemplo_extracao' || !registroValido(r)) return { codigo: 'JSON_INVALIDO', registro: null };
  return { codigo: null, registro: r };
}

export function avaliarSinteticos(lote) {
  if (lote?.natureza !== 'sintetica' || lote.protocolo_versao !== '1.0.0' ||
      !Array.isArray(lote.documentos) || !lote.documentos.length) throw new Error('Informe um lote sintético não vazio do protocolo 1.0.0.');
  const ids = new Set(), total = grupo(), categorias = {}, formatos = {}, documentos = [];
  const processamento = { documentos: 0, concluidos: 0, parciais: 0, falhas: 0, jsons_invalidos: 0 };
  for (const d of lote.documentos) {
    const g = d?.gabarito;
    if (g?.tipo_registro !== 'exemplo_gabarito' || !registroValido(g) ||
        g.anotacao.estado_revisao === 'divergencias_pendentes') throw new Error('Gabarito sintético inválido ou não resolvido; lote recusado.');
    if (ids.has(g.documento_id)) throw new Error('Documento duplicado; lote recusado.');
    ids.add(g.documento_id);
    if (!['aluguel', 'financiamento', 'educacao', 'saude'].includes(d.categoria) ||
        !['texto', 'digitalizado', 'misto', 'protegido', 'invalido'].includes(d.formato)) throw new Error('Categoria/formato inválido.');
    const sim = d.simulacao;
    if (!['concluido', 'parcial', 'falhou'].includes(sim?.status) ||
        !Number.isSafeInteger(sim?.duracao_ms) || sim.duracao_ms < 0 ||
        !(typeof d.extracao_bruta === 'string' || (sim.status === 'falhou' && d.extracao_bruta === null))) {
      throw new Error('Metadados da simulação inválidos.');
    }
    const previsao = d.extracao_bruta === null ? { registro: null, codigo: 'FALHA_EXECUCAO' } : lerPrevisao(d);
    // Falha completa/formato inválido implica cinco abstenções. Em processamento
    // parcial válido, avaliar os estados de cada campo, preservando os erros locais.
    const falha = sim.status === 'falhou' || previsao.codigo;
    const p = falha ? null : previsao.registro;
    processamento.documentos++;
    processamento[{ concluido: 'concluidos', parcial: 'parciais', falhou: 'falhas' }[sim.status]]++;
    processamento.jsons_invalidos += Number(previsao.codigo === 'JSON_INVALIDO');
    const destinos = [total, categorias[d.categoria] ??= grupo(), formatos[d.formato] ??= grupo()];
    const detalhes = {};
    for (const campo of CAMPOS) {
      const previsto = p?.campos[campo];
      const cmp = g.campos[campo].estado === 'presente' && previsto?.estado === 'encontrado'
        ? compararValores(campo, g.campos[campo].valor, previsto.valor) : { exato: false, tolerante: false };
      for (const destino of destinos) {
        for (const alvo of [destino.global, destino.campos[campo]]) {
          for (const modo of ['exato', 'tolerante']) contar(alvo[modo], g.campos[campo], previsto, cmp[modo], cmp.exato);
        }
      }
      detalhes[campo] = { gabarito: g.campos[campo].estado, previsto: previsto?.estado ?? 'erro_leitura',
        excluido: ['ambiguo', 'ilegivel'].includes(g.campos[campo].estado), correspondencia: cmp };
    }
    documentos.push({ id: g.documento_id, categoria: d.categoria, formato: d.formato,
      simulacao: structuredClone(sim), codigo: previsao.codigo ?? (falha ? 'FALHA_PROCESSAMENTO' : sim.status === 'parcial' ? 'FALHA_PARCIAL' : null),
      extracao_sha256: d.extracao_bruta === null ? null : sha(d.extracao_bruta), campos: detalhes });
  }
  return { natureza: 'sintetica', versao_avaliador: VERSAO_AVALIADOR, protocolo_versao: '1.0.0',
    aviso: 'Teste do comparador com dados fictícios. Não mede desempenho em contratos reais.',
    processamento, ...finalizar(total),
    categorias: Object.fromEntries(Object.entries(categorias).map(([k, v]) => [k, finalizar(v)])),
    formatos: Object.fromEntries(Object.entries(formatos).map(([k, v]) => [k, finalizar(v)])), documentos };
}

function main() {
  const [flag, entrada, saidaFlag, saida, ...extras] = process.argv.slice(2);
  if (flag !== '--sintetico' || !entrada || saidaFlag !== '--saida' || !saida || extras.length) {
    throw new Error('Uso: node avaliar-sinteticos.mjs --sintetico lote.json --saida NOVA_PASTA');
  }
  if (fs.statSync(entrada).size > 10 * 1024 * 1024) throw new Error('Lote acima de 10 MiB.');
  const bruto = fs.readFileSync(entrada);
  const relatorio = avaliarSinteticos(JSON.parse(bruto));
  // Validar tudo antes de escrever; pasta nova obrigatória, sem sobrescrever rodadas.
  fs.mkdirSync(saida);
  fs.writeFileSync(path.join(saida, 'entrada-sintetica.json'), bruto, { flag: 'wx' });
  fs.writeFileSync(path.join(saida, 'relatorio.json'), JSON.stringify(relatorio, null, 2) + '\n', { flag: 'wx' });
  const fontes = Object.fromEntries(['avaliar-sinteticos.mjs', 'registro.schema.json', 'protocolo.md'].map(nome => {
    const bytes = fs.readFileSync(path.join(base, nome));
    fs.writeFileSync(path.join(saida, nome + '.snapshot'), bytes, { flag: 'wx' });
    return [nome, sha(bytes)];
  }));
  fs.writeFileSync(path.join(saida, 'manifesto.json'), JSON.stringify({ natureza: 'sintetica',
    executado_em: new Date().toISOString(), node: process.version, versao_avaliador: VERSAO_AVALIADOR,
    entrada_sha256: sha(bruto), fontes_sha256: fontes }, null, 2) + '\n', { flag: 'wx' });
  console.log('Comparação sintética preservada em: ' + path.resolve(saida));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
