import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getFirebaseConfig } from '../src/config/firebaseConfig.js';

const configured = {
  VITE_FIREBASE_API_KEY: 'test-public-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'example.invalid',
  VITE_FIREBASE_PROJECT_ID: 'demo-test',
  VITE_FIREBASE_APP_ID: 'test-app',
};

test('configuração Firebase rejeita ambiente ausente e não revela valores no erro', () => {
  assert.throws(() => getFirebaseConfig({}), /VITE_FIREBASE_API_KEY/);
  assert.throws(() => getFirebaseConfig({ ...configured, VITE_FIREBASE_APP_ID: '  ' }), error => {
    assert.match(error.message, /VITE_FIREBASE_APP_ID/);
    assert.ok(!error.message.includes(configured.VITE_FIREBASE_API_KEY));
    return true;
  });
});

test('configuração Firebase aceita projetos diferentes sem depender de valores fixos', () => {
  assert.equal(getFirebaseConfig(configured).projectId, 'demo-test');
  assert.equal(getFirebaseConfig({ ...configured, VITE_FIREBASE_PROJECT_ID: ' outro-projeto ' }).projectId, 'outro-projeto');
  assert.equal(getFirebaseConfig(configured).storageBucket, undefined);
  assert.equal(getFirebaseConfig({ ...configured, VITE_FIREBASE_STORAGE_BUCKET: ' bucket-teste ' }).storageBucket, 'bucket-teste');
});
