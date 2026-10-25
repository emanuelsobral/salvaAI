// Only the two explicitly identified DEVELOPMENT documents. No held-out test PDFs.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
if (!process.env.CONTRACT_QA_DIR) throw Error('Informe CONTRACT_QA_DIR para salvar o diagnóstico local.');
const output = path.resolve(process.env.CONTRACT_QA_DIR);
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(path.join(root, 'experiments/contracts/amostra-piloto-v1.json'), 'utf8'));
const catalog = manifest.documentos;
const selected = ['sau-04', 'sau-05'].map(id => catalog.find(item => item.id === id));
for (const item of selected) assert.equal(item?.divisao, 'desenvolvimento');
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5179', '--strictPort'], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; vite.stdout.on('data', chunk => { log += chunk; }); vite.stderr.on('data', chunk => { log += chunk; });
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
let browser;
const summary = [];
try {
  const url = 'http://127.0.0.1:5179/tests/fixtures/contract-ocr.html';
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (vite.exitCode !== null) throw Error(log);
    try { if ((await fetch(url)).ok) { ready = true; break; } } catch { /* Startup */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, log);
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext();
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const page = await context.newPage();
  let previous = '';
  await page.exposeFunction('ocrProgress', message => {
    const match = message.match(/^Página \d+ de \d+/);
    if (match && match[0] !== previous) { previous = match[0]; console.log(previous); }
  });
  await page.goto(url); await page.waitForFunction(() => typeof window.readOcrContract === 'function');
  for (const item of selected) {
    const bytes = await readFile(path.join(root, 'experiments/contracts', item.arquivo));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
    const started = Date.now(); console.log(`Iniciando ${item.id}, ${item.paginas} páginas.`);
    try {
      const result = await page.evaluate(({ bytes, name }) => window.readOcrContract(bytes, name), { bytes: [...bytes], name: `${item.id}.pdf` });
      assert.equal(result.pages.length, item.paginas);
      await writeFile(path.join(output, `${item.id}.ocr.json`), JSON.stringify(result, null, 2));
      summary.push({ id: item.id, pages: result.pages.length, characters: result.pages.map(text => text.length), seconds: Math.round((Date.now() - started) / 1000), states: Object.fromEntries(Object.entries(result.extraction.fields).map(([key, field]) => [key, field.estado])) });
      console.log(`${item.id}: leitura e evidências concluídas, sem gravação no banco.`);
    } catch (error) {
      summary.push({ id: item.id, error: error.message, seconds: Math.round((Date.now() - started) / 1000) });
      console.log(`${item.id}: falha preservada no relatório.`);
    }
  }
  await writeFile(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2));
  assert.ok(summary.every(item => !item.error), 'Há falhas no relatório de OCR.');
} finally { await browser?.close(); vite.kill(); }
