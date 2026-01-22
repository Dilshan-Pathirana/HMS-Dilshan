import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Base URL for production deployment
  // Laravel expects /build/ in public
  base: '/build/',

  plugins: [react()],

  // Root folder for your frontend source code
  root: path.resolve(__dirname, 'resources/frontend'),

  // Where static public files live (copied to outDir)
  publicDir: path.resolve(__dirname, 'resources/frontend/public'),

  build: {
    // Output folder for production build
    outDir: path.resolve(__dirname, 'public/build'),

    // Clear outDir before building
    emptyOutDir: true,

    // Generate manifest.json for Laravel integration
    manifest: true,

    rollupOptions: {
      // Entry HTML file
      input: path.resolve(__dirname, 'resources/frontend/index.html'),
    },

    // Optional: inline CSS / assets hashing
    assetsDir: 'assets',
    sourcemap: false, // production: no sourcemap
  },

  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/frontend/src'),
    },
  },
});
