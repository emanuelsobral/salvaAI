import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './firestoreHarness.js';
import { suggestRecurringMatches } from '../src/utils/reconciliation.js';
import { calculateDashboard } from '../src/utils/dashboard.js';

const bill = { name: 'Internet', amount: 100, billingMode: 'ACCOUNT', frequency: 'MONTHLY', startDate: '2026-01-10', endDate: '2026-03-10', dueDay: 10, isActive: true, payments: {} };
const text = '12/01/2026;Internet residencial;-100,00';
const choice = { rowIndex: 0, subscriptionId: 'internet', dueDate: '2026-01-10' };
const options = { reconciliations: [choice] };
async function setup() {
  const h = await harness();
  h.seed('accounts', 'general', { type: 'GENERAL', name: 'Conta', balance: 1000 });
  h.seed('subscriptions', 'internet', bill);
  return { h, imports: await h.service('importService'), subs: await h.service('subscriptionService'), reconcile: await h.service('reconciliationService'), txns: await h.service('transactionService') };
}

test('sugestões exigem valor exato, conta corrente e data próxima; descrição ordena sem decidir', () => {
  const rows = [{ date: '2026-01-12', type: 'EXPENSE', amount: 100, description: 'Internet residencial' }];
  const bills = [{ id: 'other', ...bill, name: 'Academia' }, { id: 'internet', ...bill }];
  const matches = suggestRecurringMatches(rows, bills)[0];
  assert.equal(matches.length, 2);
  assert.equal(matches[0].subscriptionId, 'internet');
  assert.equal(matches[0].descriptionMatch, true);
  assert.deepEqual(suggestRecurringMatches(rows, bills, 'VR'), [[]]);
  for (const changes of [{ amount: 99.99 }, { type: 'INCOME' }, { date: '2026-01-18' }]) assert.deepEqual(suggestRecurringMatches([{ ...rows[0], ...changes }], bills), [[]]);
});

test('importar e conciliar quita vencimento com um débito; repetir não duplica', async () => {
  const { h, imports } = await setup();
  await Promise.all([imports.importStatement('test', text, options), imports.importStatement('test', text, options)]);
  assert.equal(h.all('accounts')[0].balance, 900);
  assert.equal(h.all('transactions').length, 1);
  assert.equal(h.all('transactions')[0].kind, 'RECURRING_PAYMENT');
  assert.equal(h.all('subscriptions')[0].payments[choice.dueDate].transactionId, h.all('transactions')[0].id);
  const dashboard = calculateDashboard({ accounts: h.all('accounts'), transactions: h.all('transactions'), subscriptions: h.all('subscriptions'), cards: [], invoices: [] }, new Date(2026, 0, 15));
  assert.equal(dashboard.lighthouse.value, 900);
  assert.equal(dashboard.lighthouse.total_expenses, 100);
});

test('pagamento manual anterior é aproveitado na importação sem novo débito', async () => {
  const { h, imports, subs } = await setup();
  await subs.payRecurringBill('test', 'internet', choice.dueDate, '2026-01-12', 'manual');
  const result = await imports.importStatement('test', text, options);
  assert.equal(result.insertedCount, 0);
  assert.equal(result.balanceDelta, 0);
  assert.equal(h.all('accounts')[0].balance, 900);
  assert.equal(h.all('transactions').length, 1);
  assert.equal(h.all('importRows')[0].transactionId, h.all('transactions')[0].id);
  await imports.importStatement('test', text);
  assert.equal(h.all('accounts')[0].balance, 900);
});

test('extrato já importado pode ser vinculado e desvinculado sem alterar saldo; exclusão estorna', async () => {
  const { h, imports, reconcile, txns } = await setup();
  await imports.importStatement('test', text);
  const id = h.all('transactions')[0].id;
  await Promise.all([reconcile.reconcileTransaction('test', id, 'internet', choice.dueDate), reconcile.reconcileTransaction('test', id, 'internet', choice.dueDate)]);
  assert.equal(h.all('accounts')[0].balance, 900);
  await reconcile.undoReconciliation('test', id);
  await reconcile.undoReconciliation('test', id);
  assert.equal(h.all('accounts')[0].balance, 900);
  assert.deepEqual(h.all('subscriptions')[0].payments, {});
  await reconcile.reconcileTransaction('test', id, 'internet', choice.dueDate);
  await txns.deleteTransaction('test', 'txn_' + id);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.deepEqual(h.all('subscriptions')[0].payments, {});
  await imports.importStatement('test', text);
  assert.equal(h.all('transactions').length, 0); // marcador preservado após exclusão
});

test('reimportação permite conciliar um lançamento existente sem repetir o débito', async () => {
  const { h, imports } = await setup();
  await imports.importStatement('test', text);
  await imports.importStatement('test', text, options);
  assert.equal(h.all('accounts')[0].balance, 900);
  assert.equal(h.all('transactions').length, 1);
  assert.ok(h.all('subscriptions')[0].payments[choice.dueDate]);
});

