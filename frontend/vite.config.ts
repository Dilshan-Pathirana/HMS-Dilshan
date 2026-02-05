import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],

    resolve: {
        dedupe: ["react", "react-dom", "react-redux"],
    },

    // Dependency pre-bundling for faster dev server startup
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@reduxjs/toolkit',
            'react-redux',
            'redux-persist',
            'axios',
            'framer-motion',
            'lucide-react',
            'react-icons',
            'react-toastify',
            'sweetalert2',
            'date-fns',
            'recharts',
        ],
        force: false, // Only force when needed
    },

    server: {
        host: true, // Listen on all addresses
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            },
        },
        watch: {
            usePolling: true, // Ensures file changes are detected
            interval: 1000, // OPTIMIZED: Reduced from 100ms to 1000ms to reduce CPU load
        },
        hmr: {
            overlay: true, // Show errors in browser
        },
        fs: {
            strict: false,
        },
    },

    // Build optimizations
    build: {
        target: 'es2015',
        outDir: 'dist',
        sourcemap: false, // Disable sourcemaps in production for smaller bundle
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // Use content-based hashing for better caching
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        // Minification settings
        minify: 'esbuild',
        cssCodeSplit: true,
        // Reduce bundle size
        reportCompressedSize: false, // Skip for faster builds
    },

    // Performance optimizations
    esbuild: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
});
