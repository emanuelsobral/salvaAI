import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { requestRecord, artifactRecords } from '../scripts/contract-run-record.mjs';

test('registro distingue mudança de prompt de mudança da imagem sem copiar conteúdo', () => {
  const payload = { model: 'example-model', max_tokens: 100, messages: [{ role: 'user', content: [
    { type: 'text', text: 'Transcreva' }, { type: 'image_url', image_url: { url: 'private-image' } },
  ] }] };
  const first = requestRecord(payload);
  payload.messages[0].content[1].image_url.url = 'other-image';
  const second = requestRecord(payload);
  assert.equal(first.promptSha256, second.promptSha256);
  assert.notEqual(first.payloadSha256, second.payloadSha256);
  assert.equal(first.temperature, null);
  assert.equal(JSON.stringify(first).includes('private-image'), false);
  payload.messages[0].content[0].text = 'Outra instrução';
  assert.notEqual(first.promptSha256, requestRecord(payload).promptSha256);
});

test('inventário detecta mudança de artefato e ignora arquivos alheios', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'contract-record-'));
  try {
    await writeFile(path.join(directory, 'page-1.json'), '{}');
    await writeFile(path.join(directory, '.env'), 'private');
    const first = await artifactRecords(directory);
    assert.equal(first.length, 1);
    await writeFile(path.join(directory, 'page-1.json'), '{"changed":true}');
    assert.notEqual(first[0].sha256, (await artifactRecords(directory))[0].sha256);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
