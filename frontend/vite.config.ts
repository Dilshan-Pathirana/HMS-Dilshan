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
            'react/jsx-runtime',
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
            '@headlessui/react',
            'react-select',
            'react-datepicker',
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
        target: 'esnext',
        outDir: 'dist',
        sourcemap: false, // Disable sourcemaps in production for smaller bundle
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // Use content-based hashing for better caching
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
                // Manual chunks to prevent React duplication and ensure proper loading order
                manualChunks: {
                    // React core - must load first
                    'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
                    // Redux & state management
                    'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
                    // Router
                    'router-vendor': ['react-router-dom'],
                    // UI libraries
                    'ui-vendor': ['framer-motion', 'lucide-react', 'react-icons', '@headlessui/react'],
                    // Charts
                    'chart-vendor': ['recharts'],
                    // Forms & inputs
                    'form-vendor': ['react-select', 'react-datepicker', 'react-multi-select-component'],
                },
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
