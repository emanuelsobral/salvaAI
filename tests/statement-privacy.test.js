import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeStatementDescription } from '../src/utils/statementPrivacy.js';
import { inferCategory } from '../src/utils/categories.js';
import { harness } from './firestoreHarness.js';

test('extratos preservam contraparte e removem documentos e dados bancários', () => {
  const raw = 'Transferência recebida pelo Pix - MARIA SILVA - •••.123.456-•• - BCO EXEMPLO (0001) Agência: 123 Conta: 99999-0';
  assert.equal(sanitizeStatementDescription(raw), 'MARIA SILVA');
  assert.equal(sanitizeStatementDescription('Transferência enviada pelo Pix - LOJA LTDA - 12.345.678/0001-90 - BANCO EXEMPLO Agência: 123 Conta: 456'), 'LOJA LTDA');
  assert.equal(sanitizeStatementDescription('Compra no débito - Mercado'), 'Compra no débito - Mercado');
  assert.equal(inferCategory('Aplicação RDB'), 'INVESTIMENTO');
});

test('importação mantém Pix separado do nome e não persiste dados bancários em descrições', async () => {
  const h = await harness(), service = await h.service('importService');
  const raw = 'Transferência recebida pelo Pix - MARIA SILVA - •••.123.456-•• - BCO EXEMPLO (0001) Agência: 123 Conta: 99999-0';
  await service.importCSV('test', 'Data,Valor,Identificador,Descrição\n01/09/2026,100,id,' + raw);
  const txn = h.all('transactions')[0];
  assert.equal(txn.description, 'MARIA SILVA');
  assert.equal(txn.originalDescription, 'MARIA SILVA');
  assert.equal(txn.paymentMethod, 'PIX');
  assert.doesNotMatch(JSON.stringify([...h.all('transactions'), ...h.all('importRows')]), /99999|Agência|123.456/);
  await service.importCSV('test', 'Data,Valor,Identificador,Descrição\n01/09/2026,100,id,' + raw);
  assert.equal(h.all('transactions').length, 1);
});
