import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePdfPage, pdfLines, pdfDate, pdfMoneyOptions, pdfDraft, suggestPdfRows, reviewedPdfCSV } from '../src/utils/pdfStatement.js';
import { parseStatement, readStatementFile } from '../src/utils/statement.js';
import { harness } from './firestoreHarness.js';
import cases from './fixtures/pdf-statement-cases.json' with { type: 'json' };

const line = (text, id = '1-0') => ({ id, page: 1, text });
const reviewed = { include: true, date: '2026-10-16', description: 'Internet', amount: '100,00', direction: 'EXPENSE' };

for (const sample of cases) test(`PDF cenário fictício: ${sample.id}`, () => {
  const rows = suggestPdfRows([line(sample.text)]);
  assert.equal(rows.length, sample.suggest ? 1 : 0);
  if (!sample.suggest) return;
  assert.equal(rows[0].source, sample.text);
  for (const field of ['date', 'dateHint', 'amount', 'direction']) {
    if (Object.hasOwn(sample, field)) assert.equal(rows[0][field], sample[field], field);
  }
});

test('PDF mantém ano explícito, valida calendário e exige escolha quando há datas distintas', () => {
  assert.equal(pdfDate('29/02', '2024'), '2024-02-29');
  assert.equal(pdfDate('29/02', '2025'), '');
  assert.equal(pdfDate('2026-02-30'), '');
  const draft = pdfDraft(line('31/12 01/01 Compra -10,00'));
  assert.deepEqual(draft.dateCandidates, ['31/12', '01/01']);
  assert.equal(pdfDate(draft.dateHint, '2026'), '');
});

const cell = (str, x, y, width = 40) => ({ str, x, y, width, height: 10 });
const tableHeader = [cell('data', 100, 100), cell('descrição', 180, 100), cell('entradas R$', 340, 100), cell('saídas R$', 420, 100), cell('saldo R$', 500, 100)];
const signedHeader = [cell('data', 100, 100), cell('lançamentos', 180, 100), cell('valor (R$)', 340, 100), cell('saldo (R$)', 500, 100)];

const sectionHeader = (date = '02 SET 2026', label = 'Total de saídas', total = '-30,00', y = 100) => [
  ...(date ? [cell(date, 20, y, 65)] : []), cell(label, 120, y, 90), cell(total, 500, y)
];
const sectionRow = (amount = '30,00', y = 120) => [cell('Operação fictícia', 120, y, 100), cell('Pessoa de teste', 270, y, 100), cell(amount, 500, y)];

test('grupos datados preservam detalhes, excluem totais e alternam entrada/saída no mesmo dia', () => {
  const rows = suggestPdfRows(analyzePdfPage([
    ...sectionHeader(), ...sectionRow('10,00'), cell('Detalhe complementar', 270, 135, 100), ...sectionRow('20,00', 150),
    ...sectionHeader('', 'Total de entradas', '+40,00', 180), ...sectionRow('40,00', 200),
    cell('Atendimento 24h', 20, 230, 250)
  ], 1).lines);
  assert.deepEqual(rows.map(r => [r.date, r.amount, r.direction]), [
    ['2026-09-02', '10.00', 'EXPENSE'], ['2026-09-02', '20.00', 'EXPENSE'], ['2026-09-02', '40.00', 'INCOME']
  ]);
  assert.equal(rows[0].description, 'Operação fictícia Pessoa de teste Detalhe complementar');
  assert.match(rows[0].source, /02 SET 2026 Total de saídas/);
  assert.equal(rows[0].sectionBased, true); assert.equal(rows[0].sectionMismatch, false);
});

test('grupos convertem os doze meses portugueses sem usar o ano do computador', () => {
  for (const [index, month] of ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].entries()) {
    const rows = suggestPdfRows(analyzePdfPage([...sectionHeader(`02 ${month} 2024`), ...sectionRow()], 1).lines);
    assert.equal(rows[0].date, `2024-${String(index + 1).padStart(2, '0')}-02`);
  }
});

