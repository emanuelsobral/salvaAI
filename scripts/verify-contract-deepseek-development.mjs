// Opt-in development run: one public PDF, real OCR, local extraction and emulator-only writes.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { createAiHandler } from '../server/ai-handler.js';
import { requestRecord, artifactRecords } from './contract-run-record.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080', 'Use the local Firestore emulator.');
const replayInput = process.env.CONTRACT_REPLAY_DIR;
if (!replayInput) assert.equal(process.env.CONTRACT_ALLOW_LIVE_AI, '1', 'Real API calls require CONTRACT_ALLOW_LIVE_AI=1.');
assert.ok(process.env.CONTRACT_QA_DIR, 'Set CONTRACT_QA_DIR outside the repository.');
const output = path.resolve(process.env.CONTRACT_QA_DIR);
const relativeOutput = path.relative(root, output);
assert.ok(path.isAbsolute(relativeOutput) || relativeOutput === '..' || relativeOutput.startsWith('..' + path.sep), 'Keep public-document output outside the repository.');
await mkdir(output, { recursive: true });
assert.ok(!(await readdir(output)).some(name => /^(summary\.json|provider-\d+\.json|page-\d+\.json|text\.json|deepseek\.json)$/.test(name)), 'Use a new output directory to preserve prior results.');
const catalog = JSON.parse(await readFile(path.join(root, 'experiments/contracts/amostra-preenchidos-v1.json'), 'utf8'));
const item = catalog.documentos.find(record => record.id === 'pub-alu-03');
assert.equal(item?.divisao, 'desenvolvimento');
assert.equal(item.origem, 'publica');
assert.equal(item.paginas, 5);
const pdfPath = path.join(root, 'experiments/contracts', item.arquivo);
const bytes = await readFile(pdfPath);
const hash = value => createHash('sha256').update(value).digest('hex');
assert.equal(hash(bytes), item.sha256, 'The original PDF changed.');
const env = { ...loadEnv('development', root, ''), ...process.env };
if (!replayInput) assert.ok(env.DEEPSEEK_API_KEY?.trim(), 'Configure the private API key locally.');
const report = { document: item.id, pdfSha256: item.sha256, startedAt: new Date().toISOString(),
  independentGroundTruth: false, realProvider: !replayInput, replayInput: replayInput || null, authentication: 'injected test identity',
  persistence: 'local Firestore emulator only', providerCalls: 0, checks: [], modes: {} };
const recorded = new Map();
const runtimeManifest = JSON.parse(execFileSync(process.execPath, ['scripts/contract-runtime-manifest.mjs'], { cwd: root, encoding: 'utf8' }));
await writeFile(path.join(output, 'runtime-manifest.json'), JSON.stringify(runtimeManifest, null, 2), { flag: 'wx' });
const provenance = { schemaVersion: 1, startedAt: report.startedAt, pdfSha256: item.sha256,
  mode: replayInput ? 'replay' : 'live', sourceArtifacts: replayInput ? await artifactRecords(replayInput) : [],
  note: 'Current code inventory describes this run, not the code that created older replay responses. Missing original metadata remains unknown.' };
