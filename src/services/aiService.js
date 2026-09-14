import { auth } from './firebase';
import { validateReceipt } from '../utils/receipt';

function clearLegacyKeys() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key === 'salva_ai_gemini_key' || key.startsWith('salva_ai_gemini_key:')) localStorage.removeItem(key);
    }
  } catch { /* O navegador pode bloquear armazenamento local. */ }
}
clearLegacyKeys();

function summarize(data) {
  return { balances: data?.balances, curr_invoice: data?.curr_invoice, period: data?.period,
    categories: data?.charts?.donut, lighthouse: data?.lighthouse, notifications: data?.notifications };
}
async function requestAI(payload) {
  const user = auth.currentUser;
  if (!user) throw new Error('Entre na sua conta para usar a IA.');
  const token = await user.getIdToken();
  let response;
  try {
    response = await fetch('/api/ai', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(25000),
    });
  } catch { throw new Error('Não foi possível conectar à IA. Verifique sua conexão e tente novamente.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || (response.status === 429 ? 'Limite temporário de IA atingido. Tente mais tarde.' : 'Serviço de IA indisponível.'));
  if (!data) throw new Error('A API de IA não está disponível nesta hospedagem.');
  return data;
}
export async function generateFinancialInsight(data) {
  return (await requestAI({ action: 'insight', context: summarize(data) })).text;
}
export async function chatWithAI(history, message, financialContext) {
  return (await requestAI({ action: 'chat', history, message, context: summarize(financialContext) })).text;
}
export async function extractReceiptData(image, mimeType) {
  return validateReceipt((await requestAI({ action: 'receipt', image, mimeType })).data);
}