test('grupo inválido, sem ano ou com sinal contraditório não herda contexto anterior', () => {
  for (const date of ['31 FEV 2026', '02 XYZ 2026', '02 SET', '02 SET 2026 03 SET 2026']) {
    const rows = suggestPdfRows(analyzePdfPage([...sectionHeader(), ...sectionRow(),
      ...sectionHeader(date, 'Total de saídas', '-30,00', 160), ...sectionRow('30,00', 180)], 1).lines);
    assert.equal(rows.length, 1);
  }
  assert.equal(suggestPdfRows(analyzePdfPage([...sectionHeader('02 SET 2026', 'Total de saídas', '+30,00'), ...sectionRow()], 1).lines).length, 0);
});

test('soma divergente ou grupo cortado exige revisão do tipo de todas as linhas lidas', () => {
  const rows = suggestPdfRows(analyzePdfPage([...sectionHeader(), ...sectionRow('10,00')], 1).lines);
  assert.equal(rows.length, 1); assert.equal(rows[0].sectionMismatch, true); assert.equal(rows[0].direction, '');
  assert.throws(() => reviewedPdfCSV(rows), /entrada ou saída/);
});

test('sinais individuais contraditórios permanecem pendentes mesmo quando o total confere', () => {
  const rows = suggestPdfRows(analyzePdfPage([...sectionHeader(), ...sectionRow('+30,00')], 1).lines);
  assert.equal(rows[0].sectionMismatch, false); assert.equal(rows[0].direction, '');
});

test('grupo nunca transporta data de outra página nem de notas intermediárias', () => {
  const first = analyzePdfPage([...sectionHeader(), ...sectionRow()], 1);
  const second = analyzePdfPage([...sectionHeader(''), ...sectionRow()], 2, first.continuation);
  assert.equal(suggestPdfRows(second.lines).length, 0);
  const notes = analyzePdfPage([...sectionHeader(), ...sectionRow(), cell('Notas', 20, 150),
    ...sectionHeader('', 'Total de saídas', '-30,00', 180), ...sectionRow('30,00', 200)], 1);
  assert.equal(suggestPdfRows(notes.lines).length, 1);
});

test('grupo preserva operações repetidas e não usa dinheiro da descrição como valor', () => {
  const rows = suggestPdfRows(analyzePdfPage([...sectionHeader(),
    ...sectionRow('15,00'), cell('Referência 999,00', 270, 135, 100), ...sectionRow('15,00', 150)
  ], 1).lines);
  assert.equal(rows.length, 2); assert.equal(rows[0].amount, '15.00'); assert.equal(rows[1].amount, '15.00');
  assert.match(rows[0].description, /999,00/);
  assert.deepEqual(rows.map(r => r.direction), ['EXPENSE', 'EXPENSE']);
});

test('coluna única usa a data da coluna e preserva datas dentro da descrição', () => {
  const page = analyzePdfPage([...signedHeader,
    cell('16/10/2026', 100, 120), cell('Compra teste 15/10', 180, 120), cell('-12,50', 340, 120),
    cell('16/10/2026', 100, 140), cell('Devolução teste 15/10', 180, 140), cell('20,00', 340, 140),
    cell('16/10/2026', 100, 160), cell('SALDO DO DIA', 180, 160), cell('7,50', 500, 160)
  ], 1);
  const rows = suggestPdfRows(page.lines);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(r => [r.date, r.direction]), [['2026-10-16', 'EXPENSE'], ['2026-10-16', 'INCOME']]);
  assert.equal(rows[0].description, 'Compra teste 15/10');
  assert.equal(rows[0].signedValueColumn, true);
});

