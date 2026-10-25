import { createWorker } from 'tesseract.js';
import { recognizeOcrImage } from './ocrTask.js';
import { ocrStatementLines } from './ocrStatement.js';

export async function readPdfPageImage(document, number, { signal, onProgress = () => {} } = {}) {
  if (signal?.aborted) throw Error('Leitura da imagem cancelada.');
  const page = await document.getPage(number);
  const original = page.getViewport({ scale: 1 });
  const scale = Math.min(4, 2600 / Math.max(original.width, original.height));
  const viewport = page.getViewport({ scale });
  const canvas = window.document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
  let render;
  const abort = () => render?.cancel();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    onProgress('Preparando imagem da página…');
    if (signal?.aborted) throw Error('Leitura da imagem cancelada.');
    render = page.render({ canvasContext: canvas.getContext('2d'), viewport });
    await render.promise;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw Error('Não foi possível preparar a imagem desta página.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const base = new URL(`${import.meta.env.BASE_URL}ocr/`, window.location.origin).href;
    const data = await recognizeOcrImage(bytes, { createWorker, signal,
      workerOptions: { workerPath: `${base}worker.min.js`, corePath: base, langPath: base.replace(/\/$/, ''),
        workerBlobURL: false, cacheMethod: 'none' },
      onProgress: message => onProgress(message.status === 'recognizing text' ? `Lendo imagem: ${Math.round(message.progress * 100)}%` : 'Carregando leitor local…')
    });
    return data;
  } catch (error) {
    if (signal?.aborted) throw Error('Leitura da imagem cancelada.');
    if (/^(A leitura|Não foi possível preparar|Texto da imagem)/.test(error.message || '')) throw error;
    throw Error('Não foi possível ler a imagem. Verifique a conexão para carregar o leitor, tente novamente ou preencha manualmente.');
  } finally {
    signal?.removeEventListener('abort', abort);
    canvas.width = 0; canvas.height = 0;
  }
}

export async function readStatementPageImage(document, number, options) {
  return ocrStatementLines(await readPdfPageImage(document, number, options), number);
}
