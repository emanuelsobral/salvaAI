import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { collectDocuments, databaseRoot, decryptBackup, digest, emulatorTarget, encryptBackup, makeBackup, restoreToEmulator, summary, validateBackup } from '../scripts/backup/core.mjs';
import { localRequest } from '../scripts/backup/firestore-backup.mjs';

const project = 'demo-backup-source';
const root = databaseRoot(project);
const target = 'demo-salvaai-restore-unit';
const host = '127.0.0.1:8080';
const docs = [
  { path: 'users/alice/accounts/GENERAL', fields: { balance: { doubleValue: -210.25 }, name: { stringValue: 'Fictícia' } } },
  { path: 'users/alice/contracts/first', fields: { amount: { integerValue: '120' }, due: { timestampValue: '2026-01-01T00:00:00Z' }, optional: { nullValue: null }, proof: { bytesValue: 'YWJj' }, active: { booleanValue: false }, revisions: { arrayValue: { values: [{ mapValue: { fields: { amount: { doubleValue: 120 } } } }] } } } },
  { path: 'users/bob/accounts/GENERAL', fields: { balance: { integerValue: '300' } } },
];

test('backup criptografado preserva tipos, saldo, IDs e vínculos sem texto legível', () => {
  const backup = makeBackup(project, docs, '2026-10-27T00:00:00Z');
  const key = randomBytes(32), encrypted = encryptBackup(backup, key);
  assert.deepEqual(decryptBackup(encrypted, key), backup);
  assert.equal(encrypted.includes(Buffer.from('Fictícia')), false);
  assert.equal(encrypted.includes(Buffer.from('alice')), false);
  assert.equal(summary(backup).balanceCents, '8975');
  assert.notDeepEqual(encryptBackup(backup, key), encrypted);
});

test('backup recusa chave errada, truncamento e adulteração', () => {
  const key = randomBytes(32), encrypted = encryptBackup(makeBackup(project, docs), key);
  assert.throws(() => decryptBackup(encrypted, randomBytes(32)), /chave incorreta/);
  assert.throws(() => decryptBackup(encrypted.subarray(0, -10), key), /arquivo alterado/);
  for (const index of [0, 20, 35, encrypted.length - 1]) {
    const changed = Buffer.from(encrypted); changed[index] ^= 1;
    assert.throws(() => decryptBackup(changed, key));
  }
});

test('backup recusa versão, checksum, caminhos, duplicatas e tamanho inválidos', () => {
  const backup = makeBackup(project, docs);
  assert.throws(() => validateBackup({ ...backup, version: 2 }), /Formato/);
  assert.throws(() => validateBackup({ ...backup, sha256: '0'.repeat(64) }), /integridade/);
  for (const path of ['users/alice/accounts', '../alice', '/users/alice', 'users//a/b', 'users/alice/../x']) {
    assert.throws(() => makeBackup(project, [{ path, fields: {} }]), /Documento/);
  }
  assert.throws(() => makeBackup(project, [docs[0], docs[0]]), /duplicado/);
  assert.throws(() => makeBackup(project, Array(5001).fill(docs[0])), /Quantidade/);
  assert.equal(digest(docs), digest([...docs].reverse()));
});

test('destino de restauração exige projeto demo dedicado e endereço local literal', () => {
  assert.equal(emulatorTarget(target, host), 'http://127.0.0.1:8080/v1/');
  for (const bad of ['salvaai-ff2a1', 'demo-salva-ai', '../demo-salvaai-restore-x']) assert.throws(() => emulatorTarget(bad, host));
  for (const bad of ['', 'localhost:8080', '127.0.0.1.evil:8080', 'https://firestore.googleapis.com', '127.0.0.1:99999']) assert.throws(() => emulatorTarget(target, bad));
  assert.throws(() => localRequest('https://firestore.googleapis.com/v1/'));
});

function memoryStore(sourceRoot, records) {
  const data = new Map(records.map(doc => [`${sourceRoot}/${doc.path}`, doc.fields]));
  const calls = [];
  async function request(method, route, body) {
    calls.push({ method, route, body });
    const [rawPath, query] = route.split('?'), decoded = decodeURIComponent(rawPath);
    if (decoded.endsWith(':commit')) {
      for (const write of body.writes) {
        assert.deepEqual(write.currentDocument, { exists: false });
        if (data.has(write.update.name)) throw Error('already exists');
      }
      for (const write of body.writes) data.set(write.update.name, structuredClone(write.update.fields));
      return {};
    }
    if (decoded.endsWith(':listCollectionIds')) {
      const prefix = decoded.slice(0, -18) + '/';
      return { collectionIds: [...new Set([...data.keys()].filter(name => name.startsWith(prefix)).map(name => name.slice(prefix.length).split('/')[0]))] };
    }
    assert.equal(method, 'GET');
    const params = new URLSearchParams(query);
    assert.equal(params.get('showMissing'), 'true');
    const prefix = decoded + '/';
    const names = [...new Set([...data.keys()].filter(name => name.startsWith(prefix)).map(name => prefix + name.slice(prefix.length).split('/')[0]))];
    return { documents: names.map(name => data.has(name) ? { name, fields: data.get(name), createTime: '2026-01-01T00:00:00Z' } : { name }) };
  }
  return { data, calls, request };
}

