// Run inside `firebase emulators:exec --only firestore --project demo-salva-ai`.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { contractPdf, contractLines } from './contracts-pdf-fixture.mjs';
import { imageOnlyPdf } from '../tests/fixtures/ocr-image-cases.js';

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Use o emulador local, nunca produção.');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(process.env.CONTRACT_QA_DIR || path.join(root, '.contract-qa'));
await mkdir(output, { recursive: true });
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5178', '--strictPort'], {
  cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, VITE_FIREBASE_API_KEY: 'demo-key', VITE_FIREBASE_PROJECT_ID: 'demo-salva-ai', VITE_FIREBASE_AUTH_DOMAIN: 'demo-salva-ai.firebaseapp.com', VITE_FIREBASE_APP_ID: 'demo-app' },
});
let serverLog = '';
vite.stdout.on('data', chunk => { serverLog += chunk; });
vite.stderr.on('data', chunk => { serverLog += chunk; });
let browser;
try {
  const url = 'http://127.0.0.1:5178/tests/fixtures/contracts.html';
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (vite.exitCode !== null) throw new Error(serverLog);
    try { if ((await fetch(url)).ok) { ready = true; break; } } catch { /* startup */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, serverLog || 'Vite não iniciou.');
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.getByRole('button', { name: '+ Novo contrato', exact: true }).waitFor();
  await page.getByRole('button', { name: '+ Novo contrato', exact: true }).click();
  const title = `Aluguel fictício ${Date.now()}`;
  await page.getByLabel('Título *', { exact: true }).fill(title);
  await page.getByLabel('Valor da parcela (R$)').fill('2200.50');
  await page.getByLabel('Início da vigência').fill('2026-01-01');
  await page.getByLabel('Término da vigência').fill('2026-12-31');
  await page.getByLabel('Regra de vencimento').fill('Dia 20 do mês seguinte');
  await page.getByRole('button', { name: 'Salvar contrato', exact: true }).click();
  await page.getByText('Contrato salvo. Nenhuma cobrança foi gerada.', { exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: title, exact: true }).waitFor();
  assert.equal(await page.locator('article').filter({ hasText: title }).count(), 1);
  await page.screenshot({ path: path.join(output, 'contracts-desktop.png'), fullPage: true });
  // Duas telas reais: a segunda não pode sobrescrever uma edição já confirmada.
  const other = await context.newPage();
  await other.goto(url);
  await other.getByRole('button', { name: `Editar ${title}`, exact: true }).click();
  await page.getByRole('button', { name: `Editar ${title}`, exact: true }).click();
  await page.getByLabel('Valor da parcela (R$)').fill('2300');
  await page.getByRole('button', { name: 'Salvar contrato', exact: true }).click();
  await page.getByText('Contrato salvo. Nenhuma cobrança foi gerada.', { exact: true }).waitFor();
  await other.getByLabel('Valor da parcela (R$)').fill('2400');
  await other.getByRole('button', { name: 'Salvar contrato', exact: true }).click();
  await other.getByRole('alert').filter({ hasText: 'alterado em outra tela' }).waitFor();
  assert.equal(await other.getByLabel('Valor da parcela (R$)').inputValue(), '2400');
  await other.close();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole('button', { name: `Editar ${title}`, exact: true }).click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    assert.ok(await page.evaluate(() => document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth));
    await page.screenshot({ path: path.join(output, `contracts-form-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  }
  await page.getByRole('button', { name: `Planejar compromissos de ${title}`, exact: true }).click();
  await page.getByLabel('Quantidade de parcelas').fill('3');
  await page.getByLabel('Primeiro vencimento').fill('2026-01-31');
  await page.getByLabel('Frequência', { exact: true }).selectOption('MONTHLY');
  await page.getByRole('button', { name: 'Ver prévia', exact: true }).click();
  assert.deepEqual(await page.locator('tbody tr td:nth-child(2)').allTextContents(), ['31/01/2026', '28/02/2026', '31/03/2026']);
  assert.equal(await page.getByRole('button', { name: 'Confirmar compromissos', exact: true }).isDisabled(), true);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth));
    await page.screenshot({ path: path.join(output, `contracts-plan-${width}.png`), fullPage: true });
  }
  await page.getByLabel('Conferi os valores e vencimentos', { exact: false }).check();
  await page.getByRole('button', { name: 'Confirmar compromissos', exact: true }).click();
  await page.getByText('Compromissos confirmados.', { exact: false }).waitFor();
  await page.reload();
  const duesLink = page.getByRole('link', { name: 'Ver vencimentos', exact: true });
  await duesLink.waitFor();
  assert.equal(await page.getByRole('button', { name: `Planejar compromissos de ${title}`, exact: true }).count(), 0);
  const target = new URL(await duesLink.getAttribute('href'), url);
  // Mesmo componente e mesmos parâmetros da rota real, com identidade fictícia no emulador.
  target.pathname = '/tests/fixtures/contracts.html';
  target.searchParams.set('view', 'contas');
  await page.goto(target.href);
  await page.getByText('Vence em 31/01/2026', { exact: false }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Editar recorrência', exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click();
  await page.getByText('Pagamento registrado na conta corrente.', { exact: true }).waitFor();
  await page.getByText('Vence em 31/01/2026 · Pago', { exact: true }).waitFor();
  await page.reload();
  await page.getByText('Vence em 31/01/2026 · Pago', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).count(), 0);
  await page.goto(url);
  await page.getByRole('button', { name: 'Importar PDF', exact: true }).click();
  const upload = buffer => page.getByLabel('Selecionar PDF', { exact: true }).setInputFiles({ name: 'contrato-ficticio.pdf', mimeType: 'application/pdf', buffer });
  console.log('PDF: verificando arquivos inválidos e limites.');
  await upload(Buffer.from('Arquivo ficticio invalido'));
  await page.getByRole('alert').filter({ hasText: 'não parece ser um PDF' }).waitFor();
  await upload(contractPdf([contractLines, []]));
  await page.getByRole('alert').filter({ hasText: 'página 2 não possui texto' }).waitFor();
  assert.equal(await page.getByLabel('Título *', { exact: true }).count(), 0);
  await upload(contractPdf(Array.from({ length: 51 }, () => ['Texto ficticio.'])));
  await page.getByRole('alert').filter({ hasText: 'Limite de 50 páginas' }).waitFor();
  console.log('PDF: executando leitura local completa.');
  await upload(contractPdf([contractLines]));
  await Promise.race([
    page.getByLabel('Título *', { exact: true }).waitFor({ timeout: 90000 }),
    page.getByRole('alert').waitFor({ timeout: 90000 }).then(async () => { throw Error(`PDF: ${await page.getByRole('alert').innerText()}`); }),
  ]);
  assert.equal(await page.getByLabel('Valor da parcela (R$)').inputValue(), '1200');
  assert.equal(await page.getByLabel('Número de parcelas', { exact: true }).inputValue(), '12');
  assert.equal(await page.getByLabel('Início da vigência').inputValue(), '2027-01-01');
  assert.equal(await page.getByLabel('Término da vigência').inputValue(), '2027-12-31');
  assert.match(await page.getByLabel('Regra de reajuste').inputValue(), /IPCA/i);
  assert.match(await page.getByLabel('Regra de vencimento').inputValue(), /10/);
  const pdfTitle = `PDF fictício ${Date.now()}`;
  await page.getByLabel('Título *', { exact: true }).fill(pdfTitle);
  assert.equal(await page.getByRole('button', { name: 'Salvar contrato', exact: true }).isDisabled(), true);
  await page.getByLabel('Conferi os campos e as evidências', { exact: false }).check();
  await page.getByLabel('Valor da parcela (R$)').fill('1250');
  assert.equal(await page.getByRole('button', { name: 'Salvar contrato', exact: true }).isDisabled(), true);
  await page.getByText('Conferir evidências da leitura do PDF', { exact: true }).click();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth));
    await page.screenshot({ path: path.join(output, `contracts-pdf-${width}.png`), fullPage: true });
  }
  await page.getByLabel('Conferi os campos e as evidências', { exact: false }).check();
  await page.getByRole('button', { name: 'Salvar contrato', exact: true }).click();
  await page.getByRole('heading', { name: pdfTitle, exact: true }).waitFor();
  await page.reload();
  const pdfCard = page.locator('article').filter({ hasText: pdfTitle });
  await pdfCard.waitFor();
  await pdfCard.getByText('Conferir evidências da leitura do PDF', { exact: true }).click();
  await pdfCard.getByRole('region', { name: 'Evidências: Valor da parcela', exact: true }).getByText('O aluguel mensal e de R$ 1.200,00.', { exact: true }).waitFor();
  await page.getByRole('button', { name: `Editar ${pdfTitle}`, exact: true }).click();
  assert.equal(await page.getByLabel('Valor da parcela (R$)').inputValue(), '1250');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  // Cancelar e trocar de arquivo durante uma leitura não pode aplicar o resultado antigo.
  await page.getByRole('button', { name: 'Importar PDF', exact: true }).click();
  await upload(contractPdf([contractLines]));
  await page.getByRole('button', { name: 'Cancelar importação', exact: true }).click();
  await page.getByRole('button', { name: 'Importar PDF', exact: true }).click();
  await upload(contractPdf([contractLines]));
  await upload(Buffer.from('Segundo arquivo invalido'));
  await page.getByRole('alert').filter({ hasText: 'não parece ser um PDF' }).waitFor();
  assert.equal(await page.getByLabel('Título *', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Cancelar importação', exact: true }).click();
  console.log('OCR: validando imagem real e origem persistida.');
  const jpeg = await page.evaluate(lines => {
    const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1000;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1600, 1000);
    ctx.fillStyle = 'black'; ctx.font = '28px Arial';
    lines.forEach((line, index) => ctx.fillText(line, 70, 120 + index * 100));
    return canvas.toDataURL('image/jpeg', 0.98).split(',')[1];
  }, contractLines);
  const scan = Buffer.from(imageOnlyPdf(Buffer.from(jpeg, 'base64'), 1600, 1000));
  await page.getByRole('button', { name: 'Importar PDF', exact: true }).click();
  await page.getByLabel('Ler páginas digitalizadas (OCR)', { exact: true }).check();
  await upload(contractPdf(Array.from({ length: 51 }, () => ['Texto'])));
  await page.getByRole('alert').filter({ hasText: 'Limite de 50 páginas por contrato com OCR' }).waitFor();
  await upload(scan);
  await Promise.race([
    page.getByLabel('Título *', { exact: true }).waitFor({ timeout: 180000 }),
    page.getByRole('alert').waitFor({ timeout: 180000 }).then(async () => { throw Error(`OCR: ${await page.getByRole('alert').innerText()}`); }),
  ]);
  assert.equal(await page.getByLabel('Valor da parcela (R$)').inputValue(), '1200');
  assert.equal(await page.getByLabel('Número de parcelas', { exact: true }).inputValue(), '12');
  const ocrTitle = `OCR fictício ${Date.now()}`;
  await page.getByLabel('Título *', { exact: true }).fill(ocrTitle);
  await page.getByText('Conferir evidências da leitura do PDF', { exact: true }).click();
  await page.getByText('Origem: OCR.', { exact: false }).waitFor();
  await page.screenshot({ path: path.join(output, 'contracts-ocr-390.png') });
  await page.getByLabel('Conferi os campos e as evidências', { exact: false }).check();
  await page.getByRole('button', { name: 'Salvar contrato', exact: true }).click();
  await page.getByRole('heading', { name: ocrTitle, exact: true }).waitFor();
  await page.reload();
  await page.locator('article').filter({ hasText: ocrTitle }).getByText('Conferir evidências da leitura do PDF', { exact: true }).click();
  await page.getByText('Origem: OCR.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Importar PDF', exact: true }).click();
  await page.getByLabel('Ler páginas digitalizadas (OCR)', { exact: true }).check();
  await upload(scan);
  await page.getByRole('button', { name: 'Cancelar importação', exact: true }).click();
  assert.equal(await page.getByLabel('Título *', { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log('PDF aprovado: motor local real, cinco campos, revisão obrigatória, edição, evidências persistidas, limites/página sem texto, cancelamento e troca de arquivo.');
  console.log('UI aprovada: cadastro, recarga, edição, conflito entre telas, prévia/confirmacão, vencimentos vinculados e pagamento persistido; formulários e prévia em 320/390 px.');
} catch (error) {
  const failedPage = browser?.contexts()[0]?.pages()[0];
  if (failedPage) {
    console.error((await failedPage.locator('main').innerText({ timeout: 5000 }).catch(() => 'Tela indisponível')).slice(-5000));
    await failedPage.screenshot({ path: path.join(output, 'failure.png'), timeout: 5000 }).catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  vite.kill();
}
