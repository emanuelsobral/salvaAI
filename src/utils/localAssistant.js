import { formatBRL } from './formatters.js';

const HELP = 'Posso mostrar seu resumo, saldo, fatura, gastos do mês, maior categoria de gastos e projeção. Uso os dados cadastrados e respostas automáticas, sem IA. Para lançar uma movimentação, use “Nova Transação”.';
const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[?!.,]+$/g, '').replace(/\s+/g, ' ');
const queries = {
  resumo: ['resumo', 'resumo financeiro', 'como estao minhas financas'],
  saldo: ['saldo', 'meu saldo', 'qual meu saldo', 'qual e meu saldo', 'quanto tenho'],
  fatura: ['fatura', 'minha fatura', 'qual minha fatura', 'quanto devo no cartao'],
  gastos: ['gastos', 'meus gastos', 'gastos do mes', 'quanto gastei', 'como estao meus gastos'],
  categoria: ['maior categoria', 'onde gastei mais', 'onde eu gastei mais este mes'],
  projecao: ['projecao', 'projecao de pagamentos', 'pagamentos futuros'],
};
const amount = value => typeof value === 'number' && Number.isFinite(value) ? formatBRL(value) : 'não informado';

export function financialSummary(data) {
  if (!data?.balances || !data?.lighthouse) return 'Ainda não há dados suficientes para montar o resumo.';
  return `Saldo da conta principal: ${amount(data.balances.GENERAL)}. Fatura pendente do mês: ${amount(data.curr_invoice)}. Saldo após compromissos considerados pelo painel: ${amount(data.lighthouse.value)}. Esta é uma análise automática dos registros, sem IA.`;
}

// null solicita os dados do painel. Perguntas não reconhecidas nunca geram chamadas externas.
export function localReply(message, data) {
  const text = normalize(message);
  if (['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'ajuda', 'o que voce faz', 'o que voce consegue fazer', 'consegue me ajudar com o que'].includes(text)) return HELP;
  const intent = Object.entries(queries).find(([, values]) => values.includes(text))?.[0];
  if (!intent) return 'Ainda não reconheço essa pergunta. Escolha uma consulta: resumo, saldo, fatura, gastos, maior categoria ou projeção. Não interpreto contratos nem altero lançamentos pelo chat.';
  if (!data) return null;
  if (intent === 'resumo') return financialSummary(data);
  if (intent === 'saldo') return `Saldo da conta principal: ${amount(data.balances?.GENERAL)}. Após os compromissos considerados pelo painel: ${amount(data.lighthouse?.value)}.`;
  if (intent === 'fatura') return `Fatura pendente do mês: ${amount(data.curr_invoice)}. Confira os itens e registre pagamentos na área de faturas.`;
  if (intent === 'gastos') return `Gastos considerados pelo painel no período ${data.period || 'atual'}: ${amount(data.lighthouse?.total_expenses)}. O total inclui compras do mês e assinaturas consideradas pelo painel; não corresponde apenas às saídas de dinheiro.`;
  if (intent === 'categoria') {
    const chart = data.charts?.donut;
    const items = (chart?.labels || []).map((label, index) => ({ label, value: chart?.series?.[index] })).filter(item => Number.isFinite(item.value) && item.value > 0);
    if (!items.length) return 'Não há gastos positivos por categoria no período atual.';
    const largest = items.reduce((a, b) => a.value >= b.value ? a : b);
    return `Maior categoria de gastos do período: ${largest.label}, com ${amount(largest.value)}.`;
  }
  const projection = data.projection_12m;
  if (!projection?.length) return 'Não há projeção disponível.';
  const last = projection[projection.length - 1];
  return `Saldo projetado para ${last.label}: ${amount(last.v)}. A projeção desconta os compromissos cadastrados; não estima novas receitas nem despesas futuras ainda não registradas. Veja os meses no painel de projeção.`;
}
