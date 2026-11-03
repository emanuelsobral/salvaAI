// A synthetic CCITT scan tests actual PDF readers in Vite and in emitted assets.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer, build, preview } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.ok(process.env.PDF_QA_DIR, 'Set PDF_QA_DIR outside the repository.');
const output = path.resolve(process.env.PDF_QA_DIR);
const relative = path.relative(root, output);
assert.ok(path.isAbsolute(relative) || relative === '..' || relative.startsWith('..' + path.sep));
await mkdir(output, { recursive: true });
const bytes = [...await readFile(path.join(root, 'tests/fixtures/ccitt-contract.pdf'))];
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const report = [];
let server;
try {
  for (const mode of ['development', 'build']) {
    if (mode === 'development') {
      server = await createServer({ root, server: { host: '127.0.0.1', port: 5183, strictPort: true } });
      await server.listen();
    } else {
      await build({ root, build: { outDir: path.join(output, 'build'), emptyOutDir: true,
        rollupOptions: { input: path.join(root, 'tests/fixtures/pdf-decoding.html') } } });
      server = await preview({ root, build: { outDir: path.join(output, 'build') }, preview: { host: '127.0.0.1', port: 5183, strictPort: true } });
    }
    const context = await browser.newContext();
    const warnings = [], blocked = [], decoders = [];
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') return route.continue();
      blocked.push(url.origin); return route.abort();
    });
    const page = await context.newPage();
    page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()); });
    page.on('response', response => { if (response.url().includes('/pdf-runtime/')) decoders.push({ url: new URL(response.url()).pathname, status: response.status() }); });
    await page.goto('http://127.0.0.1:5183/tests/fixtures/pdf-decoding.html', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.checkPdfDecoding === 'function');
    const statement = await page.evaluate(bytes => window.checkPdfDecoding(bytes, 'statement'), bytes);
    assert.ok(statement.darkPixels > 1000 && statement.darkPixels < 100000, 'The scanned image must not disappear or become a solid block.');
    const contract = await page.evaluate(bytes => window.checkPdfDecoding(bytes, 'contract'), bytes);
    assert.match(contract[0], /2[.]200,00/);
    assert.match(contract[0], /dia 20/i);
    assert.ok(decoders.some(d => d.url.endsWith('jbig2.wasm') && d.status === 200));
    assert.deepEqual(warnings.filter(w => /Unable to decode|failed to initialize|wasmUrl|Dependent image/.test(w)), []);
    assert.deepEqual(blocked, []);
    report.push({ mode, statement, contract, decoders, passed: true });
    console.log(`OK: ${mode}: CCITT visible in statement reader and recognized by contract OCR, without external requests.`);
    await context.close();
    if (mode === 'development') await server.close();
    else { server.httpServer.closeAllConnections(); await new Promise(resolve => server.httpServer.close(resolve)); }
    server = null;
  }
} finally {
  await writeFile(path.join(output, 'result.json'), JSON.stringify(report, null, 2));
  await browser.close();
  if (server?.close) await server.close();
  else if (server?.httpServer) { server.httpServer.closeAllConnections(); await new Promise(resolve => server.httpServer.close(resolve)); }
}
