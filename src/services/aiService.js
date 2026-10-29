import { auth } from './firebase';
import { validateReceipt } from '../utils/receipt';
import { parseAiResponse } from '../utils/aiResponse';
import { createAiAvailability } from '../utils/aiAvailability';

const withAvailability = createAiAvailability();

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
async function sendAI(payload, signal, expectedUid) {
  const user = auth.currentUser;
  if (!user) throw new Error('Entre na sua conta para usar a IA.');
  if (expectedUid && user.uid !== expectedUid) throw new Error('Sua conta mudou. Envie a pergunta novamente.');
  const token = await user.getIdToken();
  if (auth.currentUser?.uid !== user.uid) throw new Error('Sua conta mudou. Envie a pergunta novamente.');
  if (signal?.aborted) throw new Error('Leitura cancelada.');
  let response;
  try {
    response = await fetch('/api/ai', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(payload), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(55000)]) : AbortSignal.timeout(55000),
    });
  } catch (error) {
    if (signal?.aborted) throw new Error('Leitura cancelada.');
    if (error.name === 'TimeoutError') throw new Error('A IA demorou demais para responder. Tente novamente em instantes.');
    throw new Error('Não foi possível conectar à IA. Verifique sua conexão e tente novamente.');
  }
  return response;
}
async function requestAI(payload, signal, expectedUid) {
  return parseAiResponse(await withAvailability(() => sendAI(payload, signal, expectedUid)));
}
export async function generateFinancialInsight(data) {
  return (await requestAI({ action: 'insight', context: summarize(data) })).text;
}
export async function chatWithAI(history, message, financialContext, { signal, uid } = {}) {
  return (await requestAI({ action: 'chat', history, message, context: summarize(financialContext) }, signal, uid)).text;
}
export async function extractReceiptData(image, mimeType) {
  return validateReceipt((await requestAI({ action: 'receipt', image, mimeType })).data);
}

export async function readDocumentWithAI(action, image, page, { signal } = {}) {
  return (await requestAI({ action, image, mimeType: 'image/jpeg', page,
    ...(action === 'statement-recovery' ? { localReadFailed: true } : {}) }, signal)).data;
}
