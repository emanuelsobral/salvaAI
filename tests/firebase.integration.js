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
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  environment = await initializeTestEnvironment({ projectId: 'demo-salva-ai', firestore: { host: '127.0.0.1', port: 8080, rules } });
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
  await subs.createSubscription('alice', { name: 'Internet', amount: 75, frequency: 'MONTHLY', start_date: date, end_date: date, operation_id: 'recurring' });
  const recurring = (await subs.getSubscriptions('alice')).subs.find(item => item.billingMode === 'ACCOUNT');
  await Promise.all([
    subs.payRecurringBill('alice', recurring.id, date, date, 'recurring-pay-a'),
    subs.payRecurringBill('alice', recurring.id, date, date, 'recurring-pay-b')
  ]);
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 899.5);
  const paid = (await subs.getSubscriptions('alice')).subs.find(item => item.id === recurring.id).payments[date];
  await txns.deleteTransaction('alice', 'txn_' + paid.transactionId);
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 974.5);
  assert.deepEqual((await subs.getSubscriptions('alice')).subs.find(item => item.id === recurring.id).payments, {});
  await subs.deleteSubscription('alice', recurring.id);
  assert.equal((await subs.getSubscriptions('alice')).subs.find(item => item.id === recurring.id).isActive, false);
  const reconciliation = await service('reconciliationService');
  await subs.createSubscription('alice', { name: 'Água', amount: 30, frequency: 'MONTHLY', start_date: date, end_date: date, operation_id: 'water' });
  const water = (await subs.getSubscriptions('alice')).subs.find(item => item.name === 'Água');
  const statement = date + ';Conta de água;-30,00';
  await imports.importStatement('alice', statement);
  const imported = (await firestore.getDocs(firestore.collection(database, 'users/alice/transactions'))).docs.find(item => item.data().importFormat === 'csv' && item.data().amount === 30);
  await assertFails(firestore.updateDoc(imported.ref, { amount: 1 }));
  await assertFails(firestore.updateDoc(imported.ref, { kind: 'RECURRING_PAYMENT', subscriptionId: water.id, dueDate: date }));
  await Promise.all([
    reconciliation.reconcileTransaction('alice', imported.id, water.id, date),
    reconciliation.reconcileTransaction('alice', imported.id, water.id, date)
  ]).catch(error => { throw new Error('Conciliação concorrente: ' + error.message, { cause: error }); });
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 944.5);
  await assertFails(firestore.updateDoc(imported.ref, { kind: 'REGULAR', subscriptionId: null, dueDate: null }));
  await reconciliation.undoReconciliation('alice', imported.id);
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 944.5);
  await imports.importStatement('alice', statement, { reconciliations: [{ rowIndex: 0, subscriptionId: water.id, dueDate: date }] });
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 944.5);
  await txns.deleteTransaction('alice', 'txn_' + imported.id);
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 974.5);
  await subs.payRecurringBill('alice', water.id, date, date, 'water-manual');
  await imports.importStatement('alice', date + ';Água paga anteriormente;-30,00', { reconciliations: [{ rowIndex: 0, subscriptionId: water.id, dueDate: date }] });
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 944.5);
  const marker = firestore.doc(database, 'users/alice/operations/initial');
  const editPayload = { amount: 45, frequency: 'MONTHLY', start_date: date, effective_from: '2099-02-01', end_date: '2099-03-31', keep_calendar: true, expected_revision: 0, operation_id: 'water-edit' };
  await Promise.all([subs.editRecurringSubscription('alice', water.id, editPayload), subs.editRecurringSubscription('alice', water.id, editPayload)]);
  const revised = (await subs.getSubscriptions('alice')).subs.find(item => item.id === water.id);
  assert.equal(revised.amount, 30);
  assert.equal(revised.payments[date].amount, 30);
  assert.equal(revised.revisions.length, 1);
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 944.5);
  await assert.rejects(subs.editRecurringSubscription('alice', water.id, { ...editPayload, amount: 60, operation_id: 'water-stale' }), /outra tela/);
  await subs.payRecurringBill('alice', water.id, '2099-02-01', date, 'water-revised-payment', 45);
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 899.5);
  await assertFails(firestore.deleteDoc(marker));
  await assertFails(firestore.setDoc(marker, { fingerprint: 'tamper', result: {} }));
  // PDF uses the same atomic import and restricted reconciliation path.
  await subs.createSubscription('alice', { name: 'PDF teste', amount: 12.5, frequency: 'MONTHLY', start_date: date, end_date: date, operation_id: 'pdf-bill' });
  const pdfBill = (await subs.getSubscriptions('alice')).subs.find(item => item.name === 'PDF teste');
  const pdfText = date + ';PDF teste;-12,50';
  await imports.importStatement('alice', pdfText, { format: 'pdf' });
  const pdfTxn = (await firestore.getDocs(firestore.collection(database, 'users/alice/transactions'))).docs.find(item => item.data().importFormat === 'pdf');
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 887);
  await assertFails(firestore.updateDoc(pdfTxn.ref, { amount: 1 }));
  await assertFails(firestore.updateDoc(pdfTxn.ref, { kind: 'RECURRING_PAYMENT', subscriptionId: pdfBill.id, dueDate: date }));
  await reconciliation.reconcileTransaction('alice', pdfTxn.id, pdfBill.id, date);
  await reconciliation.undoReconciliation('alice', pdfTxn.id);
  await imports.importStatement('alice', pdfText, { format: 'csv' });
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 887);
  await txns.deleteTransaction('alice', 'txn_' + pdfTxn.id);
  assert.equal((await firestore.getDoc(generalRef)).data().balance, 899.5);
});
