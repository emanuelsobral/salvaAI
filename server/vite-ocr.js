import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

export function ocrAssetsPlugin() {
  const core = dirname(require.resolve('tesseract.js-core/package.json'));
  const language = dirname(require.resolve('@tesseract.js-data/por/package.json'));
  const assets = new Map([
    ['worker.min.js', require.resolve('tesseract.js/dist/worker.min.js')],
    ['por.traineddata.gz', join(language, '4.0.0_best_int', 'por.traineddata.gz')],
    ['tesseract-LICENSE', require.resolve('tesseract.js/LICENSE.md')],
    ['core-LICENSE', join(core, 'LICENSE')],
    ...['', '-simd', '-relaxedsimd'].map(variant => {
      const file = `tesseract-core${variant}-lstm.wasm.js`;
      return [file, join(core, file)];
    })
  ]);
  let base = '/';
  return {
    name: 'local-ocr-assets',
    configResolved(config) { base = config.base; },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const path = new URL(request.url, 'http://localhost').pathname;
        const prefix = `${base}ocr/`;
        if (!path.startsWith(prefix)) return next();
        const file = path.slice(prefix.length), source = assets.get(file);
        if (!source || !['GET', 'HEAD'].includes(request.method)) { response.statusCode = 404; response.end(); return; }
        try {
          const content = await readFile(source);
          response.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : 'application/octet-stream');
          response.setHeader('Content-Length', content.length);
          response.end(request.method === 'HEAD' ? undefined : content);
        } catch { response.statusCode = 500; response.end('OCR indisponível'); }
      });
    },
    async generateBundle() {
      for (const [file, path] of assets) this.emitFile({ type: 'asset', fileName: `ocr/${file}`, source: await readFile(path) });
    }
  };
}
