import { Readable } from 'node:stream';
import { createAiHandler } from './ai-handler.js';
import { verifyToken } from './firebase-auth.js';

export function aiDevPlugin(env) {
  const handler = createAiHandler({ verifyToken, env });
  const install = server => { server.middlewares.use(async (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/ai') return next();
    try {
      const request = new Request('http://localhost/api/ai', {
        method: req.method, headers: req.headers,
        ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: Readable.toWeb(req), duplex: 'half' } : {}),
      });
      const response = await handler(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Não foi possível consultar a IA.' }));
    }
  }); };
  return { name: 'salva-ai-local-api', configureServer: install, configurePreviewServer: install };
}

