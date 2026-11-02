import { sanitizeStatementDescription } from './statementPrivacy.js';
export const normalizeMerchant = value => sanitizeStatementDescription(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const transactionIdentity = row => JSON.stringify([row.date || row.transactionDate || row.dt, row.type, Math.round(row.amount * 100), normalizeMerchant(row.originalDescription || row.description)]);
export async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