let replay = Boolean(replayInput), providerCalls = 0;
if (replayInput) {
  assert.notEqual(path.resolve(replayInput), output, 'Preserve the original run.');
  const previous = JSON.parse(await readFile(path.join(replayInput, 'summary.json'), 'utf8'));
  assert.equal(previous.pdfSha256, item.sha256);
  for (let number = 1; number <= item.paginas; number++) recorded.set(number, JSON.parse(await readFile(path.join(replayInput, `page-${number}.json`), 'utf8')));
}
const handler = createAiHandler({ env: { ...env, FIREBASE_PROJECT_ID: 'demo-salva-ai' },
  verifyToken: async token => { assert.equal(token, 'development-contract-token'); return { uid: 'contracts-ui' }; },
  fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.deepseek.com/chat/completions');
    assert.ok(++providerCalls <= item.paginas, 'Never repeat provider calls automatically.');
    const start = Date.now();
    const requestMetadata = requestRecord(JSON.parse(options.body));
    const response = await fetch(url, options);
    await writeFile(path.join(output, `provider-${providerCalls}.json`), JSON.stringify({
      request: requestMetadata, status: response.status, elapsedMs: Date.now() - start,
      body: await response.clone().json().catch(() => ({ invalidJson: true })),
    }, null, 2));
    return response;
  },
});
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = 'http://127.0.0.1:5182';
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5182', '--strictPort'], {
  cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env,
    DEEPSEEK_API_KEY: '', VITE_FIREBASE_API_KEY: 'demo-key', VITE_FIREBASE_PROJECT_ID: 'demo-salva-ai',
    VITE_FIREBASE_AUTH_DOMAIN: 'demo-salva-ai.firebaseapp.com', VITE_FIREBASE_APP_ID: 'demo-app' },
});
let log = '', browser, page;
vite.stdout.on('data', chunk => { log += chunk; }); vite.stderr.on('data', chunk => { log += chunk; });
const pass = name => { report.checks.push(name); console.log('OK: ' + name); };
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (vite.exitCode !== null) throw Error('Vite failed to start.');
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch { /* Starting. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Vite did not start.');
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    if (/\/src\/services\/aiService\.js$/.test(url.pathname)) {
      const response = await route.fetch();
      const original = await response.text();
      const body = original.replace(/import\s*\{\s*auth\s*\}\s*from\s*[^;]+;/,
        "const auth = { currentUser: { uid: 'contracts-ui', getIdToken: async () => 'development-contract-token' } };");
      assert.notEqual(body, original, 'Test authentication replacement failed.');
      return route.fulfill({ response, body });
    }
    if (url.pathname === '/api/ai') {
      const body = route.request().postDataJSON();
      assert.equal(body.action, 'contract-ocr');
      assert.ok(body.page >= 1 && body.page <= item.paginas);
      const imageHash = hash(body.image);
      await writeFile(path.join(output, `sent-page-${body.page}.jpg`), Buffer.from(body.image, 'base64'));
      if (replay) {
        const cached = recorded.get(body.page);
        assert.equal(imageHash, cached?.imageHash, 'Only replay the same rendered page.');
        return route.fulfill({ status: cached.status, json: cached.response });
      }
      assert.ok(!recorded.has(body.page), 'Do not repeat a page.');
      const request = new Request(base + '/api/ai', { method: 'POST', headers: route.request().headers(), body: JSON.stringify(body) });
      const response = await handler(request);
      const data = await response.json();
      const record = { imageHash, status: response.status, response: data };
      recorded.set(body.page, record);
      await writeFile(path.join(output, `page-${body.page}.json`), JSON.stringify(record, null, 2));
      console.log(`OCR página ${body.page}/${item.paginas}: HTTP ${response.status}`);
      return route.fulfill({ status: response.status, json: data });
    }
    return route.continue();
  });
  page = await context.newPage(); page.setDefaultTimeout(30000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  report.browserWarnings = [];
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) report.browserWarnings.push(message.text()); });
  await page.goto(base + '/tests/fixtures/ai-flows.html', { waitUntil: 'networkidle' });
  for (const mode of ['text', 'deepseek']) {
    console.log('Iniciando leitura: ' + mode);
    const start = Date.now();
    const result = await page.evaluate(async ({ base64, useAi }) => {
      const { readContractPdf, extractContractPages } = await import('/src/utils/contractPdf.js');
      const { contractDraft, prepareSourceReview } = await import('/src/utils/contractExtraction.js');
      const file = new File([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], 'pub-alu-03.pdf', { type: 'application/pdf' });
      const { pages, pdfSha256 } = await readContractPdf(file, { useAi });
      const extraction = await extractContractPages(pages);
      return { pages, extraction, draft: contractDraft(extraction, pages), sourceReview: prepareSourceReview(extraction, pages, pdfSha256, { useAi }) };
    }, { base64: bytes.toString('base64'), useAi: mode === 'deepseek' });
    assert.equal(result.pages.length, item.paginas);
    await writeFile(path.join(output, mode + '.json'), JSON.stringify(result, null, 2));
    report.modes[mode] = { elapsedMs: Date.now() - start, draft: result.draft,
      states: Object.fromEntries(Object.entries(result.extraction.fields).map(([key, field]) => [key, field.estado])) };
    // Development expectations from the previously reviewed public document, not an independent accuracy benchmark.
    assert.equal(result.draft.amount, 2200);
    assert.equal(result.draft.installments, undefined);
    assert.equal(result.draft.startDate, '2022-04-01');
    assert.equal(result.draft.endDate, '2023-04-01');
    assert.match(result.draft.dueRule, /20[\s\S]*subsequente/);
    pass(mode + ': all pages read; extraction evidence validated');
  }
  // The second pass uses recorded real responses to exercise the full UI without extra charges.
  replay = true;
  // Firestore keeps a long-poll connection open; wait for the loaded control below.
  await page.goto(base + '/tests/fixtures/contracts.html', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Importar PDF', exact: true }).click();
  await page.getByLabel('Usar OCR com DeepSeek e enviar as páginas para leitura').check();
  await page.getByLabel('Selecionar PDF', { exact: true }).setInputFiles(pdfPath);
  await page.getByLabel('Título *', { exact: true }).waitFor({ timeout: 120000 });
  const title = `Validação pública pub-alu-03 ${Date.now()}`;
  await page.getByLabel('Título *', { exact: true }).fill(title);
  const labels = { amount: 'Valor da parcela (R$)', installments: 'Número de parcelas', startDate: 'Início da vigência', endDate: 'Término da vigência', dueRule: 'Regra de vencimento', adjustmentRule: 'Regra de reajuste' };
  const form = {};
  for (const [key, label] of Object.entries(labels)) {
    form[key] = await page.getByLabel(label, { exact: !['dueRule', 'adjustmentRule'].includes(key) }).inputValue();
    assert.equal(form[key], String(report.modes.deepseek.draft[key] ?? ''));
  }
  report.importedForm = form;
  assert.equal(await page.getByRole('button', { name: 'Salvar contrato', exact: true }).isDisabled(), true);
  await page.screenshot({ path: path.join(output, 'imported-form.png'), fullPage: true });
  pass('Real OCR suggestions match the form; saving requires review');
  // Explicit test choices, never counted as extracted or independently annotated facts.
  await page.getByLabel('Valor da parcela (R$)').fill('2200');
  await page.getByLabel('Número de parcelas', { exact: true }).fill('');
  await page.getByLabel('Início da vigência').fill('2022-04-01');
  await page.getByLabel('Término da vigência').fill('2023-04-01');
  await page.getByLabel('Regra de vencimento').fill('Até o dia 20 do mês subsequente ao mês de referência.');
  await page.getByLabel('Regra de reajuste').fill('IGP-M ou índice substituto; intervalo mínimo de um ano; negociação em caso de desproporção ao mercado.');
  await page.getByLabel('Conferi os campos e as evidências', { exact: false }).check();
  await page.getByRole('button', { name: 'Salvar contrato', exact: true }).click();
  await page.getByRole('heading', { name: title, exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: title, exact: true }).waitFor();
  await page.getByRole('button', { name: `Planejar compromissos de ${title}`, exact: true }).click();
  assert.equal(await page.getByLabel('Quantidade de parcelas').inputValue(), '');
  assert.equal(await page.getByLabel('Primeiro vencimento').inputValue(), '');
  assert.equal(await page.getByLabel('Frequência', { exact: true }).inputValue(), '');
  await page.getByLabel('Quantidade de parcelas').fill('12');
  await page.getByLabel('Primeiro vencimento').fill('2022-05-20');
  await page.getByLabel('Frequência', { exact: true }).selectOption('MONTHLY');
  await page.getByRole('button', { name: 'Ver prévia', exact: true }).click();
  const dates = await page.locator('tbody tr td:nth-child(2)').allTextContents();
  assert.equal(dates.length, 12); assert.equal(dates[0], '20/05/2022'); assert.equal(dates.at(-1), '20/04/2023');
  await page.getByText('Há vencimentos fora da vigência informada.', { exact: false }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Confirmar compromissos', exact: true }).isDisabled(), true);
  report.manualScenario = { amount: 2200, count: 12, firstDueDate: '2022-05-20', total: 26400, dates,
    notice: 'Manual scenario, not inferred installment count or legal determination; preview not confirmed.' };
  pass('Preview requires count, frequency and date; warns about due date beyond term');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await page.evaluate(() => document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth));
    await page.screenshot({ path: path.join(output, `preview-${width}.png`), fullPage: true });
  }
  await page.getByRole('button', { name: 'Cancelar planejamento', exact: true }).click();
  await page.getByRole('button', { name: `Planejar compromissos de ${title}`, exact: true }).waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(report.browserWarnings.filter(warning => /Unable to decode|failed to initialize|wasmUrl|Dependent image/.test(warning)), [], 'PDF decoding warnings invalidate the OCR run.');
  pass('Preview at 320, 390 and 1280 pixels; cancel creates no plan; no JavaScript errors');
  report.passed = true;
} catch (error) {
  report.passed = false; report.error = env.DEEPSEEK_API_KEY ? error.message.replaceAll(env.DEEPSEEK_API_KEY, '[REDACTED]') : error.message;
  if (page) { await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {}); }
  process.exitCode = 1;
} finally {
  report.providerCalls = providerCalls;
  await writeFile(path.join(output, 'summary.json'), JSON.stringify(report, null, 2));
  await writeFile(path.join(output, 'run-record.json'), JSON.stringify({ ...provenance,
    completedAt: new Date().toISOString(), artifacts: await artifactRecords(output) }, null, 2), { flag: 'wx' });
  await browser?.close(); vite.kill();
  console.log(JSON.stringify({ passed: report.passed, providerCalls, checks: report.checks, error: report.error }, null, 2));
}
