import { harness } from '../../tests/firestoreHarness.js';
import { calculateDashboard } from '../../src/utils/dashboard.js';
const output = {};
{
  const h = await harness(), imports = await h.service('importService');
  const csv = '01/09/2026;Mercado;-25';
  const ofx = '<OFX><STMTRS><CURDEF>BRL<BANKID>1<ACCTID>2<BANKTRANLIST><STMTTRN><DTPOSTED>20260901<TRNAMT>-25<FITID>abc<MEMO>Mercado</STMTTRN></BANKTRANLIST></STMTRS></OFX>';
  await Promise.all([imports.importStatement('test', csv, 'CSV'), imports.importStatement('test', ofx, 'OFX')]);
  output.concurrentCrossFormat = { count: h.all('transactions').length, balance: h.all('accounts')[0].balance, expectedCount: 1, expectedBalance: -25 };
}
{
  const h = await harness(), imports = await h.service('importService');
  const csv = '01/09/2026;Mercado;-25';
  await imports.importStatement('test', csv, 'CSV');
  const result = await imports.importStatement('test', csv, 'CSV', { selectedIndices: [0], keepDuplicates: [0], batchId: 'intentional-new' });
  output.explicitKeepDuplicate = { inserted: result.insertedCount, skipped: result.skippedCount };
}
{
  const data = calculateDashboard({ accounts: [{ type: 'GENERAL', balance: 1000 }], transactions: [{ type: 'EXPENSE', kind: 'REGULAR', accountType: 'GENERAL', status: 'PENDING', amount: 100, transactionDate: '2026-09-13', description: 'Conta vencida' }, { type: 'EXPENSE', kind: 'REGULAR', accountType: 'GENERAL', status: 'PENDING', amount: 50, transactionDate: '2026-09-17', description: 'Conta em dois dias' }], cards: [], subscriptions: [], invoices: [] }, new Date(2026, 8, 15, 12));
  output.scheduledNotifications = { count: data.notifications.length, available: data.lighthouse.value };
}
{
  const data = calculateDashboard({ accounts: [{ type: 'GENERAL', balance: 0 }], transactions: [{ id: 'payment', kind: 'REGULAR', type: 'EXPENSE', amount: 100, status: 'COMPLETED', description: 'Pagamento de fatura', transactionDate: '2026-09-01' }], cards: [{ id: 'card', amount: 100, purchaseDate: '2026-09-01', invoiceMonth: 9, invoiceYear: 2026, status: 'PAID' }], subscriptions: [], invoices: [] }, new Date(2026, 8, 15, 12));
  output.importedInvoiceDoubleCount = { expense: data.lighthouse.total_expenses, expectedExpense: 100 };
}
console.log(JSON.stringify(output, null, 2));
