// Persistência em reais para manter os dados existentes; cálculos em centavos.
export function cents(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isSafeInteger(Math.round(value * 100))) {
    throw new Error('Valor monetário inválido.');
  }
  return Math.round(value * 100);
}

export function positiveMoney(value) {
  const result = cents(value);
  if (result <= 0 || result > 100000000000 || Math.abs(value * 100 - result) > 0.000001) {
    throw new Error('Informe um valor positivo com até duas casas decimais.');
  }
  return result / 100;
}

export const sumMoney = (values) => values.reduce((sum, value) => sum + cents(value), 0) / 100;
export const addMoney = (balance, delta) => sumMoney([balance ?? 0, delta]);

export function requiredText(value, label = 'Descrição') {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 500) {
    throw new Error(`${label}: informe de 1 a 500 caracteres.`);
  }
  return value.trim();
}

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw new Error('Data inválida.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (year < 1900 || year > 9999 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error('Data inválida.');
  }
  return value;
}

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function invoiceKey(month, year) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1900 || year > 9999) {
    throw new Error('Competência inválida.');
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function splitInstallments(amount, count) {
  const total = cents(positiveMoney(amount));
  if (!Number.isInteger(count) || count < 1 || count > 24 || count > total) {
    throw new Error('Informe de 1 a 24 parcelas, com pelo menos um centavo por parcela.');
  }
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, index) => (base + (index < total % count ? 1 : 0)) / 100);
}

export const isTransfer = (txn) => txn.kind === 'TRANSFER' || /^\[CAIXINHA\]/.test(txn.description || '');
export const isInvoicePayment = (txn) => txn.kind === 'INVOICE_PAYMENT' || /^\[CARTAO\] Fatura Paga /.test(txn.description || '');
export function legacyInvoiceKey(txn) {
  if (txn.kind === 'INVOICE_PAYMENT') return null;
  const match = /^\[CARTAO\] Fatura Paga (\d{2})\/(\d{4})/.exec(txn.description || '');
  return match ? `${match[2]}-${match[1]}` : null;
}

export function unpaidSubscriptions(subs, invoice, month, year) {
  const key = invoiceKey(month, year);
  return subs.filter(sub => sub.isActive && (!sub.startMonth || sub.startMonth <= key) && !invoice?.subscriptionPayments?.[sub.id]);
}
