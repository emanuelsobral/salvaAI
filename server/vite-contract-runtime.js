import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
export function contractRuntimePlugin() {
  const root = dirname(require.resolve('pyodide'));
  const files = ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
  let base = '/';
  return {
    name: 'local-contract-runtime',
    configResolved(config) { base = config.base; },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const path = new URL(request.url, 'http://localhost').pathname;
        const prefix = `${base}contract-runtime/`;
        if (!path.startsWith(prefix)) return next();
        const name = path.slice(prefix.length);
        if (!files.includes(name) || !['GET', 'HEAD'].includes(request.method)) { response.statusCode = 404; response.end(); return; }
        try {
          const data = await readFile(join(root, name));
          response.setHeader('Content-Type', name.endsWith('.wasm') ? 'application/wasm' : /\.m?js$/.test(name) ? 'text/javascript' : 'application/octet-stream');
          response.setHeader('Content-Length', data.length);
          response.end(request.method === 'HEAD' ? undefined : data);
        } catch { response.statusCode = 500; response.end('Leitor de contratos indisponível'); }
      });
    },
    async generateBundle() {
      for (const file of files) this.emitFile({ type: 'asset', fileName: `contract-runtime/${file}`, source: await readFile(join(root, file)) });
      this.emitFile({ type: 'asset', fileName: 'contract-runtime/NOTICE.txt', source: 'Pyodide 0.29.2 — Mozilla Public License 2.0. Sources and licenses: https://github.com/pyodide/pyodide/tree/0.29.2\nPython standard library and third-party components retain their respective licenses.\n' });
    },
  };
}