test('leitura recursiva inclui filhos de pais ausentes e fixa o mesmo readTime', async () => {
  const store = memoryStore(root, docs);
  const time = '2026-10-27T00:00:00Z';
  const result = await collectDocuments(store.request, project, time);
  assert.equal(digest(result), digest(docs));
  assert.equal(result.some(doc => doc.path === 'users/alice'), false);
  for (const call of store.calls) {
    assert.equal(call.method === 'GET' ? new URLSearchParams(call.route.split('?')[1]).get('readTime') : call.body.readTime, time);
  }
});

test('paginação de documentos e coleções não perde dados', async () => {
  const calls = [];
  const request = async (method, route, body) => {
    calls.push({ method, route, body });
    if (method === 'POST') {
      if (decodeURIComponent(route) !== root + ':listCollectionIds') return {};
      return body.pageToken ? { collectionIds: ['second'] } : { collectionIds: ['first'], nextPageToken: 'collections-2' };
    }
    const decoded = decodeURIComponent(route.split('?')[0]);
    const page = new URLSearchParams(route.split('?')[1]).get('pageToken');
    if (decoded.endsWith('/second')) return { documents: [{ name: root + '/second/one', fields: {}, createTime: 'now' }] };
    return { documents: [{ name: root + '/first/' + (page ? 'two' : 'one'), fields: {}, createTime: 'now' }], ...(page ? {} : { nextPageToken: 'documents-2' }) };
  };
  assert.equal((await collectDocuments(request, project)).length, 3);
  assert.equal(calls.some(call => call.body?.pageToken === 'collections-2'), true);
});

test('restauração compara todos os campos e saldos sem recriar pai ausente', async () => {
  const store = memoryStore(databaseRoot(target), []);
  const result = await restoreToEmulator(makeBackup(project, docs), target, store.request, host);
  assert.equal(result.verified, true);
  assert.equal(result.documents, 3);
  assert.equal(result.balanceCents, '8975');
  assert.equal(store.data.has(`${databaseRoot(target)}/users/alice`), false);
});

test('restauração recusa destino ocupado e nunca sobrescreve', async () => {
  const store = memoryStore(databaseRoot(target), docs);
  await assert.rejects(restoreToEmulator(makeBackup(project, docs), target, store.request, host), /não está vazio/);
  assert.equal(store.calls.some(call => call.route.endsWith(':commit')), false);
});

test('restauração divide lotes por quantidade e por tamanho', async () => {
  for (const records of [
    Array.from({ length: 101 }, (_, i) => ({ path: `items/${i}`, fields: {} })),
    Array.from({ length: 9 }, (_, i) => ({ path: `items/${i}`, fields: { text: { stringValue: 'a'.repeat(1000000) } } })),
  ]) {
    const store = memoryStore(databaseRoot(target), []);
    await restoreToEmulator(makeBackup(project, records), target, store.request, host);
    const batches = store.calls.filter(call => call.route.endsWith(':commit'));
    assert.equal(batches.length, 2);
    for (const batch of batches) {
      assert.ok(batch.body.writes.length <= 100);
      assert.ok(Buffer.byteLength(JSON.stringify(batch.body)) < 9 * 1024 * 1024);
    }
  }
});

test('referências internas seguem o destino e externas são recusadas antes de gravar', async () => {
  const source = [{ path: 'test/one', fields: { linked: { referenceValue: root + '/test/two' } } }];
  const store = memoryStore(databaseRoot(target), []);
  await restoreToEmulator(makeBackup(project, source), target, store.request, host);
  assert.equal(store.data.get(databaseRoot(target) + '/test/one').linked.referenceValue, databaseRoot(target) + '/test/two');
  const bad = makeBackup(project, [{ path: 'test/one', fields: { ref: { referenceValue: 'projects/outside/databases/(default)/documents/test/a' } } }]);
  const empty = memoryStore(databaseRoot(target), []);
  await assert.rejects(restoreToEmulator(bad, target, empty.request, host), /externa/);
  assert.equal(empty.calls.length, 0);
});

test('falha de leitura ou divergência após gravação não produz sucesso', async () => {
  await assert.rejects(collectDocuments(async () => { throw Error('offline'); }, project), /offline/);
  const store = memoryStore(databaseRoot(target), []);
  const changed = async (...args) => {
    const result = await store.request(...args);
    if (args[1].endsWith(':commit')) store.data.get(databaseRoot(target) + '/users/alice/accounts/GENERAL').balance = { doubleValue: 0 };
    return result;
  };
  await assert.rejects(restoreToEmulator(makeBackup(project, structuredClone(docs)), target, changed, host), /não confere/);
});
