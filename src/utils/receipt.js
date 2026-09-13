import { positiveMoney, requiredText, validDate } from './finance.js';

export function validateReceipt(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Recibo inválido.');
  const categories = ['MORADIA', 'ALIMENTACAO', 'TRANSPORTE', 'SAUDE', 'LAZER', 'OUTROS'];
  let amount = null;
  if (data.amount !== null && data.amount !== undefined) {
    if (typeof data.amount !== 'number' && (typeof data.amount !== 'string' || !/^\d+(\.\d{1,2})?$/.test(data.amount))) throw new Error('Valor do recibo inválido.');
    amount = positiveMoney(Number(data.amount));
  }
  return {
    amount,
    date: data.date == null ? null : validDate(data.date),
    description: data.description == null ? null : requiredText(data.description),
    category: categories.includes(data.category) ? data.category : 'OUTROS'
  };
}