test('páginas seguintes reaproveitam apenas colunas quando começam com linha compatível', () => {
  const first = analyzePdfPage([...signedHeader, cell('16/10/2026', 100, 120), cell('Teste', 180, 120), cell('-12,50', 340, 120)], 1);
  const second = analyzePdfPage([cell('15/10/2026', 100, 10), cell('SALDO DO DIA', 180, 10), cell('20,00', 500, 10),
    cell('14/10/2026', 100, 30), cell('Outra 12/10', 180, 30), cell('10,00', 340, 30)], 2, first.continuation);
  const rows = suggestPdfRows(second.lines);
  assert.equal(rows.length, 1); assert.equal(rows[0].date, '2026-10-14'); assert.equal(rows[0].direction, 'INCOME');
  assert.equal(rows[0].inheritedDate, false);
});

test('notas ou mudança de alinhamento interrompem contexto de coluna única', () => {
  const first = analyzePdfPage(signedHeader, 1);
  const notes = analyzePdfPage([cell('Notas explicativas', 100, 10)], 2, first.continuation);
  assert.equal(notes.continuation, null); assert.equal(suggestPdfRows(notes.lines).length, 0);
  const shifted = analyzePdfPage([cell('15/10/2026', 100, 10), cell('Outro layout', 180, 10), cell('20,00', 420, 10)], 2, first.continuation);
  assert.equal(shifted.continuation, null);
  assert.equal(suggestPdfRows(shifted.lines)[0].columnBased, undefined);
  assert.equal(suggestPdfRows(shifted.lines)[0].direction, '');
});

test('coluna única ignora saldo e mantém valores grandes fora da descrição', () => {
  const rows = suggestPdfRows(analyzePdfPage([...signedHeader,
    cell('16/10/2026', 100, 120), cell('Teste', 180, 120), cell('-1.000.000,00', 290, 120, 90), cell('500,00', 500, 120)
  ], 1).lines);
  assert.equal(rows.length, 1); assert.equal(rows[0].description, 'Teste'); assert.equal(rows[0].amount, '1000000.00');
});

test('coluna única preserva sinais conflitantes para revisão e não elimina repetições legítimas', () => {
  const rows = suggestPdfRows(analyzePdfPage([...signedHeader,
    cell('16/10/2026', 100, 120), cell('Teste', 180, 120), cell('-10,00 C', 340, 120),
    cell('16/10/2026', 100, 140), cell('Teste', 180, 140), cell('-10,00 C', 340, 140)
  ], 1).lines);
  assert.equal(rows.length, 2); assert.equal(rows[0].direction, ''); assert.equal(rows[1].direction, '');
});

test('coluna única não herda dia de linha sem data', () => {
  const page = analyzePdfPage([...signedHeader,
    cell('16/10/2026', 100, 120), cell('Teste', 180, 120), cell('10,00', 340, 120),
    cell('Sem data', 180, 140), cell('10,00', 340, 140)
  ], 1);
  assert.equal(suggestPdfRows(page.lines).length, 1); assert.equal(page.continuation, null);
});

test('tabela com colunas explícitas mantém data do grupo e ignora legenda lateral/saldo', () => {
  const items = [...tableHeader, cell('01/10', 100, 120), cell('Saldo anterior', 180, 120), cell('500,00', 500, 120),
    cell('16/10', 100, 140), cell('Pagamento fictício', 180, 140), cell('25,00-', 420, 140),
    cell('P = legenda', 10, 155), cell('Crédito fictício', 180, 155), cell('50,00', 340, 155), cell('525,00', 500, 155),
    cell('Saldo final', 180, 170), cell('525,00', 500, 170)];
  const rows = suggestPdfRows(analyzePdfPage(items, 1).lines);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => [row.dateHint, row.date, row.amount, row.direction]), [
    ['16/10', '', '25.00', 'EXPENSE'], ['16/10', '', '50.00', 'INCOME']
  ]);
  assert.equal(rows[1].description, 'Crédito fictício');
  assert.equal(rows[1].inheritedDate, true);
  assert.equal(suggestPdfRows(analyzePdfPage([cell('Outra página', 180, 155), cell('50,00', 340, 155)], 2).lines).length, 0);
});

