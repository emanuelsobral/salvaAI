import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';
import workerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { contractOcrText, CONTRACT_OCR_MAX_PAGES } from './contractOcr.js';

GlobalWorkerOptions.workerSrc = workerURL;

export async function readContractPdf(file, { signal, onProgress = () => {}, useOcr = false } = {}) {
  if (!file.name.toLowerCase().endsWith('.pdf') || !file.size || file.size > 10000000) throw Error('Escolha um PDF não vazio de até 10 MB.');
  const data = new Uint8Array(await file.arrayBuffer());
  if (signal?.aborted) throw Error('Leitura cancelada.');
  if (new TextDecoder().decode(data.subarray(0, 1024)).indexOf('%PDF-') < 0) throw Error('O arquivo não parece ser um PDF válido.');
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  const pdfSha256 = Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
  if (signal?.aborted) throw Error('Leitura cancelada.');
  const task = getDocument({ data, isEvalSupported: false, stopAtErrors: true, useSystemFonts: true, maxImageSize: 16000000 });
  const abort = () => { void task.destroy(); };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const document = await task.promise;
    const maxPages = useOcr ? CONTRACT_OCR_MAX_PAGES : 50;
    if (document.numPages > maxPages) throw Error(`Limite de ${maxPages} páginas por contrato${useOcr ? ' com OCR' : ''}.`);
    const imageReader = useOcr ? (await import('./pdfOcr.js')).readPdfPageImage : null;
    const pages = [];
    let length = 0;
    for (let number = 1; number <= document.numPages; number++) {
      if (signal?.aborted) throw Error('Leitura cancelada.');
      onProgress(`Lendo página ${number} de ${document.numPages}…`);
      const page = await document.getPage(number);
      let content;
      if (useOcr) {
        content = contractOcrText(await imageReader(document, number, { signal,
          onProgress: message => onProgress(`Página ${number} de ${document.numPages} — ${message}`),
        }), number);
        if (signal?.aborted) throw Error('Leitura cancelada.');
      } else {
        const text = await page.getTextContent();
        if (text.items.length > 20000) throw Error('Página muito complexa para leitura local.');
        content = text.items.filter(item => typeof item.str === 'string').map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('').trim();
      }
      length += content.length;
      if (content.length > 200000 || length > 1000000) throw Error('O texto ultrapassa o limite de leitura local.');
      if (!content) throw Error(`A página ${number} não possui texto legível. Ative “Ler páginas digitalizadas (OCR)” e selecione o PDF novamente, ou use o cadastro manual.`);
      pages.push(content);
      page.cleanup();
    }
    return { pages, pdfSha256 };
  } catch (error) {
    if (signal?.aborted) throw Error('Leitura cancelada.');
    if (error.name === 'PasswordException') throw Error('O PDF está protegido por senha. Use uma cópia desbloqueada ou cadastre manualmente.');
    if (/^(Limite|Página|O texto|A página|A leitura|Leitura|Não foi possível ler a imagem)/.test(error.message)) throw error;
    throw Error('Não foi possível ler todas as páginas deste PDF. Nenhum campo foi preenchido.');
  } finally {
    signal?.removeEventListener('abort', abort);
    await task.destroy();
  }
}

export function extractContractPages(pages, { signal, onProgress = () => {} } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(Error('Leitura cancelada.')); return; }
    const worker = new Worker(new URL('../workers/contractExtraction.worker.js', import.meta.url), { type: 'module' });
    const finish = (error, result) => {
      clearTimeout(timeout); signal?.removeEventListener('abort', abort); worker.terminate();
      if (error) reject(error); else resolve(result);
    };
    const abort = () => finish(Error('Leitura cancelada.'));
    const timeout = setTimeout(() => finish(Error('A leitura excedeu 90 segundos. Tente novamente ou use o cadastro manual.')), 90000);
    signal?.addEventListener('abort', abort, { once: true });
    worker.onerror = () => finish(Error('O leitor local não iniciou. Tente novamente ou use o cadastro manual.'));
    worker.onmessage = ({ data }) => { if (data.progress) onProgress(data.progress); else if (data.error) finish(Error(data.error)); else finish(null, data.result); };
    worker.postMessage({ pages });
  });
}
