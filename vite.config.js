import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',          // Standalone SPA
  plugins: [react()],
  root: path.resolve(__dirname, 'resources/frontend'),
  publicDir: path.resolve(__dirname, 'resources/frontend/public'),

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    }
  },

  build: {
    outDir: path.resolve(__dirname, 'public/build'),
    emptyOutDir: true,
    manifest: true,
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'resources/frontend/index.html'),
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/frontend/src'),
    },
  },
});
