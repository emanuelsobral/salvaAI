import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as firestore from 'firebase/firestore';
import { contractPlanSnapshot, previewContractAdjustment } from '../src/utils/contractAdjustment.js';
import { previewContractPlan } from '../src/utils/contractPlan.js';
import { localDate } from '../src/utils/finance.js';

let environment;
before(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Execute pelo emulador local em 127.0.0.1:8080.');
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  environment = await initializeTestEnvironment({ projectId: 'demo-salva-ai', firestore: { host: '127.0.0.1', port: 8080, rules } });
});
after(async () => { await environment?.cleanup(); });

test('contratos: regras isolam dados, validam campos e protegem revisão e criação', async () => {
  const alice = environment.authenticatedContext('alice').firestore();
  const bob = environment.authenticatedContext('bob').firestore();
  const anonymous = environment.unauthenticatedContext().firestore();
  const contract = {
    title: 'Aluguel', counterparty: '', amount: 2200, installments: null,
    startDate: '2026-01-01', endDate: '2026-12-31', dueRule: 'Dia 20', adjustmentRule: '', notes: '',
    schemaVersion: 1, revision: 0, createdAt: firestore.serverTimestamp(), updatedAt: firestore.serverTimestamp(),
  };
  const ref = firestore.doc(alice, 'users/alice/contracts/rules-test');
  await assertSucceeds(firestore.setDoc(ref, contract));
  for (const client of [bob, anonymous]) {
    await assertFails(firestore.getDoc(firestore.doc(client, ref.path)));
    await assertFails(firestore.setDoc(firestore.doc(client, ref.path), contract));
    await assertFails(firestore.getDocs(firestore.collection(client, 'users/alice/contracts')));
  }
  for (const invalid of [{ amount: -1 }, { installments: 1.5 }, { title: '' }, { notes: 'x'.repeat(3001) }, { startDate: '2027-01-01' }, { endDate: '2026-13-01' }, { status: 'PAID' }, { revision: 1 }]) {
    await assertFails(firestore.setDoc(firestore.doc(alice, 'users/alice/contracts/invalid'), { ...contract, ...invalid }));
  }
  await assertSucceeds(firestore.updateDoc(ref, { title: 'Aluguel revisado', revision: 1, updatedAt: firestore.serverTimestamp() }));
  await assertFails(firestore.updateDoc(ref, { title: 'Edição antiga', revision: 1, updatedAt: firestore.serverTimestamp() }));
  await assertFails(firestore.updateDoc(ref, { revision: 2, createdAt: firestore.Timestamp.fromMillis(0), updatedAt: firestore.serverTimestamp() }));
  await assertFails(firestore.deleteDoc(ref));
});

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

test('serviço de contratos persiste e edita sob as regras sem criar pagamentos', async () => {
  const database = environment.authenticatedContext('alice').firestore();
  const service = await services(database);
  const contracts = await service('contractService');
  const input = { title: 'Contrato fictício', amount: 1200, startDate: '2026-01-01' };
  const [first, repeated] = await Promise.all([
    contracts.saveContract('alice', input, { operationId: 'contract-create' }),
    contracts.saveContract('alice', input, { operationId: 'contract-create' }),
  ]);
  assert.equal(first.id, repeated.id);
  await contracts.saveContract('alice', { ...input, amount: null, dueRule: 'Após entrega' }, { id: first.id, expectedRevision: 0, operationId: 'contract-edit' });
  await assert.rejects(contracts.saveContract('alice', input, { id: first.id, expectedRevision: 0, operationId: 'contract-stale' }), /outra tela/);
  const saved = (await contracts.getContracts('alice')).find(item => item.id === first.id);
  assert.equal(saved.amount, null);
  assert.equal(saved.revision, 1);
  for (const name of ['accounts', 'subscriptions', 'transactions']) {
    assert.equal((await firestore.getDocs(firestore.collection(database, 'users/alice/' + name))).size, 0);
  }
});

