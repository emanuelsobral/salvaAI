// Ensaio somente local, sem login real ou chamadas de IA.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';
import { localDate } from '../src/utils/finance.js';

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw Error('Use apenas o emulador local em 127.0.0.1:8080.');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(process.env.AGENDA_QA_DIR || path.join(root, '.agenda-qa'));
await mkdir(output, { recursive: true });
const env = await initializeTestEnvironment({ projectId: 'demo-salva-ai', firestore: { host: '127.0.0.1', port: 8080, rules: await readFile(path.join(root, 'firestore.rules'), 'utf8') } });
const today = localDate();
const dateBR = date => date.split('-').reverse().join('/');
const offset = days => { const date = new Date(today + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
const base = { billingMode: 'ACCOUNT', frequency: 'MONTHLY', startDate: today, endDate: today, isActive: true, dueDay: Number(today.slice(-2)), payments: {}, amount: 100, name: 'Fictícia', category: 'Outros' };
const subs = {
  overdue: { ...base, name: 'Conta atrasada', startDate: offset(-1), endDate: offset(-1) },
  pay: { ...base, name: 'Pagamento manual', revisions: [{ effectiveFrom: today, startDate: today, endDate: today, frequency: 'MONTHLY', amount: 120 }] },
  imported: { ...base, name: 'Internet importada', amount: 80 },
  paid: { ...base, name: 'Conta já paga', amount: 60, payments: { [today]: { transactionId: 'paid', paidDate: offset(-1), amount: 60 } } },
  contract: { ...base, name: 'Contrato reajustado', contractId: 'lease', startDate: offset(2), endDate: offset(2), amount: 250, revisions: [{ effectiveFrom: offset(2), startDate: offset(2), endDate: offset(2), frequency: 'MONTHLY', amount: 300 }] },
  cancelled: { ...base, name: 'Futura cancelada', isActive: false, cancelledOn: today, startDate: offset(1), endDate: offset(1) },
  prepaid: { ...base, name: 'Antecipação preservada', isActive: false, cancelledOn: today, startDate: offset(1), endDate: offset(1), payments: { [offset(1)]: { transactionId: 'advance', paidDate: today, amount: 50 } } },
  legacy: { name: 'Assinatura antiga do cartão', amount: 999, dueDay: 1, isActive: true },
};
await env.withSecurityRulesDisabled(async context => {
  const db = context.firestore();
  await Promise.all(Object.entries(subs).map(([id, data]) => setDoc(doc(db, 'users/agenda-ui/subscriptions/' + id), data)));
  await setDoc(doc(db, 'users/agenda-ui/accounts/GENERAL'), { name: 'Conta fictícia', type: 'GENERAL', balance: 920 });
  await setDoc(doc(db, 'users/agenda-ui/transactions/imported'), { amount: 80, type: 'EXPENSE', kind: 'REGULAR', status: 'COMPLETED', importFormat: 'pdf', accountType: 'GENERAL', accountId: 'GENERAL', transactionDate: today, description: 'Internet já importada' });
});
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5179', '--strictPort'], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, VITE_FIREBASE_API_KEY: 'demo-key', VITE_FIREBASE_PROJECT_ID: 'demo-salva-ai', VITE_FIREBASE_AUTH_DOMAIN: 'demo-salva-ai.firebaseapp.com', VITE_FIREBASE_APP_ID: 'demo-app' } });
let log = '', browser;
vite.stdout.on('data', value => { log += value; }); vite.stderr.on('data', value => { log += value; });
const checks = [];
const pass = name => { checks.push(name); console.log('OK: ' + name); };
try {
  const url = `http://127.0.0.1:5179/tests/fixtures/agenda.html?data=${today}&visao=mes`;
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (vite.exitCode !== null) throw Error(log);
    try { if ((await fetch(url)).ok) { ready = true; break; } } catch { /* inicialização */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, log || 'Vite não iniciou.');
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  // O Firestore mantém conexões abertas; aguarde os dados visíveis, não silêncio de rede.
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.getByText('Pagamento manual', { exact: true }).waitFor();
  const row = name => page.getByRole('listitem', { name: `${name}, vencimento ${dateBR(today)}`, exact: true });
  assert.equal(await page.getByText('Futura cancelada', { exact: true }).count(), 0);
  assert.equal(await page.getByText('Assinatura antiga do cartão', { exact: true }).count(), 0);
  const totalBefore = await page.getByTestId('agenda-pending').innerText();
  await page.getByRole('button', { name: /^Hoje \(/ }).click();
  assert.equal(await page.getByTestId('agenda-pending').innerText(), totalBefore);
  assert.equal(await page.getByText('Conta já paga', { exact: true }).count(), 0);
  await row('Pagamento manual').getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  await page.getByRole('dialog', { name: 'Registrar pagamento' }).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await row('Pagamento manual').getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'users/agenda-ui/subscriptions/pay'), { ...subs.pay, revisions: [{ ...subs.pay.revisions[0], amount: 130 }] });
  });
  await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'O valor deste vencimento mudou' }).waitFor();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    assert.equal((await getDoc(doc(db, 'users/agenda-ui/accounts/GENERAL'))).data().balance, 920);
    await setDoc(doc(db, 'users/agenda-ui/subscriptions/pay'), subs.pay);
  });
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  pass('Valor alterado em outra tela é recusado sem mudar saldo');
  await row('Pagamento manual').getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).dblclick();
  await page.getByText('Pagamento registrado na conta corrente.', { exact: true }).waitFor();
  await page.getByText('Internet importada', { exact: true }).waitFor();
  assert.equal(await row('Pagamento manual').count(), 0);
  await row('Internet importada').getByRole('button', { name: 'Vincular extrato', exact: true }).click();
  await page.getByLabel('Lançamento do extrato').selectOption('imported');
  await page.getByRole('button', { name: 'Confirmar vínculo', exact: true }).click();
  await page.getByText('Pagamento vinculado. O saldo não foi alterado.', { exact: true }).waitFor();
  await page.getByText('Nenhum vencimento com este filtro', { exact: true }).waitFor();
  await page.getByRole('button', { name: /^Pagas \(/ }).click();
  await page.getByText('Pagamento manual', { exact: true }).waitFor();
  await page.reload();
  await page.getByText('Pagamento manual', { exact: true }).waitFor();
  assert.match(await row('Internet importada').innerText(), /vinculado ao extrato/);
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    assert.equal((await getDoc(doc(db, 'users/agenda-ui/accounts/GENERAL'))).data().balance, 800);
    const transactions = (await getDocs(collection(db, 'users/agenda-ui/transactions'))).docs;
    assert.equal(transactions.length, 2);
    assert.equal(transactions.filter(tx => tx.data().amount === 120).length, 1);
    assert.equal(transactions.find(tx => tx.id === 'imported').data().kind, 'RECURRING_PAYMENT');
  });
  pass('Pagamento duplo desconta uma vez; extrato é vinculado sem novo desconto; recarga preserva estado');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('button', { name: 'Semana', exact: true }).click();
    await page.getByRole('button', { name: 'Anterior', exact: true }).click();
    await page.getByRole('button', { name: 'Próximo', exact: true }).click();
    await page.getByRole('button', { name: 'Mês', exact: true }).click();
    await page.getByRole('button', { name: 'Período atual', exact: true }).click();
    await page.getByText('Pagamento manual', { exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth));
    await page.evaluate(() => { document.querySelector('main').scrollTop = 0; });
    await page.screenshot({ path: path.join(output, `agenda-${width}.png`), fullPage: true });
    await page.getByRole('listitem').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `agenda-rows-${width}.png`), fullPage: true });
  }
  pass('Navegação semanal/mensal e layout em 320/390/1280 pixels');
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await page.screenshot({ path: path.join(output, 'agenda-light.png'), fullPage: true });
  await page.getByLabel('Mês de referência').fill('2090-01');
  await page.getByText('Nenhum vencimento neste período', { exact: true }).waitFor();
  await page.goBack();
  await page.getByText('Pagamento manual', { exact: true }).waitFor();
  pass('Período vazio e voltar do navegador');
  const other = await context.newPage();
  await other.goto(url + '&usuario=outro');
  await other.getByText('Nenhum vencimento neste período', { exact: true }).waitFor();
  assert.equal(await other.getByText('Pagamento manual', { exact: true }).count(), 0);
  pass('Outro usuário não vê as contas da amostra');
  const disconnected = await context.newPage();
  let blocked = 0;
  const disconnect = route => {
    if (new URL(route.request().url()).port === '8080') { blocked++; return route.abort(); }
    return route.continue();
  };
  await disconnected.route('**/*', disconnect);
  await disconnected.goto(url, { waitUntil: 'domcontentloaded' });
  await disconnected.getByRole('alert').filter({ hasText: 'Não foi possível carregar a agenda' }).waitFor({ timeout: 40000 }).catch(async error => {
    await writeFile(path.join(output, 'disconnected-screen.txt'), JSON.stringify({ blocked, url: disconnected.url(), body: await disconnected.locator('body').innerText() }, null, 2));
    throw error;
  });
  assert.equal(await disconnected.getByTestId('agenda-pending').count(), 0);
  assert.ok(blocked > 0);
  await disconnected.unroute('**/*', disconnect);
  await disconnected.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await disconnected.getByText('Pagamento manual', { exact: true }).waitFor({ timeout: 40000 });
  await disconnected.close();
  pass('Falha de conexão não mostra total zerado; nova tentativa recupera a agenda');
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ passed: true, checks, pageErrors: errors }, null, 2));
} catch (error) {
  await writeFile(path.join(output, 'failure.txt'), String(error.stack));
  const failedPage = browser?.contexts()[0]?.pages()[0];
  if (failedPage) {
    await failedPage.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
    await writeFile(path.join(output, 'failure-screen.txt'), await failedPage.locator('body').innerText().catch(() => ''));
  }
  throw error;
} finally {
  await browser?.close();
  vite.kill();
  await env.cleanup();
}
