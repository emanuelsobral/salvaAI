// One opt-in call on a known public development document. Never reads reserved PDFs.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEnv } from 'vite';
import { createAiHandler } from '../server/ai-handler.js';
import { contractDraft } from '../src/utils/contractExtraction.js';
import { CONTRACT_AI_VERSION, validateContractPages } from '../src/utils/contractAi.js';
import { requestRecord } from './contract-run-record.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.equal(process.env.CONTRACT_ALLOW_LIVE_AI, '1');
assert.ok(process.env.CONTRACT_INPUT_DIR && process.env.CONTRACT_QA_DIR);
const output = path.resolve(process.env.CONTRACT_QA_DIR);
const relative = path.relative(root, output);
assert.ok(path.isAbsolute(relative) || relative === '..' || relative.startsWith('..' + path.sep), 'Output must be outside the repository');
const sourcePath = path.join(path.resolve(process.env.CONTRACT_INPUT_DIR), 'text.json');
const inputBytes = await readFile(sourcePath);
const source = JSON.parse(inputBytes);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(await readFile(path.join(root, 'experiments/contracts/amostra-preenchidos-v1.json')));
const item = catalog.documentos.find(doc => doc.id === 'pub-alu-03');
assert.equal(item.divisao, 'desenvolvimento'); assert.equal(item.origem, 'publica');
assert.equal(source.sourceReview?.pdfSha256, item.sha256);
assert.equal(source.sourceReview?.method, 'PDF_TEXT_REVIEW');
assert.equal(hash(await readFile(path.join(root, 'experiments/contracts', item.arquivo))), item.sha256);
assert.equal(source.pages.length, item.paginas);
validateContractPages(source.pages);
// Atomic creation preserves previous attempts, including failures.
await mkdir(output);
const save = (name, value) => writeFile(path.join(output, name), JSON.stringify(value, null, 2), { flag: 'wx' });
await save('input.json', { document: item.id, pdfSha256: item.sha256, sourcePath, sourceSha256: hash(inputBytes), pages: source.pages });
const inventory = JSON.parse(execFileSync(process.execPath, ['scripts/contract-runtime-manifest.mjs'], { cwd: root, encoding: 'utf8' }));
await save('runtime-manifest.json', { ...inventory, pipeline: ['Recorded PDF text', 'DeepSeek field extraction', 'Local validation', 'Draft only'],
  provider: { name: 'DeepSeek', role: 'Field extraction', effectiveModel: null } });
const env = { ...loadEnv('development', root, ''), ...process.env, FIREBASE_PROJECT_ID: 'demo-salva-ai' };
const report = { startedAt: new Date().toISOString(), document: item.id, independentGroundTruth: false,
  authentication: 'injected test identity', persistence: 'none', promptVersion: CONTRACT_AI_VERSION, providerCalls: 0,
  sourceSha256: hash(inputBytes), baselineVersion: source.extraction.version };
const started = Date.now();
try {
  assert.ok(env.DEEPSEEK_API_KEY?.trim(), 'Private API key missing');
  const handler = createAiHandler({ env, verifyToken: async token => { assert.equal(token, 'development-only'); return { uid: 'direct-development' }; },
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://api.deepseek.com/chat/completions');
      assert.equal(++report.providerCalls, 1, 'No automatic retries');
      const payload = JSON.parse(options.body);
      await save('request.json', { ...requestRecord(payload), payload }); // Only body; no authorization headers.
      const response = await fetch(url, options);
      const raw = await response.clone().text();
      await writeFile(path.join(output, 'provider-raw.txt'), raw, { flag: 'wx' });
      report.providerStatus = response.status;
      try { const data = JSON.parse(raw); report.returnedModel = data.model ?? null; report.usage = data.usage ?? null; } catch { /* Preserve invalid responses too. */ }
      return response;
    } });
  const response = await handler(new Request('http://localhost/api/ai', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer development-only' },
    body: JSON.stringify({ action: 'contract-extract', pages: source.pages }) }));
  const answer = await response.json();
  await save('validated-response.json', { status: response.status, ...answer });
  report.validationStatus = response.status;
  if (!response.ok) throw Error(answer.error);
  const draft = contractDraft(answer.data, source.pages);
  await save('comparison.json', { baselineVersion: source.extraction.version, aiVersion: answer.data.version,
    baseline: source.extraction.fields, ai: answer.data.fields, baselineDraft: source.draft, aiDraft: draft,
    note: 'Development comparison on the same recorded text, not independent accuracy.' });
  report.states = Object.fromEntries(Object.entries(answer.data.fields).map(([key, value]) => [key, value.estado]));
  report.draft = draft; report.passedValidation = true;
} catch (error) {
  report.passedValidation = false;
  report.error = env.DEEPSEEK_API_KEY ? error.message.replaceAll(env.DEEPSEEK_API_KEY, '[REDACTED]') : error.message;
  process.exitCode = 1;
} finally {
  report.elapsedMs = Date.now() - started;
  await save('summary.json', report);
  console.log(JSON.stringify({ passedValidation: report.passedValidation, providerCalls: report.providerCalls,
    validationStatus: report.validationStatus, elapsedMs: report.elapsedMs, states: report.states, error: report.error }, null, 2));
}
