import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createFlowPlugin } from './server/createFlowPlugin';

export default defineConfig({
  plugins: [react(), createFlowPlugin()],
});
