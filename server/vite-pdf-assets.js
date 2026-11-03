import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
// PDF.js 6 uses these decoders for scanned CCITT/JBIG2/JPX pages and ICC colors.
// Ship the matching package files locally in development and production.
export function pdfAssetsPlugin() {
  const directory = join(dirname(require.resolve('pdfjs-dist/package.json')), 'wasm');
  const files = [
    'jbig2.wasm', 'jbig2_nowasm_fallback.js', 'openjpeg.wasm', 'openjpeg_nowasm_fallback.js', 'qcms_bg.wasm',
    'LICENSE_JBIG2', 'LICENSE_PDFJS_JBIG2', 'LICENSE_OPENJPEG', 'LICENSE_PDFJS_OPENJPEG', 'LICENSE_QCMS', 'LICENSE_PDFJS_QCMS',
  ];
  const assets = new Map(files.map(file => [file, join(directory, file)]));
  let base = '/';
  return {
    name: 'local-pdf-decoders',
    configResolved(config) { base = config.base; },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url, 'http://localhost').pathname;
        const prefix = `${base}pdf-runtime/`;
        if (!pathname.startsWith(prefix)) return next();
        const file = pathname.slice(prefix.length), source = assets.get(file);
        if (!source || !['GET', 'HEAD'].includes(request.method)) { response.statusCode = 404; response.end(); return; }
        try {
          const bytes = await readFile(source);
          response.setHeader('Content-Type', file.endsWith('.wasm') ? 'application/wasm' : file.endsWith('.js') ? 'application/javascript' : 'text/plain');
          response.setHeader('Content-Length', bytes.length);
          response.end(request.method === 'HEAD' ? undefined : bytes);
        } catch { response.statusCode = 500; response.end('Leitor de imagens PDF indisponível'); }
      });
    },
    async generateBundle() {
      for (const [file, source] of assets) this.emitFile({ type: 'asset', fileName: `pdf-runtime/${file}`, source: await readFile(source) });
    },
  };
}
