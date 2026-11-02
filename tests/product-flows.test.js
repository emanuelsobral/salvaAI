import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './firestoreHarness.js';
import { calculateDashboard } from '../src/utils/dashboard.js';
import { summarizeHistory } from '../src/utils/history.js';
import { suggestCategory } from '../src/utils/categories.js';

test('importações CSV/OFX e lançamentos manuais coincidentes não repetem saldo', async () => {
  const h = await harness(), imports = await h.service('importService'), txns = await h.service('transactionService');
  await txns.createTransaction('test', { transaction_type: 'EXPENSE', amount: 25, date: '2026-09-01', source_account: 'GENERAL', category: 'ALIMENTACAO', description: 'Mercado', operation_id: 'manual' });
  const csv = '01/09/2026;Mercado;-25';
  await imports.importCSV('test', csv);
  const ofx = '<OFX><STMTRS><CURDEF>BRL<BANKID>1<ACCTID>2<BANKTRANLIST><STMTTRN><DTPOSTED>20260901<TRNAMT>-25<FITID>abc<MEMO>Mercado</STMTTRN></BANKTRANLIST></STMTRS></OFX>';
  await imports.importStatement('test', ofx, 'OFX');
  assert.equal(h.all('transactions').length, 1);
  assert.equal(h.all('accounts')[0].balance, -25);
});

test('revisão permite selecionar e corrigir sem perder identidade e memoriza categoria por pessoa/tipo', async () => {
  const h = await harness(), imports = await h.service('importService'), txns = await h.service('transactionService');
  const csv = '01/09/2026;Loja Azul;-25\n02/09/2026;Outra Loja;-30';
  await imports.importStatement('test', csv, 'CSV', { selectedIndices: [0], corrections: [{ description: 'Presente', category: 'LAZER' }] });
  const first = h.all('transactions')[0];
  assert.equal(first.description, 'Presente');
  await txns.editTransaction('test', 'txn_' + first.id, { amount: 25, description: 'Presente', category: 'ROUPAS', paymentMethod: 'OTHER', revision: 0, rememberCategory: true });
  const review = await imports.reviewStatement('test', [{ date: '2026-09-03', type: 'EXPENSE', amount: 20, description: 'Loja Azul' }]);
  assert.equal(review[0].category, 'ROUPAS');
  await imports.importCSV('test', csv);
  assert.equal(h.all('transactions').length, 2);
  assert.equal(h.all('accounts')[0].balance, -55);
  assert.equal(suggestCategory('Transferência recebida pelo Pix', 'INCOME'), 'OUTROS_ENTRADA');
});

test('agendamentos e recorrências não debitam antes da confirmação e cancelamento preserva ocorrências concluídas', async () => {
  const h = await harness(), txns = await h.service('transactionService'), schedules = await h.service('scheduleService');
  const payload = { transaction_type: 'EXPENSE', amount: 10, date: '2099-01-31', source_account: 'GENERAL', category: 'MORADIA', description: 'Aluguel', operation_id: 'monthly', recurrence_count: 3 };
  await txns.createTransaction('test', payload);
  await txns.createTransaction('test', payload);
  assert.equal(h.all('transactions').length, 3);
  assert.equal(h.all('accounts')[0].balance, 0);
  assert.deepEqual(h.all('transactions').map(row => row.transactionDate), ['2099-01-31', '2099-02-28', '2099-03-31']);
  const first = h.all('transactions')[0];
  await Promise.all([schedules.completeScheduled('test', 'txn_' + first.id), schedules.completeScheduled('test', 'txn_' + first.id)]);
  assert.equal(h.all('accounts')[0].balance, -10);
  await schedules.cancelRecurrence('test', first.recurrenceId);
  assert.equal(h.all('transactions').filter(row => row.status === 'COMPLETED').length, 1);
  assert.equal(h.all('transactions').filter(row => row.status === 'CANCELLED').length, 2);
  await assert.rejects(schedules.completeScheduled('test', 'txn_' + h.all('transactions')[1].id), /não pode/);
  await txns.deleteTransaction('test', 'txn_' + first.id);
  assert.equal(h.all('accounts')[0].balance, 0);
});

test('aplicações ficam fora de consumo e totais do histórico respeitam estado e transferências', () => {
  const now = new Date(2026, 8, 15, 12);
  const transactions = [{ type: 'EXPENSE', amount: 500, category: 'INVESTIMENTO', status: 'COMPLETED', transactionDate: '2026-09-01' }, { type: 'EXPENSE', amount: 100, category: 'MORADIA', status: 'COMPLETED', transactionDate: '2026-09-02' }];
  const dashboard = calculateDashboard({ accounts: [{ type: 'GENERAL', balance: 400 }], transactions, cards: [], invoices: [], subscriptions: [] }, now);
  assert.equal(dashboard.lighthouse.total_expenses, 100);
  assert.equal(dashboard.investments_this_month, 500);
  const totals = summarizeHistory([...transactions, { type: 'INCOME', amount: 1000, status: 'COMPLETED' }, { type: 'INCOME', amount: 999, status: 'PENDING' }, { type: 'EXPENSE', amount: 200, status: 'COMPLETED', kind: 'TRANSFER' }]);
  assert.deepEqual(totals, { income: 1000, expenses: 100, investments: 500, difference: 400 });
});
