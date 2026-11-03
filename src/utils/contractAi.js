import { contractDraft, CONTRACT_FIELDS } from './contractExtraction.js';

export const CONTRACT_AI_VERSION = '1.0.2';

// Only whitespace may differ. Store the original substring, never the model's rewritten text.
export function originalEvidence(page, quote) {
  if (page.includes(quote)) return quote;
  const tokens = quote.trim().split(/\s+/).map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const match = new RegExp(tokens.join('\\s+'), 'u').exec(page);
  return match && match[0].length <= 3000 ? match[0] : null;
}

export function validateContractPages(pages) {
  if (!Array.isArray(pages) || !pages.length || pages.length > 10 ||
      pages.some(page => typeof page !== 'string' || !page.trim() || page.length > 60000) ||
      pages.reduce((sum, page) => sum + page.length, 0) > 120000) {
    throw Error('Envie de 1 a 10 páginas legíveis, com até 120 mil caracteres no total.');
  }
  return pages;
}

export function validateContractAi(data, pages) {
  validateContractPages(pages);
  if (!data || typeof data !== 'object' || !data.fields ||
      Object.keys(data.fields).length !== 5 || JSON.stringify(data).length > 60000) throw Error('Campos de contrato inválidos.');
  const fields = {};
  for (const key of Object.keys(CONTRACT_FIELDS)) {
    const field = data.fields[key];
    if (!field || !['encontrado', 'nao_identificado', 'ambiguo'].includes(field.estado) ||
        typeof field.motivo !== 'string' || !field.motivo.trim() || field.motivo.length > 1000 ||
        !Array.isArray(field.evidencias) || field.evidencias.length > 10) throw Error('Estado de campo inválido.');
    const evidencias = field.evidencias.map(e => {
      if (!e || !Number.isInteger(e.pagina) || e.pagina < 1 || e.pagina > pages.length ||
          typeof e.trecho !== 'string' || !e.trecho.trim() || e.trecho.length > 3000) throw Error('Evidência não corresponde à página.');
      const original = originalEvidence(pages[e.pagina - 1], e.trecho);
      if (!original) throw Error('Evidência não corresponde à página.');
      return { pagina: e.pagina, trecho: original };
    });
    if (field.estado !== 'encontrado' && field.valor !== null) throw Error('Campo incerto deve permanecer vazio.');
    if (field.estado === 'encontrado' && (!evidencias.length || !field.valor || typeof field.valor !== 'object')) throw Error('Campo sem evidência.');
    // Confidence is not a calibrated probability. Never accept a model's numerical score.
    fields[key] = { estado: field.estado, valor: field.valor, evidencias, motivo: field.motivo,
      confianca: field.estado === 'encontrado' ? 'baixa' : 'nao_aplicavel', regra_id: 'deepseek-fields-v1' };
  }
  const extraction = { version: CONTRACT_AI_VERSION, fields };
  const draft = contractDraft(extraction, pages);
  for (const [key, field] of Object.entries(fields)) {
    if (field.estado !== 'encontrado') continue;
    const value = field.valor;
    const supported = key === 'valor_parcela' ? value.tipo === 'fixo' && typeof value.quantia === 'string' && /^\d{1,10}\.\d{2}$/.test(value.quantia) && draft.amount !== undefined
      : key === 'numero_parcelas' ? draft.installments !== undefined
      : key === 'data_vencimento' ? value.tipo === 'outra_regra' && value.dia === null && value.data === null && typeof value.regra === 'string' && Boolean(value.regra.trim()) && draft.dueRule !== undefined
      : key === 'vigencia' ? value.tipo === 'determinado' && Boolean(draft.startDate) && Boolean(draft.endDate) && draft.endDate >= draft.startDate
      : typeof value.regra === 'string' && Boolean(value.regra.trim()) && draft.adjustmentRule !== undefined;
    if (!supported) throw Error('Valor inválido ou fora do formato suportado. Revise manualmente.');
  }
  return extraction;
}
