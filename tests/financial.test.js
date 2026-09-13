import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './firestoreHarness.js';
import { splitInstallments, validDate, positiveMoney, addMoney, localDate } from '../src/utils/finance.js';

const payload = { transaction_type: 'EXPENSE', amount: 100, date: '2026-09-13', source_account: 'GENERAL', category: 'OUTROS', description: 'Mercado', operation_id: 'expense-1' };
const account = balance => ({ name: 'Conta Corrente', type: 'GENERAL', balance });

test('valores e datas inválidas são rejeitados; cálculo preserva centavos', () => {
  for (const value of [-1, 0, NaN, Infinity, 1.001, '100']) assert.throws(() => positiveMoney(value));
  assert.throws(() => validDate('2026-02-30'));
  assert.equal(validDate('2024-02-29'), '2024-02-29');
  assert.equal(addMoney(0.1, 0.2), 0.3);
  assert.deepEqual(splitInstallments(100, 3), [33.34, 33.33, 33.33]);
  assert.throws(() => splitInstallments(0.01, 2));
  assert.equal(localDate(new Date(2026, 8, 13, 23, 30)), '2026-09-13');
});

test('despesa negativa não grava nem cria conta', async () => {
  const h = await harness(), service = await h.service('transactionService');
  await assert.rejects(service.createTransaction('test', { ...payload, amount: -100 }), /positivo/);
  assert.equal(h.all('accounts').length, 0);
});

test('falha de commit não altera saldo nem histórico; repetição aplica uma vez', async () => {
  const h = await harness(), service = await h.service('transactionService');
  h.seed('accounts', 'general', account(1000));
  h.failNextCommit();
  await assert.rejects(service.createTransaction('test', payload), /Injected/);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(h.all('transactions').length, 0);
  await Promise.all([service.createTransaction('test', payload), service.createTransaction('test', payload)]);
  assert.equal(h.all('accounts')[0].balance, 900);
  assert.equal(h.all('transactions').length, 1);
  await assert.rejects(service.createTransaction('test', { ...payload, amount: 200 }), /outra operação/);
});

test('criação concorrente utiliza uma única conta e aplica ambas as operações', async () => {
  const h = await harness(), service = await h.service('transactionService');
  await Promise.all([service.createTransaction('test', payload), service.createTransaction('test', { ...payload, operation_id: 'expense-2' })]);
  assert.equal(h.all('accounts').length, 1);
  assert.equal(h.all('accounts')[0].balance, -200);
});

test('aportes concorrentes respeitam saldo; exclusão estorna os dois lados uma vez', async () => {
  const h = await harness(), goals = await h.service('goalService'), txns = await h.service('transactionService');
  h.seed('accounts', 'general', account(300));
  h.seed('accounts', 'goal', { type: 'CAIXINHA', name: 'Viagem', balance: 0, goalAmount: 1000 });
  const results = await Promise.allSettled([goals.depositToGoal('test', 'goal', 200, 'a'), goals.depositToGoal('test', 'goal', 200, 'b')]);
  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(h.all('accounts').find(item => item.id === 'general').balance, 100);
  const id = h.all('transactions').find(item => item.type === 'EXPENSE').id;
  await Promise.all([txns.deleteTransaction('test', 'txn_' + id), txns.deleteTransaction('test', 'txn_' + id)]);
  assert.equal(h.all('accounts').find(item => item.id === 'general').balance, 300);
  assert.equal(h.all('accounts').find(item => item.id === 'goal').balance, 0);
  assert.equal(h.all('transactions').length, 0);
});

test('transferência legada não pode ser excluída parcialmente', async () => {
  const h = await harness(), txns = await h.service('transactionService');
  h.seed('transactions', 'legacy', { type: 'EXPENSE', amount: 200, description: '[CAIXINHA] Transferência p/ Viagem' });
  await assert.rejects(txns.deleteTransaction('test', 'txn_legacy'), /antiga/);
  assert.equal(h.all('transactions').length, 1);
});

test('pagamentos concorrentes quitam parcela e assinatura só uma vez; estorno reabre ambas', async () => {
  const h = await harness(), cards = await h.service('cardService'), txns = await h.service('transactionService');
  h.seed('accounts', 'general', account(1000));
  h.seed('subscriptions', 'streaming', { name: 'Streaming', amount: 50, isActive: true, startMonth: '2026-09' });
  h.seed('cardTransactions', 'purchase', { amount: 100, status: 'PENDING', invoiceMonth: 9, invoiceYear: 2026 });
  await Promise.all([cards.payInvoice('test', 9, 2026), cards.payInvoice('test', 9, 2026)]);
  assert.equal(h.all('accounts')[0].balance, 850);
  assert.equal(h.all('transactions').length, 1);
  await assert.rejects(txns.deleteTransaction('test', 'ctxn_purchase'), /Estorne/);
  const payment = h.all('transactions')[0];
  await txns.deleteTransaction('test', 'txn_' + payment.id);
  assert.equal(h.all('accounts')[0].balance, 1000);
  assert.equal(h.all('cardTransactions')[0].status, 'PENDING');
  assert.deepEqual(h.all('invoices')[0].subscriptionPayments, {});
  await cards.payInvoice('test', 9, 2026);
  assert.equal(h.all('accounts')[0].balance, 850);
});

test('novas compras na mesma fatura não repetem cobrança da assinatura', async () => {
  const h = await harness(), cards = await h.service('cardService');
  h.seed('accounts', 'general', account(1000));
  h.seed('subscriptions', 'streaming', { name: 'Streaming', amount: 50, isActive: true });
  await cards.payInvoice('test', 9, 2026);
  h.seed('cardTransactions', 'later', { amount: 30, status: 'PENDING', invoiceMonth: 9, invoiceYear: 2026 });
  await cards.payInvoice('test', 9, 2026);
  await cards.payInvoice('test', 9, 2026);
  assert.equal(h.all('accounts')[0].balance, 920);
  await cards.payInvoice('test', 10, 2026);
  assert.equal(h.all('accounts')[0].balance, 870);
});

test('parcelamento é atômico, soma o total e atravessa o ano', async () => {
  const h = await harness(), cards = await h.service('cardService');
  const data = { amount_total: 100, installments: 3, purchase_date: '2026-12-13', category: 'OUTROS', description: 'Compra', current_month: true, operation_id: 'purchase-1' };
  await cards.createCardTransaction('test', data);
  await cards.createCardTransaction('test', data);
  const rows = h.all('cardTransactions');
  assert.deepEqual(rows.map(item => item.amount), [33.34, 33.33, 33.33]);
  assert.deepEqual(rows.map(item => [item.invoiceMonth, item.invoiceYear]), [[12, 2026], [1, 2027], [2, 2027]]);
});
