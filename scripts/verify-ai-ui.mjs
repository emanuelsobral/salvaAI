// Synthetic browser checks. All external network is blocked; API responses are simulated.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(process.env.AI_QA_DIR || path.join(root, '.ai-qa'));
await mkdir(output, { recursive: true });
const base = 'http://127.0.0.1:5181';
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5181', '--strictPort'], {
  cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, DEEPSEEK_API_KEY: '',
    VITE_FIREBASE_API_KEY: 'demo-key', VITE_FIREBASE_PROJECT_ID: 'demo-salva-ai', VITE_FIREBASE_AUTH_DOMAIN: 'demo-salva-ai.firebaseapp.com', VITE_FIREBASE_APP_ID: 'demo-app' },
});
let log = '', browser, page;
vite.stdout.on('data', chunk => { log += chunk; }); vite.stderr.on('data', chunk => { log += chunk; });
const checks = [], calls = [], errors = [];
let failNext = false, holdNext = false, release;
const pass = name => { checks.push(name); console.log('OK: ' + name); };
function pdf() {
  const stream = 'BT /F1 20 Tf 40 700 Td (CONTRATO FICTICIO) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let content = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(content.length); content += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const start = content.length;
  content += `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset => String(offset).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(content);
}
try {
  let ready = false;
  for (let n = 0; n < 120; n++) {
    if (vite.exitCode !== null) throw Error(log);
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch { /* starting */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, log);
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    const script = body => route.fulfill({ contentType: 'text/javascript', body });
    if (/\/src\/hooks\/useAuth(?:\.jsx)?$/.test(url.pathname)) return script("export function useAuth() { return { user: { uid: 'ai-test' } }; }");
    if (/\/src\/services\/firebase(?:\.js)?$/.test(url.pathname)) return script("export const auth = { currentUser: { uid: 'ai-test', getIdToken: async () => 'synthetic-token' } };");
    if (/\/src\/services\/dashboardService(?:\.js)?$/.test(url.pathname)) return script("export async function getDashboardData() { return { balances: { GENERAL: 100 }, lighthouse: { value: 100 }, period: '2026-10' }; }");
    if (url.pathname === '/api/ai') {
      const body = route.request().postDataJSON(); calls.push(body);
      assert.equal(route.request().headers().authorization, 'Bearer synthetic-token');
      if (holdNext) { holdNext = false; await new Promise(resolve => { release = resolve; }); }
      if (failNext) { failNext = false; return route.fulfill({ status: 502, json: { error: 'Falha simulada; nenhum dado aplicado.' } }); }
      if (body.action === 'chat') return route.fulfill({ json: { text: 'Análise fictícia concluída.' } });
      assert.equal(body.mimeType, 'image/jpeg'); assert.ok(body.image.startsWith('/9j/'));
      if (body.action === 'contract-ocr') return route.fulfill({ json: { data: { text: 'Parcela de R$ 100,00. 12 parcelas. Vencimento dia 10. Vigencia de 01/01/2026 a 31/12/2026. Reajuste anual pelo IPCA.' } } });
      assert.equal(body.action, 'statement-recovery'); assert.equal(body.localReadFailed, true);
      return route.fulfill({ json: { data: { transactions: [{ date: '2026-10-16', description: 'Compra fictícia', amount: '25.50', direction: 'EXPENSE', evidence: '16/10/2026 Compra fictícia 25,50 D' }] } } });
    }
    return route.continue();
  });
  page = await context.newPage(); page.setDefaultTimeout(25000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/tests/fixtures/ai-flows.html?view=chat');
  await page.getByRole('button', { name: 'Abrir assistente financeiro' }).click();
  await page.getByRole('textbox', { name: 'Sua pergunta' }).fill('Como organizar meu orçamento?');
  await page.getByRole('button', { name: 'Enviar pergunta' }).click();
  await page.getByText('Análise fictícia concluída.', { exact: true }).waitFor();
  assert.equal(calls.length, 1); assert.equal(calls[0].context.balances.GENERAL, 100);
  await page.getByLabel('Usar DeepSeek para analisar').uncheck();
  await page.getByRole('textbox', { name: 'Sua pergunta' }).fill('saldo');
  await page.getByRole('button', { name: 'Enviar pergunta' }).click();
  await page.getByText(/Saldo da conta principal: R\$/).waitFor();
  assert.equal(calls.length, 1); pass('chat com resumo financeiro e opção local sem chamada');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.screenshot({ path: path.join(output, 'chat.png'), fullPage: true });
  await page.goto(base + '/tests/fixtures/ai-flows.html');
  await page.getByLabel('Usar OCR com DeepSeek e enviar as páginas para leitura').check();
  await page.locator('input[type=file]').setInputFiles({ name: 'ficticio.pdf', mimeType: 'application/pdf', buffer: pdf() });
  await page.waitForFunction(() => document.querySelector('output').textContent.includes('PDF_DEEPSEEK_OCR_REVIEW'), { timeout: 90000 });
  const contract = JSON.parse(await page.locator('output').textContent());
  assert.equal(contract.sourceReview.method, 'PDF_DEEPSEEK_OCR_REVIEW');
  assert.equal(contract.draft.amount, 100); assert.equal(calls.at(-1).action, 'contract-ocr');
  pass('imagem de contrato transcrita, extração local e origem DeepSeek preservada');
  await page.goto(base + '/tests/fixtures/pdf-review.html');
  await page.getByRole('button', { name: 'PDF com texto', exact: true }).click();
  await page.locator('.pdf-draft').first().waitFor();
  assert.equal(await page.getByRole('button', { name: /Pedir ajuda à IA/ }).count(), 0);
  const localAmount = await page.locator('.pdf-draft').first().getByLabel('Valor (R$, sem sinal)').inputValue();
  await page.getByLabel('O leitor local deixou informações sem ler nesta página.').check();
  await page.getByRole('button', { name: /Pedir ajuda à IA/ }).click();
  await page.getByText('Sugestão da DeepSeek.', { exact: false }).waitFor();
  const proposal = page.locator('.pdf-draft').filter({ hasText: 'Sugestão da DeepSeek.' });
  assert.equal(await proposal.getByRole('checkbox').isChecked(), false);
  assert.equal(await page.locator('.pdf-draft').first().getByLabel('Valor (R$, sem sinal)').inputValue(), localAmount);
  await proposal.getByRole('checkbox').check();
  assert.equal(await proposal.getByLabel('Valor (R$, sem sinal)').inputValue(), '25.50');
  pass('extrato completo não chama IA; ajuda explícita mantém local e exige selecionar sugestão');
  await page.getByRole('button', { name: 'PDF com texto', exact: true }).click();
  await page.locator('.pdf-draft').first().waitFor();
  await page.getByLabel('O leitor local deixou informações sem ler nesta página.').check(); failNext = true;
  await page.getByRole('button', { name: /Pedir ajuda à IA/ }).click();
  await page.getByRole('alert').filter({ hasText: 'Falha simulada' }).waitFor();
  assert.equal(await page.locator('.pdf-draft').first().getByLabel('Valor (R$, sem sinal)').inputValue(), localAmount);
  pass('falha de IA preserva lançamentos locais');
  holdNext = true;
  await page.getByRole('button', { name: /Pedir ajuda à IA/ }).click();
  await page.getByRole('button', { name: 'Cancelar leitura da imagem' }).click();
  release?.();
  await page.getByRole('alert').filter({ hasText: 'cancelada' }).waitFor();
  assert.equal(await page.locator('.pdf-draft').filter({ hasText: 'Sugestão da DeepSeek.' }).count(), 0);
  pass('cancelamento não aplica resposta tardia');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.screenshot({ path: path.join(output, 'extrato.png'), fullPage: true });
  assert.deepEqual(errors, []);
  pass('telas em 320, 390 e 1280 pixels, sem erros JavaScript');
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ simulated: true, checks, requests: calls.length }, null, 2));
} catch (error) {
  if (page) { await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {}); await writeFile(path.join(output, 'failure.txt'), await page.locator('body').innerText().catch(() => log)); }
  throw error;
} finally { release?.(); await browser?.close(); vite.kill(); }
