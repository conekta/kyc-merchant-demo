import type { IncomingMessage, ServerResponse } from 'node:http';

import { createFlow, FetchLike, FlowError } from './createFlow';

// Variables que leen las rutas: de `.env` con `vite dev`, del entorno del pod en la imagen.
export interface ServerEnv {
  CONEKTA_PRIVATE_KEY?: string;
  CONEKTA_API_URL?: string;
  CONEKTA_PUBLIC_KEY?: string;
  KYC_BASE_URL?: string;
}

const sendJson = (res: ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

// Handler de `/api/create-flow`: solo POST; responde `{ flowId }` o `{ error }` con el status del FlowError.
export const createFlowHandler =
  (env: ServerEnv, fetchImpl: FetchLike) =>
  async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJson(res, 405, { error: 'Usa POST' });
    }
    try {
      sendJson(res, 200, await createFlow(env.CONEKTA_PRIVATE_KEY, fetchImpl, env.CONEKTA_API_URL));
    } catch (error) {
      const status = error instanceof FlowError ? error.status : 500;
      sendJson(res, status, { error: error instanceof Error ? error.message : String(error) });
    }
  };

// `/config.js` define `window.__KYC_DEMO__` antes de que cargue la app. La configuración pública va en runtime y no
// en el bundle, así la misma imagen sirve en cualquier ambiente.
export const configScript = (env: ServerEnv) =>
  `window.__KYC_DEMO__ = ${JSON.stringify({ publicKey: env.CONEKTA_PUBLIC_KEY ?? '', kycBaseUrl: env.KYC_BASE_URL ?? '' })};`;

export const configHandler = (env: ServerEnv) => (_req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(configScript(env));
};
