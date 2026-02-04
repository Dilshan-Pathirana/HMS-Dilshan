import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],

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
                // Manual chunk splitting for better caching and parallel loading
                manualChunks: (id) => {
                    // Vendor chunks
                    if (id.includes('node_modules')) {
                        // React ecosystem
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                            return 'vendor-react';
                        }
                        // Redux ecosystem
                        if (id.includes('redux') || id.includes('@reduxjs')) {
                            return 'vendor-redux';
                        }
                        // UI libraries
                        if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-icons')) {
                            return 'vendor-ui';
                        }
                        // Charts and data viz
                        if (id.includes('recharts') || id.includes('d3')) {
                            return 'vendor-charts';
                        }
                        // Forms and validation
                        if (id.includes('react-select') || id.includes('react-datepicker')) {
                            return 'vendor-forms';
                        }
                        // PDF libraries
                        if (id.includes('jspdf') || id.includes('@react-pdf')) {
                            return 'vendor-pdf';
                        }
                        // Everything else
                        return 'vendor-misc';
                    }
                },
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
