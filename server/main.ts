// Servidor de la imagen (Dockerfile): sirve el build de Vite (dist/) con las mismas rutas que `vite dev`, más
// `GET /ping` para los probes. `npm run build` lo compila a dist-server/main.js.
import { readFile } from 'node:fs/promises';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { configHandler, createFlowHandler } from './handlers';

const PORT = Number(process.env.PORT || 3000);
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

const ping: Handler = (_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
  res.end('pong');
};

// Los archivos de dist/assets/ llevan hash en el nombre y se cachean sin límite; index.html nunca.
const serveStatic: Handler = async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const path = join(DIST, pathname === '/' ? 'index.html' : decodeURIComponent(pathname));
  if (!path.startsWith(DIST) || (req.method !== 'GET' && req.method !== 'HEAD')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const data = await readFile(path);
  res.writeHead(200, {
    'Content-Type': MIME[extname(path)] ?? 'application/octet-stream',
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-store',
  });
  res.end(data);
};

const routes: Record<string, Handler> = {
  '/ping': ping,
  '/config.js': configHandler(process.env),
  '/api/create-flow': createFlowHandler(process.env, (url, init) => fetch(url, init)),
};

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
    await (routes[pathname] ?? serveStatic)(req, res);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const missing = code === 'ENOENT' || code === 'EISDIR' || error instanceof URIError;
    res.writeHead(missing ? 404 : 500, { 'Content-Type': 'text/plain' });
    res.end(missing ? 'Not found' : 'Internal error');
    if (!missing) console.error(error);
  }
}).listen(PORT, () => {
  const key = process.env.CONEKTA_PRIVATE_KEY ? '' : ' (sin CONEKTA_PRIVATE_KEY: /api/create-flow responde 500)';
  console.log(`[kyc-merchant-demo] http://localhost:${PORT}${key}`);
});