test('PDF de contrato: origem persiste sob as regras e não pode ser substituída', async () => {
  await environment.clearFirestore();
  const database = environment.authenticatedContext('alice').firestore();
  const contracts = await (await services(database))('contractService');
  const fields = Object.fromEntries(['valor_parcela', 'numero_parcelas', 'data_vencimento', 'vigencia', 'regra_reajuste'].map(key => [key, { estado: 'nao_identificado', motivo: 'Documento fictício sem este campo.', evidencias: [], valor: null }]));
  const sourceReview = { method: 'PDF_TEXT_REVIEW', pdfSha256: 'a'.repeat(64), extractorVersion: '0.1.25', resultJson: JSON.stringify(fields) };
  const ocrSource = { ...sourceReview, method: 'PDF_OCR_REVIEW' };
  const aiSource = { ...sourceReview, method: 'PDF_DEEPSEEK_OCR_REVIEW' };
  const aiCreated = await contracts.saveContract('alice', { title: 'OCR DeepSeek fictício', sourceReview: aiSource }, { operationId: 'ai-contract' });
  const aiRef = firestore.doc(database, 'users/alice/contracts/' + aiCreated.id);
  assert.deepEqual((await firestore.getDoc(aiRef)).data().sourceReview, aiSource);
  await assertFails(firestore.updateDoc(aiRef, { sourceReview, revision: 1, updatedAt: firestore.serverTimestamp() }));
  const ocrCreated = await contracts.saveContract('alice', { title: 'OCR fictício revisado', sourceReview: ocrSource }, { operationId: 'ocr-contract' });
  const ocrRef = firestore.doc(database, 'users/alice/contracts/' + ocrCreated.id);
  assert.deepEqual((await firestore.getDoc(ocrRef)).data().sourceReview, ocrSource);
  await assertFails(firestore.updateDoc(ocrRef, { sourceReview, revision: 1, updatedAt: firestore.serverTimestamp() }));
  const input = { title: 'PDF fictício revisado', sourceReview };
  const created = await contracts.saveContract('alice', input, { operationId: 'pdf-contract' });
  const ref = firestore.doc(database, 'users/alice/contracts/' + created.id);
  await contracts.saveContract('alice', { title: 'Correção manual', amount: 123 }, { id: created.id, expectedRevision: 0, operationId: 'pdf-edit' });
  const saved = (await firestore.getDoc(ref)).data();
  assert.deepEqual(saved.sourceReview, sourceReview);
  for (const invalid of [{ ...sourceReview, pdfSha256: 'b'.repeat(64) }, firestore.deleteField()]) {
    await assertFails(firestore.updateDoc(ref, { sourceReview: invalid, revision: 2, updatedAt: firestore.serverTimestamp() }));
  }
  for (const invalid of [{ ...sourceReview, pdfSha256: 'invalid' }, { ...sourceReview, resultJson: 'x'.repeat(100001) }, { ...sourceReview, extra: true }]) {
    await assertFails(firestore.setDoc(firestore.doc(database, 'users/alice/contracts/pdf-invalid'), { ...saved, revision: 0, createdAt: firestore.serverTimestamp(), updatedAt: firestore.serverTimestamp(), sourceReview: invalid }));
  }
  for (const name of ['accounts', 'subscriptions', 'transactions']) assert.equal((await firestore.getDocs(firestore.collection(database, 'users/alice/' + name))).size, 0);
});

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

