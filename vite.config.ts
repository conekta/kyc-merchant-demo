import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createFlowPlugin } from './server/createFlowPlugin';

// `npm run dev:tunnel` (mode "tunnel") lets the Cloudflare quick tunnel host reach the dev server;
// plain `npm run dev` keeps Vite's default host check.
export default defineConfig(({ mode }) => ({
  plugins: [react(), createFlowPlugin()],
  server: mode === 'tunnel' ? { allowedHosts: ['.trycloudflare.com'] } : {},
}));
