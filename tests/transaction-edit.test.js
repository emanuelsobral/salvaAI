import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './firestoreHarness.js';
import { cleanDescription, inferPaymentMethod } from '../src/utils/transactionDetails.js';

test('edição ajusta só a diferença, preserva origem e bloqueia versões antigas e operações vinculadas', async () => {
  const h = await harness(), service = await h.service('transactionService');
  h.seed('accounts', 'general', { type: 'GENERAL', name: 'Conta', balance: 80 });
  h.seed('transactions', 'expense', { accountId: 'general', accountType: 'GENERAL', type: 'EXPENSE', status: 'COMPLETED', amount: 20, description: '[MORADIA] Transferência enviada pelo Pix', category: 'MORADIA' });
  const payload = { description: 'Aluguel', amount: 30, category: 'MORADIA', paymentMethod: 'PIX', revision: 0 };
  h.failNextCommit();
  await assert.rejects(service.editTransaction('test', 'txn_expense', payload), /Injected/);
  assert.equal(h.all('accounts')[0].balance, 80);
  await service.editTransaction('test', 'txn_expense', payload);
  assert.equal(h.all('accounts')[0].balance, 70);
  assert.equal(h.all('transactions')[0].originalDescription, '[MORADIA] Transferência enviada pelo Pix');
  await assert.rejects(service.editTransaction('test', 'txn_expense', payload), /alterada/);
  await service.deleteTransaction('test', 'txn_expense');
  assert.equal(h.all('accounts')[0].balance, 100);
  h.seed('transactions', 'linked', { kind: 'TRANSFER', amount: 10 });
  await assert.rejects(service.editTransaction('test', 'txn_linked', payload), /vinculada/);
  h.seed('cardTransactions', 'paid', { status: 'PAID', amount: 10 });
  await assert.rejects(service.editTransaction('test', 'ctxn_paid', payload), /parcela paga/);
});

test('meio de pagamento reconhece padrões de extrato sem confundir Pix com categoria de renda', () => {
  assert.equal(inferPaymentMethod('Transferência recebida pelo Pix - Pessoa'), 'PIX');
  assert.equal(inferPaymentMethod('Compra no débito via NuPay - Loja'), 'DEBIT_CARD');
  assert.equal(inferPaymentMethod('Compra no débito - Loja'), 'DEBIT_CARD');
  assert.equal(inferPaymentMethod('Pagamento de boleto'), 'BOLETO');
  assert.equal(inferPaymentMethod('Transferência TED'), 'OTHER');
  assert.equal(inferPaymentMethod('Estabelecimento desconhecido'), 'OTHER');
  assert.equal(cleanDescription('[MORADIA] Aluguel'), 'Aluguel');
});