test('plano de contrato: vínculo atômico, isolamento, imutabilidade e pagamento com estorno', async () => {
  await environment.clearFirestore();
  const database = environment.authenticatedContext('alice').firestore();
  const service = await services(database);
  const contracts = await service('contractService');
  const subs = await service('subscriptionService');
  const txns = await service('transactionService');
  const today = new Date().toLocaleDateString('en-CA');
  const { id } = await contracts.saveContract('alice', { title: 'Contrato com plano' }, { operationId: 'plan-contract' });
  const input = { amount: 100, count: 3, frequency: 'MONTHLY', firstDueDate: today };
  const outcomes = await Promise.allSettled(['plan-a', 'plan-b'].map(operationId => contracts.createContractPlan('alice', id, input, { expectedRevision: 0, operationId })));
  assert.equal(outcomes.filter(item => item.status === 'fulfilled').length, 1);
  const result = outcomes.find(item => item.status === 'fulfilled').value;
  const contractRef = firestore.doc(database, 'users/alice/contracts/' + id);
  const subRef = firestore.doc(database, 'users/alice/subscriptions/' + result.commitmentPlan.subscriptionId);
  assert.equal((await firestore.getDocs(firestore.collection(database, 'users/alice/accounts'))).size, 0);
  assert.equal((await firestore.getDocs(firestore.collection(database, 'users/alice/transactions'))).size, 0);
  assert.equal((await firestore.getDocs(firestore.collection(database, 'users/alice/subscriptions'))).size, 1);
  await assertFails(firestore.updateDoc(subRef, { amount: 1 }));
  await assertFails(firestore.updateDoc(subRef, { contractId: 'other' }));
  await assertFails(firestore.updateDoc(subRef, { revisions: [{ amount: 1 }] }));
  await assertFails(firestore.updateDoc(contractRef, { commitmentPlan: { ...result.commitmentPlan, amount: 1 }, revision: 2, updatedAt: firestore.serverTimestamp() }));
  await assertFails(firestore.getDoc(firestore.doc(environment.authenticatedContext('bob').firestore(), subRef.path)));
  await contracts.saveContract('alice', { title: 'Cadastro revisado' }, { id, expectedRevision: 1, operationId: 'plan-edit' });
  assert.equal((await firestore.getDoc(contractRef)).data().commitmentPlan.amount, 100);
  // Um vínculo divergente deve falhar inteiro, sem deixar um contrato ou uma conta pela metade.
  const another = await contracts.saveContract('alice', { title: 'Outro' }, { operationId: 'other-contract' });
  const anotherRef = firestore.doc(database, 'users/alice/contracts/' + another.id);
  const badSub = firestore.doc(database, 'users/alice/subscriptions/contract_' + another.id);
  const batch = firestore.writeBatch(database);
  batch.update(anotherRef, { commitmentPlan: { ...result.commitmentPlan, subscriptionId: badSub.id }, revision: 1, updatedAt: firestore.serverTimestamp() });
  batch.set(badSub, { ...(await firestore.getDoc(subRef)).data(), name: 'Outro', amount: 99, contractId: another.id, createdAt: firestore.serverTimestamp() });
  await assertFails(batch.commit());
  assert.equal((await firestore.getDoc(badSub)).exists(), false);
  assert.equal((await firestore.getDoc(anotherRef)).data().commitmentPlan, undefined);
  await txns.createTransaction('alice', { transaction_type: 'INCOME', amount: 1000, date: today, source_account: 'GENERAL', description: 'Saldo fictício', category: 'OUTROS', operation_id: 'plan-income' });
  await Promise.all(['payment-a', 'payment-b'].map(key => subs.payRecurringBill('alice', subRef.id, today, today, key, 100)));
  const accountRef = firestore.doc(database, 'users/alice/accounts/GENERAL');
  assert.equal((await firestore.getDoc(accountRef)).data().balance, 900);
  const payment = (await firestore.getDoc(subRef)).data().payments[today];
  await txns.deleteTransaction('alice', 'txn_' + payment.transactionId);
  assert.equal((await firestore.getDoc(accountRef)).data().balance, 1000);
  assert.deepEqual((await firestore.getDoc(subRef)).data().payments, {});
  await subs.deleteSubscription('alice', subRef.id);
  await assertFails(firestore.updateDoc(subRef, { isActive: true }));
});

