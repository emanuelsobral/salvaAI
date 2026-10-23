import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localReply, financialSummary } from '../src/utils/localAssistant.js';
import disabledAI from '../netlify/functions/ai.js';

const data = { balances: { GENERAL: 0 }, curr_invoice: 200,
  lighthouse: { value: -200, total_expenses: 500 }, period: '2026-10',
  charts: { donut: { labels: ['Alimentação', 'Transporte'], series: [300, 200] } },
  projection_12m: [{ label: 'Set/27', v: -800 }] };

test('ajuda e perguntas desconhecidas não solicitam dados nem inventam análise', () => {
  assert.match(localReply('Olá!'), /sem IA/);
  assert.match(localReply('O que você consegue fazer?'), /Posso mostrar/);
  assert.match(localReply('qual o saldo de ontem?'), /não reconheço/);
  assert.match(localReply('pague minha fatura'), /Não interpreto contratos nem altero/);
  assert.equal(localReply('qual meu saldo?'), null);
});
test('consultas locais preservam zero, saldo negativo e significado dos totais', () => {
  assert.match(localReply('saldo', data), /0,00/);
  assert.match(financialSummary(data), /-.*200,00/);
  assert.match(localReply('gastos', data), /2026-10/);
  assert.match(localReply('gastos', data), /não corresponde apenas/);
  assert.match(localReply('maior categoria', data), /Alimentação, com/);
  assert.match(localReply('projeção', data), /não estima novas receitas/);
  assert.match(localReply('saldo', {}), /não informado/);
  assert.match(localReply('maior categoria', {}), /Não há gastos/);
  assert.match(financialSummary(null), /dados suficientes/);
});
test('endpoint publicado desativado não consulta provedor mesmo com autorização', async () => {
  const response = await disabledAI(new Request('http://localhost/api/ai', {
    method: 'POST', headers: { Authorization: 'Bearer any-token', 'Content-Type': 'application/json' }, body: '{}'
  }));
  assert.equal(response.status, 410);
  assert.match((await response.json()).error, /desativada/);
});
