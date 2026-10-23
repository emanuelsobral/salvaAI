import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';
import workerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { analyzePdfPage } from './pdfStatement.js';

GlobalWorkerOptions.workerSrc = workerURL;

export async function openStatementPdf(file, { password = '', signal, onProgress = () => {} } = {}) {
  if (!file.size || file.size > 10000000) throw Error('Use um PDF não vazio de até 10 MB.');
  const data = new Uint8Array(await file.arrayBuffer());
  if (signal?.aborted) throw Error('Leitura cancelada.');
  const task = getDocument({ data, password, isEvalSupported: false, stopAtErrors: true, useSystemFonts: true,
    maxImageSize: 16000000, canvasMaxAreaInBytes: 64000000 });
  const abort = () => { void task.destroy(); };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const document = await task.promise;
    if (document.numPages > 50) throw Error('O PDF tem mais de 50 páginas. Exporte um período menor.');
    const lines = [], imagePages = [], unreadablePages = [];
    let characters = 0;
    let continuation = null;
    for (let number = 1; number <= document.numPages; number++) {
      if (signal?.aborted) throw Error('Leitura cancelada.');
      onProgress(number, document.numPages);
      const page = await document.getPage(number);
      const viewport = page.getViewport({ scale: 1 });
      const text = await page.getTextContent();
      if (text.items.length > 20000) throw Error('Página muito complexa. Exporte um período menor.');
      const items = text.items.filter(item => item.str).map(item => {
        const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
        characters += item.str.length;
        return { str: item.str, x, y, width: item.width, height: item.height };
      });
      if (characters > 1000000) throw Error('O texto extraído excede o limite de leitura. Exporte um período menor.');
      const analyzed = analyzePdfPage(items, number, continuation);
      continuation = analyzed.continuation || null;
      if (analyzed.unreadable) unreadablePages.push(number);
      else if (!analyzed.lines.length) imagePages.push(number);
      lines.push(...analyzed.lines);
      page.cleanup();
    }
    return { document, lines, imagePages, unreadablePages, destroy: () => {
      signal?.removeEventListener('abort', abort);
      return task.destroy();
    } };
  } catch (error) {
    signal?.removeEventListener('abort', abort);
    await task.destroy();
    if (error.name === 'PasswordException') throw Error('PDF protegido: informe a senha do arquivo.');
    if (/^(O PDF tem|Página muito complexa|O texto extraído|Leitura cancelada)/.test(error.message)) throw error;
    throw Error('Não foi possível ler este PDF. Tente exportá-lo novamente ou use CSV/OFX.');
  }
}