test('duas contas não podem usar o mesmo lançamento; dois lançamentos não podem quitar o mesmo vencimento', async () => {
  const { h, imports, reconcile } = await setup();
  h.seed('subscriptions', 'other', bill);
  await imports.importStatement('test', text);
  const id = h.all('transactions')[0].id;
  const results = await Promise.allSettled(['internet', 'other'].map(sub => reconcile.reconcileTransaction('test', id, sub, choice.dueDate)));
  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(h.all('accounts')[0].balance, 900);
  const remaining = h.all('subscriptions').find(sub => !sub.payments[choice.dueDate]).id;
  await imports.importStatement('test', '12/01/2026;Outro pagamento;-100,00\n13/01/2026;Terceiro pagamento;-100,00');
  const ids = h.all('transactions').filter(txn => txn.kind === 'REGULAR').map(txn => txn.id);
  const attempts = await Promise.allSettled(ids.map(txn => reconcile.reconcileTransaction('test', txn, remaining, choice.dueDate)));
  assert.equal(attempts.filter(item => item.status === 'fulfilled').length, 1);
});

test('falha de commit não deixa importação, vínculo ou saldo parcial', async () => {
  const { h, imports } = await setup();
  h.failNextCommit();
  await assert.rejects(imports.importStatement('test', text, options), /Injected/);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(h.all('transactions').length, 0);
  assert.equal(h.all('importRows').length, 0);
  assert.deepEqual(h.all('subscriptions')[0].payments, {});
});

test('seleções inválidas, valor divergente, outra conta e cancelamento são rejeitados antes do débito', async () => {
  const { h, imports } = await setup();
  await assert.rejects(imports.importStatement('test', text, { ...options, accountType: 'VR' }), /conta corrente/);
  await assert.rejects(imports.importStatement('test', text.replace('100,00', '99,99'), options), /não corresponde/);
  await assert.rejects(imports.importStatement('test', text, { reconciliations: [choice, choice] }), /inválida/);
  await assert.rejects(imports.importStatement('test', text + '\n13/01/2026;Outra;-100,00', { reconciliations: [choice, { ...choice, rowIndex: 1 }] }), /duas linhas/);
  h.seed('subscriptions', 'internet', { ...bill, isActive: false, cancelledOn: '2026-01-01' });
  await assert.rejects(imports.importStatement('test', text, options), /não corresponde/);
  assert.equal(h.all('accounts')[0].balance, 1000);
});

test('pagamento duplicado anterior exige revisão em vez de fundir registros silenciosamente', async () => {
  const { h, imports, subs } = await setup();
  await imports.importStatement('test', text);
  await subs.payRecurringBill('test', 'internet', choice.dueDate, '2026-01-12');
  await assert.rejects(imports.importStatement('test', text, options), /pagamentos diferentes/);
  assert.equal(h.all('accounts')[0].balance, 800);
  assert.equal(h.all('transactions').length, 2);
});

test('pagamento confirmado após a prévia é aproveitado com revalidação; várias competências preservam seus vínculos', async () => {
  const { h, imports, subs } = await setup();
  const rows = text + '\n12/02/2026;Internet;-100,00';
  await subs.payRecurringBill('test', 'internet', choice.dueDate, '2026-01-12');
  await imports.importStatement('test', rows, { reconciliations: [choice, { ...choice, rowIndex: 1, dueDate: '2026-02-10' }] });
  assert.equal(h.all('accounts')[0].balance, 800);
  assert.equal(Object.keys(h.all('subscriptions')[0].payments).length, 2);
  assert.equal(h.all('transactions').length, 2);
});

test('falha ao vincular mantém o lançamento importado sem vínculo e preserva saldo', async () => {
  const { h, imports, reconcile } = await setup();
  await imports.importStatement('test', text);
  h.failNextCommit();
  await assert.rejects(reconcile.reconcileTransaction('test', h.all('transactions')[0].id, 'internet', choice.dueDate), /Injected/);
  assert.equal(h.all('transactions')[0].kind, 'REGULAR');
  assert.deepEqual(h.all('subscriptions')[0].payments, {});
  assert.equal(h.all('accounts')[0].balance, 900);
});

test('OFX aproveita pagamento manual e mantém o marcador bancário na reimportação', async () => {
  const { h, imports, subs } = await setup();
  await subs.payRecurringBill('test', 'internet', choice.dueDate, '2026-01-12');
  const ofx = '<OFX><STMTRS><CURDEF>BRL<BANKACCTFROM><BANKID>000<ACCTID>123<ACCTTYPE>CHECKING</BANKACCTFROM><BANKTRANLIST><STMTTRN><DTPOSTED>20260112<TRNAMT>-100.00<FITID>internet-1<MEMO>Internet</STMTTRN></BANKTRANLIST></STMTRS></OFX>';
  await imports.importStatement('test', ofx, { ...options, format: 'ofx' });
  await imports.importStatement('test', ofx, { format: 'ofx' });
  assert.equal(h.all('accounts')[0].balance, 900);
  assert.equal(h.all('transactions').length, 1);
  assert.equal(h.all('importRows').length, 1);
});

test('sugere pagamento tardio pela data efetiva e rejeita mais de dez vínculos', async () => {
  const paidBill = { ...bill, id: 'internet', payments: { '2026-01-10': { transactionId: 'late', amount: 100, paidDate: '2026-03-01' } } };
  const suggestions = suggestRecurringMatches([{ date: '2026-03-02', type: 'EXPENSE', amount: 100, description: 'Internet' }], [paidBill]);
  assert.equal(suggestions[0][0].dueDate, '2026-01-10');
  const { imports, h } = await setup();
  await assert.rejects(imports.importStatement('test', text, { reconciliations: Array(11).fill(choice) }), /até 10/);
  assert.equal(h.all('accounts')[0].balance, 1000);
});
