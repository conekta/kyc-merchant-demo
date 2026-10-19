import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';

import { createFlow, FetchLike, FlowError } from './createFlow';

const sendJson = (res: ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

// Handler de `/api/create-flow`: solo POST; responde `{ flowId }` o `{ error }` con el status del FlowError.
export const createFlowHandler =
  (privateKey: string | undefined, fetchImpl: FetchLike) =>
  async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJson(res, 405, { error: 'Usa POST' });
    }
    try {
      sendJson(res, 200, await createFlow(privateKey, fetchImpl));
    } catch (error) {
      const status = error instanceof FlowError ? error.status : 500;
      sendJson(res, status, { error: error instanceof Error ? error.message : String(error) });
    }
  };

// Solo existe con `vite dev` (configureServer). La llave se lee sin prefijo VITE_, así no entra al bundle.
export const createFlowPlugin = (): Plugin => ({
  name: 'create-flow',
  configureServer(server) {
    const env = loadEnv(server.config.mode, process.cwd(), '');
    const handler = createFlowHandler(env.CONEKTA_PRIVATE_KEY, (url, init) => fetch(url, init));
    server.middlewares.use('/api/create-flow', (req, res) => {
      void handler(req, res);
    });
  },
});
