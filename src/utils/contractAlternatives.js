import { positiveMoney } from './finance.js';

// Candidates are suggestions tied to excerpts, never automatically selected.
export function validateAmountAlternatives(field) {
  if (field.alternativas === undefined) return [];
  const items = field.alternativas;
  if (field.estado !== 'ambiguo' || field.valor !== null || !Array.isArray(items) || items.length < 2 || items.length > 12) throw Error('Alternativas de valor inválidas.');
  const seen = new Set();
  for (const item of items) {
    if (!item || typeof item.rotulo !== 'string' || !item.rotulo.trim() || item.rotulo.length > 160 ||
        typeof item.quantia !== 'string' || !/^\d{1,10}\.\d{2}$/.test(item.quantia) || item.periodicidade !== 'mensal' ||
        typeof item.condicoes !== 'string' || item.condicoes.length > 600 || !Array.isArray(item.evidencias) || !item.evidencias.length || item.evidencias.length > 5) throw Error('Alternativa de mensalidade inválida.');
    positiveMoney(Number(item.quantia));
    const [whole, cents] = item.quantia.split('.');
    const amount = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + cents;
    const amounts = [amount, whole + ',' + cents];
    if (!item.evidencias.some(e => typeof e.trecho === 'string' && e.trecho.includes(item.rotulo) &&
      [...e.trecho.matchAll(/(?<![\d.,])\d+(?:\.\d{3})*,\d{2}(?!\d)/g)].some(m => amounts.includes(m[0])))) throw Error('Alternativa sem vínculo entre opção e valor no trecho.');
    for (const e of item.evidencias) if (!Number.isInteger(e.pagina) || e.pagina < 1 || e.pagina > 50 || typeof e.trecho !== 'string' || !e.trecho.trim() || e.trecho.length > 3000) throw Error('Evidência de alternativa inválida.');
    const key = JSON.stringify([item.rotulo, item.quantia, item.condicoes]);
    if (seen.has(key)) throw Error('Alternativa duplicada.');
    seen.add(key);
  }
  return items;
}

export function selectContractAmount(sourceReview, index) {
  const fields = JSON.parse(sourceReview.resultJson);
  const field = fields.valor_parcela;
  const alternatives = validateAmountAlternatives(field);
  delete field.selecaoUsuario;
  let amount = '';
  if (index !== null) {
    if (!Number.isInteger(index) || !alternatives[index]) throw Error('Selecione uma opção válida.');
    field.selecaoUsuario = { indice: index, quantia: alternatives[index].quantia, origem: 'usuario' };
    amount = Number(alternatives[index].quantia);
  }
  return { amount, sourceReview: { ...sourceReview, resultJson: JSON.stringify(fields) } };
}

export function validateAmountSelection(field) {
  const alternatives = validateAmountAlternatives(field);
  if (field.selecaoUsuario !== undefined) {
    const selection = field.selecaoUsuario;
    if (!selection || selection.origem !== 'usuario' || !Number.isInteger(selection.indice) ||
      !alternatives[selection.indice] || alternatives[selection.indice].quantia !== selection.quantia) throw Error('Confirmação de mensalidade inválida.');
  }
}
