import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { cpSync } from 'node:fs';

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [{
    name: 'preview-documentation',
    closeBundle() { cpSync('docs/fab3d', 'dist-fab/docs/fab3d', { recursive: true }); },
  }],
  server: { host: '0.0.0.0', port: 4173, strictPort: true },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  build: {
    outDir: 'dist-fab',
    emptyOutDir: true,
    rollupOptions: { input: resolve(import.meta.dirname, 'ale-v092-fab-preview.html') },
  },
});