test('reajustes de contrato: confirmação atômica, histórico imutável e pagamentos sob as regras', async () => {
  await environment.clearFirestore();
  const database = environment.authenticatedContext('alice').firestore();
  const service = await services(database);
  const contracts = await service('contractService'), subs = await service('subscriptionService'), txns = await service('transactionService');
  const today = localDate();
  const { id } = await contracts.saveContract('alice', { title: 'Contrato reajustável' }, { operationId: 'adjust-contract' });
  const plan = previewContractPlan({ amount: 100.25, count: 4, frequency: 'MONTHLY', firstDueDate: today });
  const created = await contracts.createContractPlan('alice', id, plan, { expectedRevision: 0, operationId: 'adjust-plan' });
  const subRef = firestore.doc(database, 'users/alice/subscriptions/' + created.commitmentPlan.subscriptionId);
  const contractRef = firestore.doc(database, 'users/alice/contracts/' + id);
  const initial = (await firestore.getDoc(subRef)).data();
  const input = { type: 'PERCENT', value: 10, effectiveFrom: plan.rows[1].dueDate };
  const preview = previewContractAdjustment(initial, input);
  await assertFails(firestore.updateDoc(subRef, { revisions: [preview.revision], updatedAt: firestore.serverTimestamp() }));
  const options = { expectedRevision: 1, expectedSnapshot: contractPlanSnapshot(initial), operationId: 'adjust-once' };
  const attempts = await Promise.allSettled([contracts.adjustContractPlan('alice', id, input, options), contracts.adjustContractPlan('alice', id, input, options)]);
  assert.ok(attempts.some(attempt => attempt.status === 'fulfilled'));
  // O emulador pode avaliar as regras da segunda escrita após o primeiro commit
  // e recusá-la antes de repetir a transação. A recusa continua sendo um erro.
  for (const attempt of attempts.filter(item => item.status === 'rejected')) assert.equal(attempt.reason.code, 'permission-denied');
  // Repetição posterior consulta a operação confirmada, sem uma segunda escrita.
  const repeated = await contracts.adjustContractPlan('alice', id, input, options);
  assert.equal(repeated.revision, 2);
  const saved = (await firestore.getDoc(subRef)).data();
  assert.equal(saved.revisions.length, 1);
  assert.equal(saved.revisions[0].amount, 110.28);
  assert.equal((await firestore.getDoc(contractRef)).data().revision, 2);
  const rejectBatch = async (subChange, contractChange = {}) => {
    const batch = firestore.writeBatch(database);
    batch.update(subRef, { ...subChange, updatedAt: firestore.serverTimestamp() });
    batch.update(contractRef, { revision: 3, updatedAt: firestore.serverTimestamp(), ...contractChange });
    await assertFails(batch.commit());
  };
  const second = previewContractAdjustment(saved, { type: 'AMOUNT', value: 120, effectiveFrom: plan.rows[2].dueDate }).revision;
  await rejectBatch({ revisions: [{ ...saved.revisions[0], amount: 1 }, second] });
  await rejectBatch({ revisions: [] });
  await rejectBatch({ revisions: [...saved.revisions, { ...second, startDate: second.effectiveFrom }] });
  await rejectBatch({ revisions: [...saved.revisions, { ...second, effectiveFrom: '2000-01-01' }] });
  await rejectBatch({ revisions: [...saved.revisions, { ...second, amount: 0 }] });
  await rejectBatch({ revisions: [...saved.revisions, { ...second, previousAmount: 999 }] });
  await rejectBatch({ revisions: [...saved.revisions, second], payments: { [today]: { amount: 1 } } });
  await rejectBatch({ revisions: [...saved.revisions, second] }, { title: 'Cadastro alterado junto' });
  await assertFails(firestore.updateDoc(firestore.doc(environment.authenticatedContext('bob').firestore(), subRef.path), { revisions: [second] }));
  assert.equal((await firestore.getDoc(subRef)).data().revisions.length, 1);
  await contracts.adjustContractPlan('alice', id, { type: 'AMOUNT', value: 120, effectiveFrom: plan.rows[2].dueDate }, { expectedRevision: 2, expectedSnapshot: contractPlanSnapshot(saved), operationId: 'second-adjustment' });
  await txns.createTransaction('alice', { transaction_type: 'INCOME', amount: 1000, date: today, source_account: 'GENERAL', description: 'Saldo fictício', category: 'OUTROS', operation_id: 'adjust-income' });
  await assert.rejects(subs.payRecurringBill('alice', subRef.id, plan.rows[1].dueDate, today, 'stale-adjust-payment', 100.25), /valor.*mudou/);
  const payment = await subs.payRecurringBill('alice', subRef.id, plan.rows[1].dueDate, today, 'adjust-payment', 110.28);
  assert.equal((await firestore.getDoc(firestore.doc(database, 'users/alice/accounts/GENERAL'))).data().balance, 889.72);
  await txns.deleteTransaction('alice', 'txn_' + payment.transaction_id);
  assert.equal((await firestore.getDoc(firestore.doc(database, 'users/alice/accounts/GENERAL'))).data().balance, 1000);
  assert.equal((await firestore.getDoc(subRef)).data().revisions.length, 2);
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

test('encerramento: vínculo atômico, cadastro imutável e pagamentos preservados nas regras', async () => {
  await environment.clearFirestore();
  const database = environment.authenticatedContext('alice').firestore();
  const service = await services(database);
  const contracts = await service('contractService'), subs = await service('subscriptionService'), txns = await service('transactionService');
  const today = localDate();
  const { id } = await contracts.saveContract('alice', { title: 'Contrato encerrável' }, { operationId: 'closure-create' });
  const plan = previewContractPlan({ amount: 100, count: 4, frequency: 'MONTHLY', firstDueDate: today });
  const result = await contracts.createContractPlan('alice', id, plan, { expectedRevision: 0, operationId: 'closure-plan' });
  const contractRef = firestore.doc(database, 'users/alice/contracts/' + id);
  const subRef = firestore.doc(database, 'users/alice/subscriptions/' + result.commitmentPlan.subscriptionId);
  const closure = { closedOn: today, reason: 'Fim do serviço', subscriptionId: subRef.id };
  await assertFails(firestore.updateDoc(contractRef, { closure, revision: 2, updatedAt: firestore.serverTimestamp() }));
  const badBatch = firestore.writeBatch(database);
  badBatch.update(contractRef, { closure, revision: 2, updatedAt: firestore.serverTimestamp() });
  badBatch.update(subRef, { isActive: false, cancelledOn: '2000-01-01', cancelledAt: firestore.serverTimestamp() });
  await assertFails(badBatch.commit());
  assert.equal((await firestore.getDoc(contractRef)).data().closure, undefined);
  assert.equal((await firestore.getDoc(subRef)).data().isActive, true);
  await txns.createTransaction('alice', { transaction_type: 'INCOME', amount: 1000, date: today, source_account: 'GENERAL', description: 'Saldo fictício', category: 'OUTROS', operation_id: 'closure-income' });
  const anticipated = await subs.payRecurringBill('alice', subRef.id, plan.rows[1].dueDate, today, 'closure-advance', 100);
  const before = (await firestore.getDoc(subRef)).data();
  const options = { expectedRevision: 1, expectedSnapshot: contractPlanSnapshot(before), operationId: 'closure-confirm' };
  const input = { closedOn: today, reason: closure.reason };
  await contracts.closeContract('alice', id, input, options);
  await contracts.closeContract('alice', id, input, options);
  const closed = (await firestore.getDoc(contractRef)).data();
  assert.deepEqual(closed.closure, closure);
  assert.equal(closed.revision, 2);
  assert.deepEqual((await firestore.getDoc(subRef)).data().payments, before.payments);
  for (const change of [{ closure: firestore.deleteField() }, { title: 'Reabrir' }, { closure: { ...closure, reason: 'Outro' } }]) {
    await assertFails(firestore.updateDoc(contractRef, { ...change, revision: 3, updatedAt: firestore.serverTimestamp() }));
  }
  for (const change of [{ isActive: true }, { cancelledOn: plan.lastDueDate }, { cancelledAt: firestore.serverTimestamp() }, { revisions: [] }]) await assertFails(firestore.updateDoc(subRef, change));
  await assertFails(firestore.updateDoc(firestore.doc(environment.authenticatedContext('bob').firestore(), contractRef.path), { closure, revision: 3, updatedAt: firestore.serverTimestamp() }));
  await assert.rejects(subs.payRecurringBill('alice', subRef.id, plan.rows[2].dueDate, today, 'closure-cancelled', 100), /cancelado/);
  await txns.deleteTransaction('alice', 'txn_' + anticipated.transaction_id);
  const todayPayment = await subs.payRecurringBill('alice', subRef.id, plan.firstDueDate, today, 'closure-today', 100);
  await txns.deleteTransaction('alice', 'txn_' + todayPayment.transaction_id);
  assert.equal((await firestore.getDoc(firestore.doc(database, 'users/alice/accounts/GENERAL'))).data().balance, 1000);
  assert.deepEqual((await firestore.getDoc(subRef)).data().payments, {});
  assert.deepEqual((await firestore.getDoc(contractRef)).data(), closed);

  const manual = await contracts.saveContract('alice', { title: 'Sem plano' }, { operationId: 'manual-close-create' });
  await contracts.closeContract('alice', manual.id, input, { expectedRevision: 0, expectedSnapshot: null, operationId: 'manual-close' });
  await assert.rejects(contracts.createContractPlan('alice', manual.id, plan, { expectedRevision: 1, operationId: 'manual-late-plan' }), /encerrado/);
  const legacy = await contracts.saveContract('alice', { title: 'Recorrência encerrada' }, { operationId: 'legacy-close-create' });
  const legacyPlan = await contracts.createContractPlan('alice', legacy.id, plan, { expectedRevision: 0, operationId: 'legacy-plan' });
  await subs.deleteSubscription('alice', legacyPlan.commitmentPlan.subscriptionId);
  const legacySub = await contracts.getContractSubscription('alice', legacy.id);
  await contracts.closeContract('alice', legacy.id, input, { expectedRevision: 1, expectedSnapshot: contractPlanSnapshot(legacySub), operationId: 'legacy-close' });
  assert.deepEqual(await contracts.getContractSubscription('alice', legacy.id), legacySub);
});
