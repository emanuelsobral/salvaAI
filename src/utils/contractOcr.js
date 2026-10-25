// Preserve the OCR transcription: never repair digits, calculate values or join pages.
export const CONTRACT_OCR_MAX_PAGES = 50;
export const CONTRACT_OCR_TIMEOUT_MS = 600000;

export function contractOcrText(data, page) {
  const text = typeof data?.text === 'string' ? data.text.trim() : '';
  if (!text) throw Error(`A página ${page} não apresentou texto no OCR. Nenhum campo foi preenchido; use uma imagem mais nítida ou o cadastro manual.`);
  if (text.length > 200000) throw Error('O texto ultrapassa o limite de leitura local.');
  return text;
}
