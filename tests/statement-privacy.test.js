import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeStatementDescription } from '../src/utils/statementPrivacy.js';

test('extratos preservam contraparte e removem documentos e dados bancários', () => {
  const raw = 'Transferência recebida pelo Pix - MARIA SILVA - •••.123.456-•• - BCO EXEMPLO (0001) Agência: 123 Conta: 99999-0';
  assert.equal(sanitizeStatementDescription(raw), 'MARIA SILVA');
  assert.equal(
    sanitizeStatementDescription('Transferência enviada pelo Pix - LOJA LTDA - 12.345.678/0001-90 - BANCO EXEMPLO Agência: 123 Conta: 456'),
    'LOJA LTDA',
  );
  assert.equal(sanitizeStatementDescription('Compra no débito - Mercado'), 'Compra no débito - Mercado');
  assert.equal(sanitizeStatementDescription('CPF 123.456.789-00'), 'Movimentação importada');
});
