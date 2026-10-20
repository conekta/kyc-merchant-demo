import type { Plugin } from 'vite';
import { loadEnv } from 'vite';

import { configHandler, createFlowHandler } from './handlers';

// Las rutas de server/main.ts dentro de `vite dev` (configureServer). Las variables se leen sin prefijo VITE_, así la
// llave privada no entra al bundle.
export const devServerPlugin = (): Plugin => ({
  name: 'kyc-demo-server',
  configureServer(server) {
    const env = loadEnv(server.config.mode, process.cwd(), '');
    const createFlow = createFlowHandler(env, (url, init) => fetch(url, init));
    server.middlewares.use('/api/create-flow', (req, res) => {
      void createFlow(req, res);
    });
    server.middlewares.use('/config.js', configHandler(env));
  },
});
