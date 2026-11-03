// Controlled responses only. No provider calls, real accounts or production writes.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { contractPdf, contractLines } from './contracts-pdf-fixture.mjs';

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
assert.ok(process.env.CONTRACT_QA_DIR);
const output = path.resolve(process.env.CONTRACT_QA_DIR);
await mkdir(output, { recursive: true });
const root = fileURLToPath(new URL('../', import.meta.url));
let recorded, recordedInput, expected, pdfFile;
const replayDir = process.env.CONTRACT_FIELDS_REPLAY_DIR;
if (replayDir) {
  const catalog = JSON.parse(await readFile(path.join(root, 'experiments/contracts/amostra-preenchidos-v1.json')));
  const item = catalog.documentos.find(doc => doc.id === 'pub-alu-03');
  assert.equal(item.origem, 'publica'); assert.equal(item.divisao, 'desenvolvimento');
  recordedInput = JSON.parse(await readFile(path.join(replayDir, 'input.json')));
  assert.equal(recordedInput.pdfSha256, item.sha256);
  pdfFile = path.join(root, 'experiments/contracts', item.arquivo);
  assert.equal(createHash('sha256').update(await readFile(pdfFile)).digest('hex'), item.sha256);
  const provider = JSON.parse(await readFile(path.join(replayDir, 'provider-raw.txt')));
  recorded = JSON.parse(provider.choices[0].message.content);
  expected = JSON.parse(await readFile(path.join(replayDir, 'revalidated-1.0.2.json'))).draft;
}
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5183', '--strictPort'], {
  cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env,
    VITE_FIREBASE_API_KEY: 'demo-key', VITE_FIREBASE_PROJECT_ID: 'demo-salva-ai',
    VITE_FIREBASE_AUTH_DOMAIN: 'demo-salva-ai.firebaseapp.com', VITE_FIREBASE_APP_ID: 'demo-app' },
});
let log = '', browser, release;
vite.stdout.on('data', x => { log += x; }); vite.stderr.on('data', x => { log += x; });
const report = { providerCalls: 0, mockRequests: 0, checks: [], passed: false };
report.source = replayDir ? 'Recorded public development response, not new inference' : 'Synthetic response';
if (replayDir) report.responseSha256 = createHash('sha256').update(await readFile(path.join(replayDir, 'provider-raw.txt'))).digest('hex');
try {
  const url = 'http://127.0.0.1:5183/tests/fixtures/contracts.html';
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (vite.exitCode !== null) throw Error(log);
    try { if ((await fetch(url)).ok) { ready = true; break; } } catch { /* starting */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Vite did not start');
  const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  let mode = 'valid';
  const external = [], errors = [];
  await context.route('**/*', async route => {
    const target = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(target.hostname)) { external.push(target.hostname); return route.abort(); }
    if (target.pathname === '/src/services/firebase.js') {
      const response = await route.fetch();
      const original = await response.text();
      const body = original.replace('export const auth = getAuth(app);', 'export const auth = { currentUser: { uid: "contracts-ui", getIdToken: async () => "test-token" } };');
      assert.notEqual(original, body);
      return route.fulfill({ response, body });
    }
    if (target.pathname === '/api/ai') {
      report.mockRequests++;
      const input = route.request().postDataJSON();
      assert.equal(input.action, 'contract-extract');
      if (recordedInput) assert.deepEqual(input.pages, recordedInput.pages, 'Replay requires exactly the same paginated text');
      else { assert.equal(input.pages.length, 1); assert.ok(input.pages[0].includes(contractLines[0])); }
      const values = {
        valor_parcela: { tipo: 'fixo', moeda: 'BRL', quantia: '1200.00' },
        numero_parcelas: { tipo: 'determinado', quantidade: 12 },
        data_vencimento: { tipo: 'outra_regra', dia: null, data: null, regra: 'Vencimento todo dia 10.' },
        vigencia: { tipo: 'determinado', inicio: '2027-01-01', fim: '2027-12-31' },
        regra_reajuste: { regra: contractLines[4] },
      };
      const fields = recorded ? structuredClone(recorded.fields) : Object.fromEntries(Object.entries(values).map(([key, valor], i) => [key,
        { estado: 'encontrado', valor, motivo: 'Resposta controlada.', evidencias: [{ pagina: 1, trecho: contractLines[i] }] }]));
      if (mode === 'invalid') fields.valor_parcela.evidencias[0].trecho = 'Evidência fabricada';
      if (mode === 'delayed') await new Promise(resolve => { release = resolve; });
      return route.fulfill({ json: { data: { fields } } }).catch(() => {});
    }
    return route.continue();
  });
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  async function importPdf() {
    await page.getByRole('button', { name: 'Importar PDF', exact: true }).click();
    await page.getByLabel('Preencher os cinco campos com DeepSeek', { exact: true }).check();
    await page.getByLabel('Selecionar PDF', { exact: true }).setInputFiles(pdfFile || { name: 'ficticio.pdf', mimeType: 'application/pdf', buffer: contractPdf([contractLines]) });
  }
  await importPdf();
  await page.getByLabel('Título *', { exact: true }).waitFor();
  const draft = expected || { amount: 1200, installments: 12, startDate: '2027-01-01', endDate: '2027-12-31', dueRule: 'Vencimento todo dia 10.', adjustmentRule: contractLines[4] };
  for (const [key, label] of Object.entries({ amount: 'Valor da parcela (R$)', installments: 'Número de parcelas', startDate: 'Início da vigência', endDate: 'Término da vigência', dueRule: 'Regra de vencimento', adjustmentRule: 'Regra de reajuste' })) {
    assert.equal(await page.getByLabel(label, { exact: !['dueRule', 'adjustmentRule'].includes(key) }).inputValue(), String(draft[key] ?? ''));
  }
  report.draft = draft;
  await page.getByText('Conferir evidências da leitura do PDF', { exact: true }).click();
  await page.getByText(/Origem: extração de campos com DeepSeek/).waitFor();
  if (recorded) {
    const evidence = page.getByRole('region', { name: 'Evidências: Reajuste', exact: true });
    assert.equal(await evidence.locator('blockquote').count(), recorded.fields.regra_reajuste.evidencias.length);
    assert.match(await evidence.innerText(), /IGP-M/);
    await page.getByRole('heading', { name: 'Número de parcelas — Não identificado', exact: true }).waitFor();
  }
  assert.ok(await page.getByRole('button', { name: 'Salvar contrato', exact: true }).isDisabled());
  await page.getByLabel('Conferi os campos e as evidências no documento e quero salvar este cadastro.').check();
  assert.ok(await page.getByRole('button', { name: 'Salvar contrato', exact: true }).isEnabled());
  await page.getByLabel('Título *', { exact: true }).fill('Contrato fictício');
  assert.ok(await page.getByRole('button', { name: 'Salvar contrato', exact: true }).isDisabled());
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByLabel('Regra de reajuste').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `fields-${width}.png`), fullPage: true });
  }
  report.checks.push('Five fields and evidence; review required and reset on edit; 320/390/1280px');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  mode = 'invalid'; await importPdf();
  await page.getByRole('alert').filter({ hasText: 'Evidência não corresponde' }).waitFor();
  assert.equal(await page.getByLabel('Título *', { exact: true }).count(), 0);
  report.checks.push('Invalid evidence rejects the whole response');
  await page.getByRole('button', { name: 'Cancelar importação', exact: true }).click();
  mode = 'delayed'; await importPdf();
  for (let i = 0; i < 100 && !release; i++) await new Promise(resolve => setTimeout(resolve, 50));
  assert.ok(release);
  await page.getByRole('button', { name: 'Cancelar importação', exact: true }).click();
  release(); release = null;
  await page.getByRole('button', { name: 'Importar PDF', exact: true }).waitFor();
  assert.equal(await page.getByLabel('Título *', { exact: true }).count(), 0);
  report.blockedExternalHosts = [...new Set(external)];
  assert.ok(external.every(host => host === 'fonts.googleapis.com'), 'Unexpected external request');
  assert.deepEqual(errors, []);
  assert.equal(report.mockRequests, 3);
  report.checks.push('Cancellation; external requests blocked; no JavaScript errors or save performed');
  report.passed = true;
} catch (error) { report.error = error.message; process.exitCode = 1; }
finally {
  release?.(); await browser?.close(); vite.kill();
  await writeFile(path.join(output, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
