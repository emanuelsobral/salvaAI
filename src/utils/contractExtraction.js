import { positiveMoney, validDate } from './finance.js';

export const CONTRACT_FIELDS = {
  valor_parcela: 'Valor da parcela', numero_parcelas: 'Número de parcelas',
  data_vencimento: 'Vencimento', vigencia: 'Vigência', regra_reajuste: 'Reajuste',
};
export const EXTRACTION_STATES = { encontrado: 'Sugestão encontrada', nao_identificado: 'Não identificado', ambiguo: 'Exige esclarecimento', erro_leitura: 'Falha de leitura' };

export function contractDraft(extraction, pages) {
  const draft = {};
  for (const key of Object.keys(CONTRACT_FIELDS)) {
    const field = extraction.fields?.[key];
    if (!field || !Object.hasOwn(EXTRACTION_STATES, field.estado) || !Array.isArray(field.evidencias)) throw Error('Resultado de extração inválido.');
    for (const evidence of field.evidencias) {
      if (!Number.isInteger(evidence.pagina) || evidence.pagina < 1 || typeof evidence.trecho !== 'string' || !evidence.trecho || !pages[evidence.pagina - 1]?.includes(evidence.trecho)) throw Error('Uma evidência não corresponde ao texto da página. Confira o documento manualmente.');
    }
    if (field.estado !== 'encontrado' || !field.evidencias.length || !field.valor) continue;
    const value = field.valor;
    if (key === 'valor_parcela' && value.tipo === 'fixo' && value.moeda === 'BRL') {
      const amount = Number(value.quantia);
      try { draft.amount = positiveMoney(amount); } catch { /* Manual when outside the application's range. */ }
    }
    if (key === 'numero_parcelas' && value.tipo === 'determinado' && Number.isInteger(value.quantidade) && value.quantidade >= 1 && value.quantidade <= 1200) draft.installments = value.quantidade;
    if (key === 'vigencia') {
      for (const [source, destination] of [['inicio', 'startDate'], ['fim', 'endDate']]) {
        if (value[source]) { try { draft[destination] = validDate(value[source]); } catch { /* Do not calculate dates from duration. */ } }
      }
    }
    if (key === 'data_vencimento') {
      const text = value.regra || (value.tipo === 'mensal' && value.dia ? `Todo dia ${value.dia}.` : value.data ? `Vencimento em ${value.data.split('-').reverse().join('/')}.` : '');
      if (typeof text === 'string' && text.length <= 600) draft.dueRule = text;
    }
    if (key === 'regra_reajuste' && typeof value.regra === 'string' && value.regra.length <= 600) draft.adjustmentRule = value.regra;
  }
  return draft;
}

export function prepareSourceReview(extraction, pages, pdfSha256, { useOcr = false, useAi = false } = {}) {
  contractDraft(extraction, pages); // Valida evidências antes de oferecer qualquer preenchimento.
  return validateSourceReview({ method: useAi ? 'PDF_DEEPSEEK_OCR_REVIEW' : useOcr ? 'PDF_OCR_REVIEW' : 'PDF_TEXT_REVIEW', pdfSha256, extractorVersion: extraction.version, resultJson: JSON.stringify(extraction.fields) });
}

export function validateSourceReview(value) {
  if (!value || !['PDF_TEXT_REVIEW', 'PDF_OCR_REVIEW', 'PDF_DEEPSEEK_OCR_REVIEW'].includes(value.method) || !/^[a-f0-9]{64}$/.test(value.pdfSha256 || '') || !/^\d+\.\d+\.\d+$/.test(value.extractorVersion || '') || typeof value.resultJson !== 'string' || value.resultJson.length > 100000) throw Error('As evidências excedem os limites ou são inválidas. Use o cadastro manual.');
  let fields;
  try { fields = JSON.parse(value.resultJson); } catch { throw Error('Evidências inválidas.'); }
  if (!fields || Object.keys(fields).length !== 5) throw Error('Evidências inválidas.');
  for (const key of Object.keys(CONTRACT_FIELDS)) {
    const field = fields[key];
    if (!field || !Object.hasOwn(EXTRACTION_STATES, field.estado) || !Array.isArray(field.evidencias) || typeof field.motivo !== 'string') throw Error('Evidências inválidas.');
    for (const evidence of field.evidencias) if (!Number.isInteger(evidence.pagina) || evidence.pagina < 1 || evidence.pagina > 50 || typeof evidence.trecho !== 'string') throw Error('Evidências inválidas.');
  }
  return { method: value.method, pdfSha256: value.pdfSha256, extractorVersion: value.extractorVersion, resultJson: value.resultJson };
}
