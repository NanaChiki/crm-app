import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      include: '**/*.{jsx,tsx}',
    }),
  ],
  root: '.',
  publicDir: 'public',
  server: {
    port: 5174,
    host: 'localhost',
    hmr: {
      port: 24678,
      host: 'localhost',
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
});
