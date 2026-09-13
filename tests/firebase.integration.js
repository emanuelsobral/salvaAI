import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as firestore from 'firebase/firestore';

let environment;
before(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Execute pelo emulador local em 127.0.0.1:8080.');
  environment = await initializeTestEnvironment({ projectId: 'demo-salva-ai', firestore: { host: '127.0.0.1', port: 8080, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
});
after(async () => { await environment?.cleanup(); });

async function services(database) {
  globalThis.__salvaTestDb = database;
  const root = fileURLToPath(new URL('../src/services/', import.meta.url));
  const firebaseUrl = pathToFileURL(path.join(root, 'firebase.js')).href;
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith('.') && context.parentURL?.includes('/src/') && !path.extname(specifier)) return nextResolve(specifier + '.js', context);
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === firebaseUrl) return { format: 'module', source: 'export const db = globalThis.__salvaTestDb;', shortCircuit: true };
      return nextLoad(url, context);
    }
  });
  return name => import(pathToFileURL(path.join(root, name + '.js')).href);
}

test('regras isolam usuários, bloqueiam anônimos e valores negativos', async () => {
  await environment.clearFirestore();
  const alice = environment.authenticatedContext('alice').firestore();
  const bob = environment.authenticatedContext('bob').firestore();
  const anonymous = environment.unauthenticatedContext().firestore();
  const account = { type: 'GENERAL', name: 'Conta', balance: 1000 };
  await assertSucceeds(firestore.setDoc(firestore.doc(alice, 'users/alice/accounts/GENERAL'), account));
  await assertFails(firestore.getDoc(firestore.doc(bob, 'users/alice/accounts/GENERAL')));
  await assertFails(firestore.getDoc(firestore.doc(anonymous, 'users/alice/accounts/GENERAL')));
  await assertFails(firestore.setDoc(firestore.doc(bob, 'users/alice/accounts/GENERAL'), account));
  await assertFails(firestore.setDoc(firestore.doc(alice, 'users/alice/transactions/invalid'), { accountId: 'GENERAL', accountType: 'GENERAL', amount: -100, type: 'EXPENSE', status: 'COMPLETED', description: 'Inválida', transactionDate: '2026-09-13' }));
  await assertFails(firestore.setDoc(firestore.doc(alice, 'users/alice/subscriptions/invalid'), { name: 'Teste', amount: 10, isActive: true, dueDay: 32 }));
});

test('serviços reais: concorrência, importação, pagamento e estorno sob as regras', async () => {
  await environment.clearFirestore();
  const database = environment.authenticatedContext('alice').firestore();
  const service = await services(database);
  const txns = await service('transactionService'), goals = await service('goalService'), cards = await service('cardService'), subs = await service('subscriptionService'), imports = await service('importService');
  await txns.createTransaction('alice', { transaction_type: 'INCOME', amount: 1000, date: '2026-09-13', source_account: 'GENERAL', description: 'Saldo inicial', category: 'SALARIO', operation_id: 'initial' });
  await goals.createGoal('alice', { name: 'Viagem', target_value: 2000, operation_id: 'goal' });
  const accounts = await firestore.getDocs(firestore.collection(database, 'users/alice/accounts'));
  const goal = accounts.docs.find(item => item.data().type === 'CAIXINHA');
  await Promise.all([goals.depositToGoal('alice', goal.id, 200, 'deposit'), goals.depositToGoal('alice', goal.id, 200, 'deposit')]);
  let history = await firestore.getDocs(firestore.collection(database, 'users/alice/transactions'));
  const source = history.docs.find(item => item.data().kind === 'TRANSFER' && item.data().type === 'EXPENSE');
  await txns.deleteTransaction('alice', 'txn_' + source.id);
  await imports.importCSV('alice', '13/09/2026;Mercado;-25,50');
  await imports.importCSV('alice', '13/09/2026;Mercado;-25,50');
  const now = new Date(), month = now.getMonth() + 1, year = now.getFullYear();
  const date = year + '-' + String(month).padStart(2, '0') + '-01';
  await subs.createSubscription('alice', { name: 'Streaming', amount: 50, due_day: 10, category: 'ASSINATURAS', operation_id: 'sub' });
  await cards.createCardTransaction('alice', { amount_total: 100, installments: 1, purchase_date: date, category: 'OUTROS', description: 'Compra', current_month: true, operation_id: 'card' });
  await Promise.all([cards.payInvoice('alice', month, year), cards.payInvoice('alice', month, year)]);
  const generalRef = firestore.doc(database, 'users/alice/accounts/GENERAL');
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 824.5);
  history = await firestore.getDocs(firestore.collection(database, 'users/alice/transactions'));
  const payment = history.docs.find(item => item.data().kind === 'INVOICE_PAYMENT');
  await txns.deleteTransaction('alice', 'txn_' + payment.id);
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 974.5);
  const marker = firestore.doc(database, 'users/alice/operations/initial');
  await assertFails(firestore.deleteDoc(marker));
  await assertFails(firestore.setDoc(marker, { fingerprint: 'tamper', result: {} }));
});
