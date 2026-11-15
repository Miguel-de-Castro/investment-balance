import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      // O app é servido em /app/ (a raiz do site é a landing page, ver scripts/build-landing.mjs)
      base: '/app/',
      build: {
        outDir: 'dist/app',
        emptyOutDir: true,
      },
      server: {
        port: 3000,
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