test('sinal explícito conflitante não é substituído pelo tipo da coluna', () => {
  for (const value of ['-10,00', '-10,00 C']) {
    const rows = suggestPdfRows(analyzePdfPage([...tableHeader, cell('16/10', 100, 140), cell('Rever', 180, 140), cell(value, 340, 140)], 1).lines);
    assert.equal(rows[0].direction, '');
  }
  assert.equal(pdfMoneyOptions('10,00-')[0].direction, 'EXPENSE');
  assert.equal(pdfMoneyOptions('10,00+')[0].direction, 'INCOME');
});

test('tabela exige todos os cabeçalhos e não herda data ambígua', () => {
  const ambiguous = [...tableHeader, cell('16/10 17/10', 100, 140, 75), cell('Rever', 180, 140), cell('25,00-', 420, 140),
    cell('Outra', 180, 155), cell('50,00', 340, 155)];
  const rows = suggestPdfRows(analyzePdfPage(ambiguous, 1).lines);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].dateHint, ''); assert.equal(rows[1].dateHint, '');
  const missing = [...tableHeader.filter(c => c.str !== 'saldo R$'), cell('Sem data', 180, 140), cell('25,00', 340, 140)];
  assert.equal(suggestPdfRows(analyzePdfPage(missing, 1).lines).length, 0);
});

test('texto com mapeamento de fonte ilegível não vira página legível nem sugestões', () => {
  const invalid = Array.from({ length: 80 }, (_, i) => cell(i % 2 ? '\u0013' : 'x', i * 5, 120));
  const page = analyzePdfPage(invalid, 1);
  assert.equal(page.unreadable, true); assert.deepEqual(page.lines, []);
  const notes = analyzePdfPage([cell('Notas explicativas', 10, 10), cell('Conta corrente: siglas utilizadas', 10, 30)], 3);
  assert.equal(notes.unreadable, false); assert.equal(suggestPdfRows(notes.lines).length, 0);
});

test('PDF agrupa itens pela posição e ordena colunas, preservando página e texto', () => {
  assert.deepEqual(pdfLines([{ str: '-10,00', x: 200, y: 21 }, { str: 'Loja', x: 80, y: 20 },
    { str: '16/10/2026', x: 10, y: 20 }, { str: 'Segunda linha', x: 10, y: 35 }], 2), [
    { id: '2-0', page: 2, text: '16/10/2026 Loja -10,00' }, { id: '2-1', page: 2, text: 'Segunda linha' }
  ]);
});

test('PDF não presume ano, sinal nem qual valor é movimento quando há saldo na linha', () => {
  assert.equal(pdfDate('16/10'), '');
  assert.equal(pdfDate('16/10', '2026'), '2026-10-16');
  assert.equal(pdfDate('16/10/2025', '2026'), '2025-10-16');
  assert.equal(pdfDate('16/10/26'), '');
  assert.equal(pdfDraft(line('16/10/26 Loja -10,00')).dateHint, '');
  assert.equal(pdfMoneyOptions('R$ 1.200,00')[0].direction, '');
  assert.deepEqual(pdfMoneyOptions('-100,00 +250,00 10,00 D 20,00 C').map(v => v.direction), ['EXPENSE', 'INCOME', 'EXPENSE', 'INCOME']);
  assert.equal(pdfMoneyOptions('-10,00 C')[0].direction, '');
  const ambiguous = pdfDraft(line('16/10/2026 Pix -100,00 2.000,00'));
  assert.equal(ambiguous.amount, ''); assert.equal(ambiguous.direction, ''); assert.equal(ambiguous.options.length, 2);
  const single = pdfDraft(line('16/10 Mercado -10,50'));
  assert.equal(single.date, ''); assert.equal(single.amount, '10.50'); assert.equal(single.direction, 'EXPENSE');
});

