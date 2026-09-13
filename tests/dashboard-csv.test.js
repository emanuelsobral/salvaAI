import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDashboard } from '../src/utils/dashboard.js';
import { parseCSV } from '../src/utils/csv.js';
import { harness } from './firestoreHarness.js';

const base = () => ({ accounts: [{ id: 'general', type: 'GENERAL', balance: 1000 }], transactions: [], cards: [], subscriptions: [], invoices: [] });
const now = new Date(2026, 8, 13, 12);

test('farol considera fatura, assinaturas e parcelas atrasadas', () => {
  const data = base();
  data.cards = [{ amount: 2000, status: 'PENDING', invoiceMonth: 9, invoiceYear: 2026, purchaseDate: '2026-09-01' }, { amount: 50, status: 'PENDING', invoiceMonth: 8, invoiceYear: 2026 }];
  data.subscriptions = [{ id: 'sub', amount: 10, isActive: true, name: 'Teste', dueDay: 10 }];
  const result = calculateDashboard(data, now);
  assert.equal(result.lighthouse.status, 'RED');
  assert.equal(result.lighthouse.value, -1060);
  assert.equal(result.projection_12m[0].v, -1060);
  assert.equal(result.projection_12m[0].fatura_prevista, 2010);
});

test('pagamento de cartão não duplica despesa e aporte não é receita/despesa', () => {
  const data = base();
  data.transactions = [
    { type: 'EXPENSE', status: 'COMPLETED', amount: 100, description: '[CARTAO] Fatura Paga 09/2026', transactionDate: '2026-09-12' },
    { type: 'EXPENSE', status: 'COMPLETED', amount: 200, kind: 'TRANSFER', transactionDate: '2026-09-12' },
    { type: 'INCOME', status: 'COMPLETED', amount: 200, kind: 'TRANSFER', transactionDate: '2026-09-12' }
  ];
  data.cards = [{ amount: 100, status: 'PAID', invoiceMonth: 9, invoiceYear: 2026, purchaseDate: '2026-09-01' }];
  const result = calculateDashboard(data, now);
  assert.equal(result.lighthouse.total_expenses, 100);
  assert.equal(result.lighthouse.total_income, 0);
  assert.equal(result.invoice_requires_reconciliation, true);
});

test('assinatura paga não reaparece na fatura ou projeção do mês e permanece nos gastos', () => {
  const data = base();
  data.accounts[0].balance = 950;
  data.subscriptions = [{ id: 'sub', amount: 50, isActive: true, name: 'Teste', dueDay: 10 }];
  data.invoices = [{ id: '2026-09', subscriptionPayments: { sub: 'payment' } }];
  data.transactions = [{ kind: 'INVOICE_PAYMENT', type: 'EXPENSE', status: 'COMPLETED', amount: 50, invoiceKey: '2026-09', subscriptionCharges: [{ amount: 50, category: 'ASSINATURAS' }] }];
  const result = calculateDashboard(data, now);
  assert.equal(result.curr_invoice, 0);
  assert.equal(result.projection_12m[0].v, 950);
  assert.equal(result.projection_12m[1].v, 900);
  assert.equal(result.lighthouse.total_expenses, 50);
});

test('CSV preserva centavos, aspas, tabulações e descrições com separadores', () => {
  for (const text of ['13/09/2026, Mercado, -25,50', '13/09/2026;Mercado;-25,50', '13/09/2026\tMercado\t-25,50']) {
    const parsed = parseCSV(text);
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.total, -25.5);
  }
  const parsed = parseCSV('Data;Descrição;Valor\n13/09/2026;"Loja; A ""Centro""";-1.500,20');
  assert.equal(parsed.rows[0].description, 'Loja; A "Centro"');
  assert.equal(parsed.total, -1500.2);
  for (const bad of ['30/02/2026;Loja;-10', '13/09/2026;Loja;10lixo', '13/09/2026;Loja;0', '13/09/2026;"Loja;-10']) assert.ok(parseCSV(bad).errors.length > 0);
});

test('importação é atômica e repetição/arquivo sobreposto não duplica registros', async () => {
  const h = await harness(), service = await h.service('importService');
  h.seed('accounts', 'general', { type: 'GENERAL', name: 'Conta', balance: 100 });
  h.failNextCommit();
  const first = '13/09/2026;Mercado;-25,50';
  await assert.rejects(service.importCSV('test', first), /Injected/);
  assert.equal(h.all('accounts')[0].balance, 100);
  assert.equal(h.all('importRows').length, 0);
  await Promise.all([service.importCSV('test', first), service.importCSV('test', first)]);
  assert.equal(h.all('accounts')[0].balance, 74.5);
  await service.importCSV('test', first + '\n14/09/2026;Salário;100');
  assert.equal(h.all('transactions').length, 2);
  assert.equal(h.all('accounts')[0].balance, 174.5);
  await assert.rejects(service.importCSV('test', '30/02/2026;Loja;100'), /Data inválida/);
  assert.equal(h.all('accounts')[0].balance, 174.5);
});
