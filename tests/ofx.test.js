import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOFX } from '../src/utils/ofx.js';
import { harness } from './firestoreHarness.js';

const row = (id, amount = '-25.50', date = '20260901000000[-3:BRT]') => `<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>${date}<TRNAMT>${amount}<FITID>${id}<MEMO>Loja &amp; Cia</STMTTRN>`;
const file = (rows, account = '123') => `OFXHEADER:100\n<OFX><STMTRS><CURDEF>BRL<BANKACCTFROM><BANKID>0260<ACCTID>${account}</BANKACCTFROM><BANKTRANLIST>${rows}</BANKTRANLIST></STMTRS></OFX>`;

test('OFX lê SGML e XML, preserva data local e centavos e rejeita extratos inválidos', () => {
  const parsed = parseOFX(file(row('a') + row('b', '100.00')));
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.total, 74.5);
  assert.equal(parsed.rows[0].date, '2026-09-01');
  assert.equal(parsed.rows[0].description, 'Loja & Cia');
  const xml = file('<STMTTRN><DTPOSTED>20260901</DTPOSTED><TRNAMT>-1.23</TRNAMT><FITID>x</FITID><NAME>Mercado</NAME></STMTTRN>');
  assert.equal(parseOFX(xml).rows[0].amount, 1.23);
  for (const bad of [file(row('a') + row('a')), file(row('a', 'NaN')), file(row('a', '-1', '20260230')), file(row('a')).replace('BRL', 'USD'), file(row('a')).replace('</OFX>', ''), file(row('a')).replace('<FITID>a', '<FITID>')]) {
    assert.ok(parseOFX(bad).errors.length);
  }
});

test('OFX é atômico, deduplica arquivos sobrepostos por conta e detecta alteração de FITID', async () => {
  const h = await harness(), service = await h.service('importService');
  h.seed('accounts', 'general', { type: 'GENERAL', name: 'Conta', balance: 100 });
  h.failNextCommit();
  await assert.rejects(service.importStatement('test', file(row('a')), 'OFX'), /Injected/);
  assert.equal(h.all('accounts')[0].balance, 100);
  await Promise.all([service.importStatement('test', file(row('a')), 'OFX'), service.importStatement('test', file(row('a')), 'OFX')]);
  await service.importStatement('test', file(row('a') + row('b', '100')), 'OFX');
  assert.equal(h.all('transactions').length, 2);
  assert.equal(h.all('accounts')[0].balance, 174.5);
  await assert.rejects(service.importStatement('test', file(row('a', '-30')), 'OFX'), /dados diferentes/);
  await service.importStatement('test', file(row('a'), '456'), 'OFX');
  assert.equal(h.all('transactions').length, 3);
  assert.equal(h.all('accounts')[0].balance, 149);
});
