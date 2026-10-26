// Execute com o emulador Firestore. Todos os dados deste roteiro são fictícios.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { previewContractPlan } from '../src/utils/contractPlan.js';
import { localDate } from '../src/utils/finance.js';

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Use apenas o emulador local.');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(process.env.CONTRACT_QA_DIR || path.join(root, '.contract-qa'));
await mkdir(output, { recursive: true });
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5178', '--strictPort'], {
  cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, VITE_FIREBASE_API_KEY: 'demo-key', VITE_FIREBASE_PROJECT_ID: 'demo-salva-ai', VITE_FIREBASE_AUTH_DOMAIN: 'demo-salva-ai.firebaseapp.com', VITE_FIREBASE_APP_ID: 'demo-app' },
});
let log = '', browser;
vite.stdout.on('data', chunk => { log += chunk; });
vite.stderr.on('data', chunk => { log += chunk; });
try {
  const url = 'http://127.0.0.1:5178/tests/fixtures/contracts.html';
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (vite.exitCode !== null) throw new Error(log);
    try { if ((await fetch(url)).ok) { ready = true; break; } } catch { /* startup */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, log || 'Vite não iniciou.');
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  context.on('page', next => next.on('pageerror', error => errors.push(error.message)));
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(30000);
  await page.goto(url);
  await page.getByRole('button', { name: '+ Novo contrato', exact: true }).click();
  const title = `Reajuste fictício ${Date.now()}`;
  await page.getByLabel('Título *', { exact: true }).fill(title);
  await page.getByLabel('Valor da parcela (R$)').fill('100.25');
  await page.getByRole('button', { name: 'Salvar contrato', exact: true }).click();
  await page.getByRole('button', { name: `Planejar compromissos de ${title}`, exact: true }).click();
  const plan = previewContractPlan({ amount: 100.25, count: 4, frequency: 'MONTHLY', firstDueDate: localDate() });
  await page.getByLabel('Quantidade de parcelas').fill('4');
  await page.getByLabel('Primeiro vencimento').fill(plan.firstDueDate);
  await page.getByLabel('Frequência', { exact: true }).selectOption('MONTHLY');
  await page.getByRole('button', { name: 'Ver prévia', exact: true }).click();
  await page.getByLabel('Conferi os valores e vencimentos', { exact: false }).check();
  await page.getByRole('button', { name: 'Confirmar compromissos', exact: true }).click();
  await page.getByText('Compromissos confirmados.', { exact: false }).waitFor();
  const card = page.locator('article').filter({ hasText: title });
  const target = new URL(await card.getByRole('link', { name: 'Ver vencimentos', exact: true }).getAttribute('href'), url);
  target.pathname = '/tests/fixtures/contracts.html'; target.searchParams.set('view', 'contas');
  await page.goto(target.href);
  await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click();
  await page.getByText('Pagamento registrado na conta corrente.', { exact: true }).waitFor();
  await page.goto(url);
  const other = await context.newPage();
  await other.goto(url);
  for (const tab of [page, other]) {
    await tab.getByRole('button', { name: `Reajustar parcelas de ${title}`, exact: true }).click();
    await tab.getByLabel('Forma do reajuste').selectOption('PERCENT');
    await tab.getByLabel('Percentual de reajuste (%)').fill('10');
    await tab.getByLabel('Aplicar a partir de').fill(plan.rows[1].dueDate);
    await tab.getByRole('button', { name: 'Ver prévia do reajuste', exact: true }).click();
    assert.equal(await tab.locator('tbody tr').count(), 3);
    assert.match(await tab.locator('tbody tr').first().innerText(), /100,25.*110,28/);
    assert.equal(await tab.getByRole('button', { name: 'Confirmar reajuste', exact: true }).isDisabled(), true);
  }
  // Voltar e editar exige nova prévia e confirmação.
  await page.getByLabel('Conferi a data e os valores do reajuste.').check();
  await page.getByRole('button', { name: 'Voltar e ajustar', exact: true }).click();
  await page.getByRole('button', { name: 'Ver prévia do reajuste', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Confirmar reajuste', exact: true }).isDisabled(), true);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth));
    await page.screenshot({ path: path.join(output, `adjustment-${width}.png`), fullPage: true });
  }
  await page.getByLabel('Conferi a data e os valores do reajuste.').check();
  await page.getByRole('button', { name: 'Confirmar reajuste', exact: true }).click();
  await page.getByText('Reajuste programado. Os pagamentos e o saldo foram preservados.', { exact: true }).waitFor();
  await other.getByLabel('Conferi a data e os valores do reajuste.').check();
  await other.getByRole('button', { name: 'Confirmar reajuste', exact: true }).click();
  await other.getByRole('alert').filter({ hasText: 'mudaram em outra tela' }).waitFor();
  await other.close();
  await page.reload();
  await page.getByRole('button', { name: `Reajustar parcelas de ${title}`, exact: true }).click();
  await page.getByText('Reajustes registrados (1)', { exact: true }).click();
  assert.match(await page.locator('.contract-adjustment-history').innerText(), /100,25.*110,28/);
  await page.getByLabel('Novo valor da parcela (R$)').fill('120');
  await page.getByLabel('Aplicar a partir de').fill(plan.rows[2].dueDate);
  await page.getByRole('button', { name: 'Ver prévia do reajuste', exact: true }).click();
  assert.equal(await page.locator('tbody tr').count(), 2);
  assert.match(await page.locator('tbody tr').first().innerText(), /110,28.*120,00/);
  await page.getByLabel('Conferi a data e os valores do reajuste.').check();
  await page.getByRole('button', { name: 'Confirmar reajuste', exact: true }).click();
  await page.getByText('Reajuste programado. Os pagamentos e o saldo foram preservados.', { exact: true }).waitFor();
  await page.goto(target.href);
  await page.getByText(`Vence em ${plan.firstDueDate.split('-').reverse().join('/')} · Pago`, { exact: true }).waitFor();
  target.searchParams.set('mes', plan.rows[1].dueDate.slice(0, 7));
  await page.goto(target.href);
  await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).waitFor();
  assert.match(await page.locator('main').innerText(), /110,28/);
  await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click();
  await page.getByText('Pagamento registrado na conta corrente.', { exact: true }).waitFor();
  await page.reload();
  await page.getByText(`Vence em ${plan.rows[1].dueDate.split('-').reverse().join('/')} · Pago`, { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  const result = { percentageAndAmount: true, previewAndConfirmation: true, conflictBetweenTabs: true, historyAfterReload: true, originalPaymentPreserved: true, adjustedPayment: true, widths: [320, 390, 1280], pageErrors: errors };
  await writeFile(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} catch (failure) {
  const page = browser?.contexts()[0]?.pages()[0];
  if (page) {
    console.error((await page.locator('main').innerText({ timeout: 3000 }).catch(() => '')).slice(-4000));
    await page.screenshot({ path: path.join(output, 'failure.png'), timeout: 5000 }).catch(() => {});
  }
  throw failure;
} finally { await browser?.close(); vite.kill(); }
