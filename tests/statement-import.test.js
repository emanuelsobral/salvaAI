import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOFX } from '../src/utils/ofx.js';
import { parseStatement, readStatementFile } from '../src/utils/statement.js';
import { harness } from './firestoreHarness.js';

function transaction({ id = 'txn-1', amount = '-25.50', date = '20261009120000[-3:BRT]', memo = 'Mercado &amp; Cia' } = {}, xml = false) {
  const f = (name, value) => `<${name}>${value}${xml ? `</${name}>` : '\n'}`;
  return '<STMTTRN>' + f('TRNTYPE', 'DEBIT') + f('DTPOSTED', date) + f('TRNAMT', amount) + f('FITID', id) + f('MEMO', memo) + '</STMTTRN>';
}
function statement(rows = [transaction()], account = '12345', xml = false) {
  const f = (name, value) => `<${name}>${value}${xml ? `</${name}>` : '\n'}`;
  return (xml ? '<?xml version="1.0" encoding="UTF-8"?>' : 'OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\nCHARSET:1252\n\n') +
    '<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS>' + f('CURDEF', 'BRL') + '<BANKACCTFROM>' + f('BANKID', '000') + f('ACCTID', account) + f('ACCTTYPE', 'CHECKING') + '</BANKACCTFROM><BANKTRANLIST>' + rows.join('') + '</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>';
}

test('OFX bancário XML e SGML preserva data local, sinal, centavos e identificadores', () => {
  for (const xml of [false, true]) {
    const result = parseOFX(statement([transaction({}, xml), transaction({ id: 'txn-2', amount: '100.01' }, xml)], '12345', xml));
    assert.deepEqual(result.errors, []);
    assert.equal(result.total, 74.51);
    assert.equal(result.rows[0].date, '2026-10-09');
    assert.equal(result.rows[0].description, 'Mercado & Cia');
    assert.equal(result.rows[0].fitId, 'txn-1');
    assert.equal(result.rows[0].type, 'EXPENSE');
    assert.equal(result.rows[1].type, 'INCOME');
    assert.equal(result.source.label, 'Conta de origem com final 2345');
  }
});

test('OFX rejeita formatos ambíguos e não suportados antes de gravar', () => {
  const source = statement();
  const bad = [
    statement([transaction({ date: '20260230120000' })]),
    statement([transaction({ amount: '0' })]), statement([transaction({ amount: '-2.555' })]),
    statement([transaction({ id: '' })]), source.replace('<CURDEF>BRL', '<CURDEF>USD'),
    source.replace('<BANKACCTFROM>', '<CCSTMTRS></CCSTMTRS><BANKACCTFROM>'),
    source.replace('<STMTTRN>', '<STMTTRN><CORRECTFITID>old\n'),
    source.replace('</STMTTRN>', ''), source.replace('</OFX>', ''),
    source.replace('<BANKACCTFROM>', '<BANKACCTFROM></BANKACCTFROM><BANKACCTFROM>'),
    '<!DOCTYPE OFX [<!ENTITY x SYSTEM "file:///private">]>' + source,
    statement(Array.from({length:201}, (_, index) => transaction({ id: String(index) }))),
    statement([transaction(), transaction({ amount: '50' })]),
    statement([]),
  ];
  for (const input of bad) assert.ok(parseOFX(input).errors.length, input.slice(0, 100));
  assert.ok(parseStatement('data', 'pdf').errors.length);
});

test('upload aceita UTF-8 e Windows-1252 e recusa extensão, tamanho e bytes nulos', async () => {
  const file = (bytes, name = 'extrato.csv') => ({ name, size: bytes.byteLength, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) });
  const utf8 = new TextEncoder().encode('09/10/2026;Café;-10,50');
  assert.match((await readStatementFile(file(utf8))).text, /Café/);
  const windows = Uint8Array.from([...Buffer.from('09/10/2026;Caf'), 0xe9, ...Buffer.from(';-10,50')]);
  assert.match((await readStatementFile(file(windows))).text, /Café/);
  await assert.rejects(readStatementFile(file(utf8, 'x.txt')), /csv, .ofx ou .pdf/);
  await assert.rejects(readStatementFile(file(new Uint8Array())), /não vazio/);
  await assert.rejects(readStatementFile(file(new Uint8Array(1000001))), /1 MB/);
  await assert.rejects(readStatementFile(file(Uint8Array.from([0, 1]))), /Codificação/);
});

test('OFX importação atômica, duplicatas e concorrência não repetem efeito no saldo', async () => {
  const h = await harness(), service = await h.service('importService');
  h.seed('accounts', 'general', { type: 'GENERAL', name: 'Conta', balance: 100 });
  const input = statement([transaction(), transaction()]);
  h.failNextCommit();
  await assert.rejects(service.importStatement('test', input, { format: 'ofx' }), /Injected/);
  assert.equal(h.all('accounts')[0].balance, 100);
  assert.equal(h.all('importRows').length, 0);
  await Promise.all([service.importStatement('test', input, { format: 'ofx' }), service.importStatement('test', input, { format: 'ofx' })]);
  assert.equal(h.all('accounts')[0].balance, 74.5);
  assert.equal(h.all('transactions').length, 1);
  const overlap = statement([transaction(), transaction({ id: 'txn-2', amount: '100' })]);
  const result = await service.importStatement('test', overlap, { format: 'ofx' });
  assert.equal(result.insertedCount, 1);
  assert.equal(result.skippedCount, 1);
  assert.equal(h.all('accounts')[0].balance, 174.5);
  await assert.rejects(service.importStatement('test', statement([transaction({ amount: '-50' })]), { format: 'ofx' }), /já importada mudou/);
  assert.equal(h.all('accounts')[0].balance, 174.5);
});

test('deduplicação separa contas de origem OFX e destinos; CSV antigo continua reconhecido', async () => {
  const h = await harness(), service = await h.service('importService');
  h.seed('accounts', 'general', { type: 'GENERAL', name: 'Conta', balance: 100 });
  h.seed('accounts', 'vr', { type: 'VR', name: 'Refeição', balance: 100 });
  for (const origin of ['12345', '54321']) await service.importStatement('test', statement([transaction()], origin), { format: 'ofx' });
  await service.importStatement('test', statement(), { format: 'ofx', accountType: 'VR' });
  assert.equal(h.all('accounts').find(a => a.id === 'general').balance, 49);
  assert.equal(h.all('accounts').find(a => a.id === 'vr').balance, 74.5);
  assert.equal(h.all('transactions').filter(t => t.accountType === 'VR').length, 1);
  const canonical = JSON.stringify(['2026-10-09', 'Legado', 'EXPENSE', 10]) + ':0';
  const marker = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))).toString('hex');
  h.seed('importRows', marker, { transactionId: 'old' });
  const result = await service.importCSV('test', '09/10/2026;Legado;-10');
  assert.equal(result.insertedCount, 0);
  await service.importStatement('test', '09/10/2026;Legado;-10', { accountType: 'VR' });
  assert.equal(h.all('accounts').find(a => a.id === 'vr').balance, 64.5);
});

test('arquivo inválido e destino inválido não alteram contas', async () => {
  const h = await harness(), service = await h.service('importService');
  await assert.rejects(service.importStatement('test', statement().replace('<CURDEF>BRL', '<CURDEF>USD'), { format: 'ofx' }), /BRL/);
  await assert.rejects(service.importStatement('test', '09/10/2026;Loja;-10', { accountType: 'CAIXINHA' }), /conta de destino/);
  assert.equal(h.all('accounts').length, 0);
});
