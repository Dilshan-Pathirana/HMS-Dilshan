import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/build/',          // Laravel expects /build/ for assets
  plugins: [react()],
  root: path.resolve(__dirname, 'resources/frontend'),   // your source folder
  publicDir: path.resolve(__dirname, 'resources/frontend/public'), // static files like favicon.ico

  build: {
    outDir: path.resolve(__dirname, 'public/build'),    // compiled assets go here
    emptyOutDir: true,
    manifest: true,                                     // MUST be true
    assetsDir: 'assets',                                // assets folder
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
