import { positiveMoney, requiredText, validDate } from './finance.js';

function optionalText(value, label, max) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.trim().length > max) throw new Error(`${label}: limite de ${max} caracteres.`);
  return value.trim();
}

function optionalDate(value) {
  return value == null || value === '' ? '' : validDate(value);
}

// Campos desconhecidos ficam vazios; duração não determina quantidade de parcelas.
export function normalizeContract(input) {
  const startDate = optionalDate(input.startDate);
  const endDate = optionalDate(input.endDate);
  if (startDate && endDate && endDate < startDate) throw new Error('O término não pode ser anterior ao início.');
  const amount = input.amount == null || input.amount === '' ? null : positiveMoney(input.amount);
  const installments = input.installments == null || input.installments === '' ? null : input.installments;
  if (installments !== null && (!Number.isInteger(installments) || installments < 1 || installments > 1200)) {
    throw new Error('Informe de 1 a 1200 parcelas ou deixe o campo vazio.');
  }
  return {
    title: requiredText(input.title, 'Título'),
    counterparty: optionalText(input.counterparty, 'Contraparte', 500),
    startDate, endDate, amount, installments,
    dueRule: optionalText(input.dueRule, 'Vencimento', 600),
    adjustmentRule: optionalText(input.adjustmentRule, 'Reajuste', 600),
    notes: optionalText(input.notes, 'Observações', 3000),
  };
}

export function contractError(error) {
  if (error?.code === 'permission-denied') return 'Não foi possível acessar os contratos. Entre novamente; se persistir, o acesso precisa ser verificado na configuração do aplicativo.';
  if (['unavailable', 'deadline-exceeded'].includes(error?.code)) return 'Sem conexão com o servidor. Seus campos foram mantidos; tente novamente.';
  return error?.message || 'Não foi possível concluir. Tente novamente.';
}
