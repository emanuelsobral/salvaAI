// Smoke test of the emitted worker and self-hosted runtime, without Firebase or external requests.
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { contractLines } from './contracts-pdf-fixture.mjs';

if (!process.env.CONTRACT_BUILD_DIR) throw Error('Informe CONTRACT_BUILD_DIR com o build a conferir.');
const root = path.resolve(process.env.CONTRACT_BUILD_DIR);
const files = await readdir(path.join(root, 'assets'));
const worker = files.find(name => /^contractExtraction\.worker-.*\.js$/.test(name));
assert.ok(worker, 'Worker de contratos ausente no build.');
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><title>Teste local</title><div id="root"></div>'); return; }
    // Restrict serving to build assets, never the project's source or environment.
    if (!/^\/(assets|contract-runtime|ocr)\/[\w.-]+$/.test(pathname)) { response.writeHead(404).end(); return; }
    const data = await readFile(path.join(root, pathname.slice(1)));
    response.setHeader('Content-Type', pathname.endsWith('.wasm') ? 'application/wasm' : /\.m?js$/.test(pathname) ? 'text/javascript' : 'application/octet-stream');
    response.end(data);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext();
  const blocked = [];
  await context.route('**/*', route => {
    if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue();
    blocked.push(route.request().url()); return route.abort();
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const result = await page.evaluate(({ worker, lines }) => new Promise((resolve, reject) => {
    const reader = new Worker(`/assets/${worker}`, { type: 'module' });
    const timeout = setTimeout(() => { reader.terminate(); reject(Error('Timeout do leitor compilado.')); }, 90000);
    const finish = (error, value) => { clearTimeout(timeout); reader.terminate(); if (error) reject(Error(error)); else resolve(value); };
    reader.onerror = () => finish('Falha no worker compilado.');
    reader.onmessage = ({ data }) => { if (data.error) finish(data.error); else if (data.result) finish(null, data.result); };
    reader.postMessage({ pages: [lines.join('\n')] });
  }), { worker, lines: contractLines });
  assert.equal(result.version, '0.1.25');
  assert.equal(result.fields.valor_parcela.valor.quantia, '1200.00');
  assert.equal(result.fields.numero_parcelas.valor.quantidade, 12);
  for (const field of Object.values(result.fields)) assert.equal(field.estado, 'encontrado');
  const ocrModule = files.find(name => /^pdfOcr-.*\.js$/.test(name));
  assert.ok(ocrModule, 'Módulo OCR ausente no build.');
  const ocrText = await page.evaluate(async ({ file, lines }) => {
    const { readPdfPageImage } = await import(`/assets/${file}`);
    // A controlled raster tests the compiled OCR module and its deployed worker/language paths.
    const document = { getPage: async () => ({
      getViewport: ({ scale }) => ({ width: 1600 * scale, height: 1000 * scale }),
      render: ({ canvasContext: ctx, viewport }) => {
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, viewport.width, viewport.height);
        ctx.scale(viewport.width / 1600, viewport.height / 1000);
        ctx.fillStyle = 'black'; ctx.font = '28px Arial';
        lines.forEach((line, index) => ctx.fillText(line, 70, 120 + index * 100));
        return { promise: Promise.resolve(), cancel() {} };
      },
    }) };
    return (await readPdfPageImage(document, 1)).text;
  }, { file: ocrModule, lines: contractLines });
  assert.match(ocrText, /1\.200,00/); assert.match(ocrText, /12 parcelas/);
  assert.deepEqual(blocked, []);
  console.log('Build aprovado no navegador: regras locais e OCR compilado com recursos do próprio site, sem requisições externas.');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
