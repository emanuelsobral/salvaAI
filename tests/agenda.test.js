import test from 'node:test';
import assert from 'node:assert/strict';
import { agendaPeriod, agendaSelection, buildAgenda, moveAgendaPeriod } from '../src/utils/agenda.js';

const sub = { id: 'rent', name: 'Aluguel', billingMode: 'ACCOUNT', amount: 100, isActive: true, frequency: 'MONTHLY', startDate: '2026-01-31', endDate: null, payments: {} };

test('agenda mensal respeita fim de mês, ano bissexto e regra do dia 31', () => {
  assert.deepEqual(agendaPeriod('2028-02-15', 'mes'), { from: '2028-02-01', to: '2028-02-29' });
  assert.equal(buildAgenda([sub], '2026-02-10', 'mes', '2026-02-10').rows[0].dueDate, '2026-02-28');
  assert.equal(moveAgendaPeriod('2026-01-31', 'mes', 1), '2026-02-01');
  assert.equal(moveAgendaPeriod('2026-01-01', 'mes', -1), '2025-12-01');
});

test('semana começa na segunda e atravessa mês e ano sem cortar vencimentos', () => {
  assert.deepEqual(agendaPeriod('2027-01-01', 'semana'), { from: '2026-12-28', to: '2027-01-03' });
  assert.deepEqual(agendaPeriod('2027-01-03', 'semana'), agendaPeriod('2027-01-01', 'semana'));
  assert.equal(moveAgendaPeriod('2027-01-01', 'semana', 1), '2027-01-04');
  const result = buildAgenda([{ ...sub, frequency: 'WEEKLY', startDate: '2026-12-31' }], '2027-01-01', 'semana', '2027-01-01');
  assert.deepEqual(result.rows.map(row => row.dueDate), ['2026-12-31']);
});

test('agenda classifica atrasadas, hoje, próximas e pagas sem somar pagamentos ao pendente', () => {
  const recurring = { ...sub, frequency: 'WEEKLY', startDate: '2026-10-01', amount: 10.1, payments: { '2026-10-01': { transactionId: 't', amount: 9.9, paidDate: '2026-09-30' } } };
  const result = buildAgenda([recurring], '2026-10-15', 'mes', '2026-10-15');
  assert.deepEqual(result.rows.map(row => row.agendaStatus), ['PAID', 'OVERDUE', 'TODAY', 'UPCOMING', 'UPCOMING']);
  assert.deepEqual(result.counts, { ALL: 5, OVERDUE: 1, TODAY: 1, UPCOMING: 2, PAID: 1 });
  assert.equal(result.pending, 40.4);
  assert.equal(result.paid, 9.9);
});

test('reajustes e pagamentos do contrato são reutilizados sem gerar nova cobrança', () => {
  const contract = { ...sub, contractId: 'lease', endDate: '2026-03-31', revisions: [{ effectiveFrom: '2026-02-01', startDate: sub.startDate, endDate: '2026-03-31', frequency: 'MONTHLY', amount: 110 }] };
  const original = structuredClone(contract);
  const feb = buildAgenda([contract], '2026-02-10', 'mes', '2026-02-10');
  assert.equal(feb.rows.length, 1);
  assert.equal(feb.pending, 110);
  assert.equal(feb.rows[0].contractId, 'lease');
  assert.deepEqual(contract, original);
});

test('encerramento cancela futuras sem pagamento e mantém antecipações e pendências', () => {
  const closed = { ...sub, isActive: false, cancelledOn: '2026-02-15', payments: { '2026-03-31': { amount: 100, paidDate: '2026-02-01', transactionId: 't' } } };
  assert.equal(buildAgenda([closed], '2026-01-01', 'mes', '2026-02-15').pending, 100);
  assert.equal(buildAgenda([closed], '2026-02-01', 'mes', '2026-02-15').rows.length, 0);
  assert.equal(buildAgenda([closed], '2026-03-01', 'mes', '2026-02-15').rows[0].agendaStatus, 'PAID');
});

test('fatura antiga e vencimentos fora do período não entram nos totais', () => {
  const legacy = { id: 'old', name: 'Cartão', amount: 999, dueDay: 1, isActive: true };
  const result = buildAgenda([sub, legacy], '2026-02-02', 'semana', '2026-02-02');
  assert.equal(result.rows.length, 0);
  assert.equal(result.pending, 0);
});

test('links inválidos têm retorno seguro e navegação respeita os limites de data', () => {
  assert.deepEqual(agendaSelection(new URLSearchParams('data=2026-02-31&visao=ruim'), '2026-10-27'), { date: '2026-10-27', view: 'mes' });
  assert.equal(moveAgendaPeriod('1900-01-01', 'mes', -1), null);
  assert.equal(moveAgendaPeriod('9999-12-31', 'mes', 1), null);
  assert.equal(agendaPeriod('9999-12-31', 'semana').to, '9999-12-31');
  assert.throws(() => agendaPeriod('2026-01-01', 'dia'));
});

test('dados duplicados ou inválidos não apresentam um total enganoso', () => {
  assert.throws(() => buildAgenda([sub, sub], '2026-01-01', 'mes'), /repetidos/);
  assert.throws(() => buildAgenda([{ ...sub, startDate: 'inválida' }], '2026-01-01', 'mes'));
});
