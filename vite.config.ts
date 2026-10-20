import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { devServerPlugin } from './server/devServerPlugin';

// `npm run dev:tunnel` (mode "tunnel") lets the Cloudflare quick tunnel host reach the dev server;
// plain `npm run dev` keeps Vite's default host check.
export default defineConfig(({ mode }) => ({
  plugins: [react(), devServerPlugin()],
  server: mode === 'tunnel' ? { allowedHosts: ['.trycloudflare.com'] } : {},
}));
