import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    base: '/build/',
    plugins: [react()],
    root: path.resolve(__dirname, 'resources/frontend'),
    publicDir: path.resolve(__dirname, 'resources/frontend/public'),
    build: {
        outDir: path.resolve(__dirname, 'public/build'),
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: path.resolve(__dirname, 'resources/frontend/index.html'),
        },
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
