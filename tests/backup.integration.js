// Dados exclusivamente fictícios. Não carrega credenciais nem permite destinos de nuvem.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { collectDocuments, databaseRoot, decryptBackup, emulatorTarget, encryptBackup, makeBackup, restoreToEmulator } from '../scripts/backup/core.mjs';
import { localRequest } from '../scripts/backup/firestore-backup.mjs';

test('backup criptografado restaura documentos e saldos no Firestore isolado', async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  const source = `demo-salvaai-restore-source-${Date.now()}`;
  const target = `demo-salvaai-restore-target-${Date.now()}`;
  const request = localRequest(emulatorTarget(source, host));
  const root = databaseRoot(source);
  const timestamp = { timestampValue: '2026-10-27T12:00:00.123456Z' };
  const docs = [
    { path: 'users/alice/accounts/GENERAL', fields: { balance: { doubleValue: -210.25 }, type: { stringValue: 'GENERAL' } } },
    { path: 'users/bob/accounts/GENERAL', fields: { balance: { doubleValue: 310.5 } } },
    { path: 'users/alice/contracts/lease', fields: { amount: { doubleValue: 100 }, createdAt: timestamp,
      closure: { mapValue: { fields: { closedOn: { stringValue: '2026-10-27' }, subscriptionId: { stringValue: 'contract_lease' } } } },
      sourceReview: { mapValue: { fields: { resultJson: { stringValue: '{"fixture":true}' } } } } } },
    { path: 'users/alice/subscriptions/contract_lease', fields: { isActive: { booleanValue: false }, contractId: { stringValue: 'lease' },
      revisions: { arrayValue: { values: [{ mapValue: { fields: { amount: { doubleValue: 120 }, effectiveFrom: { stringValue: '2027-01-01' } } } }] } },
      payments: { mapValue: { fields: { '2026-10-27': { mapValue: { fields: { transactionId: { stringValue: 'payment' }, amount: { doubleValue: 100 } } } } } } } } },
    { path: 'users/alice/transactions/payment', fields: { amount: { doubleValue: 100 }, accountId: { stringValue: 'GENERAL' } } },
    { path: 'users/alice/importRows/import', fields: { transactionId: { stringValue: 'payment' } } },
    { path: 'users/alice/operations/payment', fields: { fingerprint: { stringValue: 'fixture' }, result: { mapValue: { fields: { id: { stringValue: 'payment' } } } } } },
    { path: 'users/alice/contracts/lease/events/one', fields: { linked: { referenceValue: root + '/users/alice/contracts/lease' } } },
    { path: 'types/test', fields: { big: { integerValue: '9007199254740993' }, nullable: { nullValue: null }, emptyMap: { mapValue: {} }, emptyArray: { arrayValue: {} }, bytes: { bytesValue: 'YWJj' }, geo: { geoPointValue: { latitude: -23.5, longitude: -46.6 } } } },
    { path: 'empty/document', fields: {} },
  ];
  await request('POST', `${root}:commit`, { writes: docs.map(doc => ({ update: { name: `${root}/${doc.path}`, fields: doc.fields }, currentDocument: { exists: false } })) });
  const exported = makeBackup(source, await collectDocuments(request, source));
  assert.equal(exported.documents.length, docs.length);
  const key = randomBytes(32);
  const opened = decryptBackup(encryptBackup(exported, key), key);
  const result = await restoreToEmulator(opened, target, request, host);
  assert.equal(result.verified, true);
  assert.equal(result.documents, docs.length);
  assert.equal(result.accounts, 2);
  assert.equal(result.balanceCents, '10025');
  await assert.rejects(restoreToEmulator(opened, target, request, host), /não está vazio/);
  const parent = await fetch(`${emulatorTarget(target, host)}${databaseRoot(target)}/users/alice`, { headers: { Authorization: 'Bearer owner' } });
  assert.equal(parent.status, 404);
});
