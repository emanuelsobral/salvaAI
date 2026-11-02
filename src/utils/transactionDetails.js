export const PAYMENT_METHODS = { PIX: 'Pix', CREDIT_CARD: 'Crédito', DEBIT_CARD: 'Débito', BOLETO: 'Boleto', OTHER: 'Outro' };
export function normalizePaymentMethod(method, description, accountType) {
  return Object.hasOwn(PAYMENT_METHODS, method) ? method : inferPaymentMethod(description, accountType);
}
export const cleanDescription = text => (text || '').replace(/^\[[^\]]+\]\s*/, '');
export function inferPaymentMethod(description = '', accountType) {
  const text = description.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (/\bPIX\b/.test(text)) return 'PIX';
  if (/\bBOLETO\b/.test(text)) return 'BOLETO';
  if (/\bDEBITO\b/.test(text) && /\bCOMPRA\b|\bCARTAO\b/.test(text)) return 'DEBIT_CARD';
  if (accountType === 'CARTAO' || /CARTAO DE CREDITO/.test(text)) return 'CREDIT_CARD';
  return 'OTHER';
}