test('sugestões excluem totais/saldos e preservam fonte para revisão manual', () => {
  const lines = ['16/10/2026 Saldo anterior 900,00', '16/10/2026 Total -10,00', '16/10/2026 Mercado -10,00', 'Texto quebrado sem valor'].map(text => line(text));
  const rows = suggestPdfRows(lines);
  assert.equal(rows.length, 1); assert.equal(rows[0].source, lines[2].text);
  assert.equal(lines.length, 4); // source stays available for manual additions
  assert.deepEqual(suggestPdfRows([]), []); // scanned page never invents data
});

test('revisão PDF exige dados válidos e conserva centavos, aspas, quebras e sinal', () => {
  const text = reviewedPdfCSV([{ ...reviewed, description: 'Loja; "Centro"\nPix' },
    { ...reviewed, amount: '1200.01', direction: 'INCOME' }, { ...reviewed, include: false, amount: '' }]);
  const parsed = parseStatement(text, 'pdf');
  assert.deepEqual(parsed.errors, []); assert.equal(parsed.total, 1100.01);
  assert.equal(parsed.format, 'pdf'); assert.equal(parsed.rows[0].description, 'Loja; "Centro"\nPix');
  for (const changes of [{ direction: '' }, { date: '' }, { date: '2026-02-30' }, { amount: '0' },
    { amount: '-10' }, { amount: '1.200,00' }, { amount: '1.234' }, { description: '' }]) {
    assert.throws(() => reviewedPdfCSV([{ ...reviewed, ...changes }]));
  }
  assert.throws(() => reviewedPdfCSV([]), /1 a 200/);
  assert.throws(() => reviewedPdfCSV(Array(201).fill(reviewed)), /1 a 200/);
});

test('seleção PDF limita tamanho antes de carregar o leitor', async () => {
  assert.deepEqual(await readStatementFile({ name: 'EXTRATO.PDF', size: 100 }), { format: 'pdf' });
  for (const size of [0, 10000001]) await assert.rejects(readStatementFile({ name: 'a.pdf', size }), /10 MB/);
});

test('PDF revisado mantém atomicidade, deduplicação CSV/PDF, conciliação e estorno', async () => {
  const h = await harness(), imports = await h.service('importService'), reconcile = await h.service('reconciliationService');
  h.seed('accounts', 'general', { type: 'GENERAL', name: 'Conta', balance: 1000 });
  h.seed('subscriptions', 'internet', { name: 'Internet', amount: 100, billingMode: 'ACCOUNT', frequency: 'MONTHLY',
    startDate: '2026-10-16', endDate: '2026-10-16', dueDay: 16, isActive: true, payments: {} });
  const text = reviewedPdfCSV([reviewed]);
  h.failNextCommit();
  await assert.rejects(imports.importStatement('test', text, { format: 'pdf' }), /Injected/);
  assert.equal(h.all('accounts')[0].balance, 1000); assert.equal(h.all('importRows').length, 0);
  await Promise.all([imports.importStatement('test', text, { format: 'pdf' }), imports.importStatement('test', text, { format: 'pdf' })]);
  await imports.importStatement('test', text, { format: 'csv' });
  assert.equal(h.all('transactions').length, 1); assert.equal(h.all('accounts')[0].balance, 900);
  const txn = h.all('transactions')[0]; assert.equal(txn.importFormat, 'pdf');
  await reconcile.reconcileTransaction('test', txn.id, 'internet', reviewed.date);
  await reconcile.undoReconciliation('test', txn.id);
  await imports.importStatement('test', text, { format: 'pdf', reconciliations: [{ rowIndex: 0, subscriptionId: 'internet', dueDate: reviewed.date }] });
  assert.equal(h.all('accounts')[0].balance, 900);
  const txns = await h.service('transactionService');
  await txns.deleteTransaction('test', 'txn_' + txn.id);
  assert.equal(h.all('accounts')[0].balance, 1000); assert.deepEqual(h.all('subscriptions')[0].payments, {});
});
