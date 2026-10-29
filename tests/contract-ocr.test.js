import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import * as ocr from '../src/utils/contractOcr.js';
import { prepareSourceReview, validateSourceReview } from '../src/utils/contractExtraction.js';

async function reader(pages, imageReader) {
  let destroyed = 0;
  const context = vm.createContext({ TextDecoder, Uint8Array, crypto: webcrypto });
  const stub = values => new vm.SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  const image = stub({ readPdfPageImage: imageReader, readPdfPageWithAI: imageReader });
  await image.link(() => {}); await image.evaluate();
  const source = await readFile(new URL('../src/utils/contractPdf.js', import.meta.url), 'utf8');
  const module = new vm.SourceTextModule(source, { context, importModuleDynamically: () => image });
  await module.link(specifier => specifier.endsWith('contractOcr.js') ? stub(ocr) : specifier.includes('?url') ? stub({ default: 'worker' }) : stub({ GlobalWorkerOptions: {}, getDocument: () => ({ destroy: async () => { destroyed++; }, promise: Promise.resolve({ numPages: pages.length, getPage: async n => ({ getTextContent: async () => ({ items: [{ str: pages[n - 1] }] }), cleanup() {} }) }) }) }));
  await module.evaluate();
  const file = { name: 'ficticio.pdf', size: 8, arrayBuffer: async () => new TextEncoder().encode('%PDF-1.4').buffer };
  return { read: options => module.namespace.readContractPdf(file, options), destroyed: () => destroyed };
}

test('OCR de contrato preserva caracteres incertos e quebras; vazio e excesso bloqueiam', () => {
  assert.equal(ocr.contractOcrText({ text: '  R$ 1O0,00\n31/02/2027  ' }, 1), 'R$ 1O0,00\n31/02/2027');
  assert.throws(() => ocr.contractOcrText({ text: ' ' }, 2), /página 2/);
  assert.throws(() => ocr.contractOcrText({ text: 'x'.repeat(200001) }, 1), /limite/);
});

test('OCR lê todas as páginas sequencialmente, inclusive página com camada de texto', async () => {
  const calls = [];
  const r = await reader(['Texto parcial', ''], async (_, n) => { calls.push(n); return { text: `Imagem ${n}` }; });
  const result = await r.read({ useOcr: true });
  assert.deepEqual(Array.from(result.pages), ['Imagem 1', 'Imagem 2']);
  assert.deepEqual(calls, [1, 2]); assert.equal(r.destroyed(), 1);
});

test('leitura normal não usa OCR; falha em qualquer página não retorna resultado parcial', async () => {
  let calls = 0;
  const normal = await reader(['Texto'], async () => { calls++; });
  assert.equal((await normal.read()).pages[0], 'Texto'); assert.equal(calls, 0);
  const incomplete = await reader(['', ''], async (_, n) => ({ text: n === 1 ? 'Texto' : '' }));
  await assert.rejects(incomplete.read({ useOcr: true }), /página 2/);
  assert.equal(incomplete.destroyed(), 1);
});

test('OCR aplica limite antes de reconhecer e respeita cancelamento entre páginas', async () => {
  let calls = 0;
  const limited = await reader(Array(51).fill(''), async () => { calls++; });
  await assert.rejects(limited.read({ useOcr: true }), /Limite de 50/); assert.equal(calls, 0);
  const controller = new AbortController();
  const cancelled = await reader(['', ''], async () => { calls++; controller.abort(); return { text: 'Não aplicar' }; });
  await assert.rejects(cancelled.read({ useOcr: true, signal: controller.signal }), /cancelada/);
  assert.equal(calls, 1); assert.ok(cancelled.destroyed() >= 1);
});

test('origem OCR é distinta, preserva evidências e rejeita métodos desconhecidos', () => {
  const fields = Object.fromEntries(['valor_parcela', 'numero_parcelas', 'data_vencimento', 'vigencia', 'regra_reajuste'].map(key => [key, { estado: 'nao_identificado', motivo: 'Teste', evidencias: [], valor: null }]));
  const source = prepareSourceReview({ version: '0.1.25', fields }, ['Texto'], 'a'.repeat(64), { useOcr: true });
  assert.equal(source.method, 'PDF_OCR_REVIEW'); assert.deepEqual(JSON.parse(source.resultJson), fields);
  assert.throws(() => validateSourceReview({ ...source, method: 'API' }));
});

test('DeepSeek lê páginas em ordem, limita dez antes de consumir e não devolve transcrição parcial', async () => {
  let calls = 0;
  const limited = await reader(Array(11).fill(''), async () => { calls++; });
  await assert.rejects(limited.read({ useAi: true }), /Limite de 10/);
  assert.equal(calls, 0);
  const complete = await reader(['', ''], async (_, page) => { calls++; return { text: `Página ${page}` }; });
  assert.deepEqual(Array.from((await complete.read({ useAi: true })).pages), ['Página 1', 'Página 2']);
  const failed = await reader(['', ''], async (_, page) => { if (page === 2) throw Error('DeepSeek indisponível'); return { text: 'Primeira' }; });
  await assert.rejects(failed.read({ useAi: true }), /DeepSeek indisponível/);
  assert.equal(failed.destroyed(), 1);
});
