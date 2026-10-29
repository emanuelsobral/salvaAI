import { readDocumentWithAI } from '../services/aiService.js';

// Only a rendered page is sent. No public file URL or persistent provider upload.
export async function readPdfPageWithAI(document, number, { action = 'contract-ocr', signal, onProgress = () => {} } = {}) {
  if (signal?.aborted) throw Error('Leitura cancelada.');
  const page = await document.getPage(number);
  const original = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: Math.min(3, 2200 / Math.max(original.width, original.height)) });
  const canvas = window.document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
  let rendering;
  const abort = () => rendering?.cancel();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    onProgress('Preparando página para a DeepSeek…');
    if (signal?.aborted) throw Error('Leitura cancelada.');
    rendering = page.render({ canvasContext: canvas.getContext('2d'), viewport, background: 'white' });
    await rendering.promise;
    const url = canvas.toDataURL('image/jpeg', 0.9);
    if (!url.startsWith('data:image/jpeg;base64,') || url.length > 4 * 1024 * 1024) throw Error('A imagem desta página excede 3 MB. Use o leitor local ou um PDF menor.');
    if (signal?.aborted) throw Error('Leitura cancelada.');
    onProgress('Lendo página com a DeepSeek…');
    return await readDocumentWithAI(action, url.split(',')[1], number, { signal });
  } finally {
    signal?.removeEventListener('abort', abort);
    canvas.width = 0; canvas.height = 0;
  }
}
