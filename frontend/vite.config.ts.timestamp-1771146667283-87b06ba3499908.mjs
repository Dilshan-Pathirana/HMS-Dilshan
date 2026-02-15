// vite.config.ts
import { defineConfig } from "file:///D:/HMS%20-%20TEST/HMS-Dilshan/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/HMS%20-%20TEST/HMS-Dilshan/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "react-redux"]
  },
  // Dependency pre-bundling for faster dev server startup
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react-router-dom",
      "@reduxjs/toolkit",
      "react-redux",
      "redux-persist",
      "axios",
      "framer-motion",
      "lucide-react",
      "react-icons",
      "react-toastify",
      "sweetalert2",
      "date-fns",
      "recharts",
      "@headlessui/react",
      "react-select",
      "react-datepicker"
    ],
    force: false
    // Only force when needed
  },
  server: {
    host: true,
    // Listen on all addresses
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false
      }
    },
    watch: {
      usePolling: true,
      // Ensures file changes are detected
      interval: 1e3
      // OPTIMIZED: Reduced from 100ms to 1000ms to reduce CPU load
    },
    hmr: {
      overlay: true
      // Show errors in browser
    },
    fs: {
      strict: false
    }
  },
  // Build optimizations
  build: {
    target: "esnext",
    outDir: "dist",
    sourcemap: false,
    // Disable sourcemaps in production for smaller bundle
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        // Use content-based hashing for better caching
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        // Manual chunks to prevent React duplication and ensure proper loading order
        manualChunks: {
          // React core - must load first
          "react-vendor": ["react", "react-dom", "react/jsx-runtime"],
          // Redux & state management
          "redux-vendor": ["@reduxjs/toolkit", "react-redux", "redux-persist"],
          // Router
          "router-vendor": ["react-router-dom"],
          // UI libraries
          "ui-vendor": ["framer-motion", "lucide-react", "react-icons", "@headlessui/react"],
          // Charts
          "chart-vendor": ["recharts"],
          // Forms & inputs
          "form-vendor": ["react-select", "react-datepicker", "react-multi-select-component"]
        }
      }
    },
    // Minification settings
    minify: "esbuild",
    cssCodeSplit: true,
    // Reduce bundle size
    reportCompressedSize: false
    // Skip for faster builds
  },
  // Performance optimizations
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxITVMgLSBURVNUXFxcXEhNUy1EaWxzaGFuXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxITVMgLSBURVNUXFxcXEhNUy1EaWxzaGFuXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9ITVMlMjAtJTIwVEVTVC9ITVMtRGlsc2hhbi9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpXSxcblxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcInJlYWN0LXJlZHV4XCJdLFxuICAgIH0sXG5cbiAgICAvLyBEZXBlbmRlbmN5IHByZS1idW5kbGluZyBmb3IgZmFzdGVyIGRldiBzZXJ2ZXIgc3RhcnR1cFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgICBpbmNsdWRlOiBbXG4gICAgICAgICAgICAncmVhY3QnLFxuICAgICAgICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAgICAgICAncmVhY3QvanN4LXJ1bnRpbWUnLFxuICAgICAgICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxuICAgICAgICAgICAgJ0ByZWR1eGpzL3Rvb2xraXQnLFxuICAgICAgICAgICAgJ3JlYWN0LXJlZHV4JyxcbiAgICAgICAgICAgICdyZWR1eC1wZXJzaXN0JyxcbiAgICAgICAgICAgICdheGlvcycsXG4gICAgICAgICAgICAnZnJhbWVyLW1vdGlvbicsXG4gICAgICAgICAgICAnbHVjaWRlLXJlYWN0JyxcbiAgICAgICAgICAgICdyZWFjdC1pY29ucycsXG4gICAgICAgICAgICAncmVhY3QtdG9hc3RpZnknLFxuICAgICAgICAgICAgJ3N3ZWV0YWxlcnQyJyxcbiAgICAgICAgICAgICdkYXRlLWZucycsXG4gICAgICAgICAgICAncmVjaGFydHMnLFxuICAgICAgICAgICAgJ0BoZWFkbGVzc3VpL3JlYWN0JyxcbiAgICAgICAgICAgICdyZWFjdC1zZWxlY3QnLFxuICAgICAgICAgICAgJ3JlYWN0LWRhdGVwaWNrZXInLFxuICAgICAgICBdLFxuICAgICAgICBmb3JjZTogZmFsc2UsIC8vIE9ubHkgZm9yY2Ugd2hlbiBuZWVkZWRcbiAgICB9LFxuXG4gICAgc2VydmVyOiB7XG4gICAgICAgIGhvc3Q6IHRydWUsIC8vIExpc3RlbiBvbiBhbGwgYWRkcmVzc2VzXG4gICAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICAgIHByb3h5OiB7XG4gICAgICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgd2F0Y2g6IHtcbiAgICAgICAgICAgIHVzZVBvbGxpbmc6IHRydWUsIC8vIEVuc3VyZXMgZmlsZSBjaGFuZ2VzIGFyZSBkZXRlY3RlZFxuICAgICAgICAgICAgaW50ZXJ2YWw6IDEwMDAsIC8vIE9QVElNSVpFRDogUmVkdWNlZCBmcm9tIDEwMG1zIHRvIDEwMDBtcyB0byByZWR1Y2UgQ1BVIGxvYWRcbiAgICAgICAgfSxcbiAgICAgICAgaG1yOiB7XG4gICAgICAgICAgICBvdmVybGF5OiB0cnVlLCAvLyBTaG93IGVycm9ycyBpbiBicm93c2VyXG4gICAgICAgIH0sXG4gICAgICAgIGZzOiB7XG4gICAgICAgICAgICBzdHJpY3Q6IGZhbHNlLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICAvLyBCdWlsZCBvcHRpbWl6YXRpb25zXG4gICAgYnVpbGQ6IHtcbiAgICAgICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICAgICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIERpc2FibGUgc291cmNlbWFwcyBpbiBwcm9kdWN0aW9uIGZvciBzbWFsbGVyIGJ1bmRsZVxuICAgICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIC8vIFVzZSBjb250ZW50LWJhc2VkIGhhc2hpbmcgZm9yIGJldHRlciBjYWNoaW5nXG4gICAgICAgICAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgICAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgICAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5bZXh0XScsXG4gICAgICAgICAgICAgICAgLy8gTWFudWFsIGNodW5rcyB0byBwcmV2ZW50IFJlYWN0IGR1cGxpY2F0aW9uIGFuZCBlbnN1cmUgcHJvcGVyIGxvYWRpbmcgb3JkZXJcbiAgICAgICAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVhY3QgY29yZSAtIG11c3QgbG9hZCBmaXJzdFxuICAgICAgICAgICAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3QvanN4LXJ1bnRpbWUnXSxcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVkdXggJiBzdGF0ZSBtYW5hZ2VtZW50XG4gICAgICAgICAgICAgICAgICAgICdyZWR1eC12ZW5kb3InOiBbJ0ByZWR1eGpzL3Rvb2xraXQnLCAncmVhY3QtcmVkdXgnLCAncmVkdXgtcGVyc2lzdCddLFxuICAgICAgICAgICAgICAgICAgICAvLyBSb3V0ZXJcbiAgICAgICAgICAgICAgICAgICAgJ3JvdXRlci12ZW5kb3InOiBbJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAgICAgICAgICAgLy8gVUkgbGlicmFyaWVzXG4gICAgICAgICAgICAgICAgICAgICd1aS12ZW5kb3InOiBbJ2ZyYW1lci1tb3Rpb24nLCAnbHVjaWRlLXJlYWN0JywgJ3JlYWN0LWljb25zJywgJ0BoZWFkbGVzc3VpL3JlYWN0J10sXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYXJ0c1xuICAgICAgICAgICAgICAgICAgICAnY2hhcnQtdmVuZG9yJzogWydyZWNoYXJ0cyddLFxuICAgICAgICAgICAgICAgICAgICAvLyBGb3JtcyAmIGlucHV0c1xuICAgICAgICAgICAgICAgICAgICAnZm9ybS12ZW5kb3InOiBbJ3JlYWN0LXNlbGVjdCcsICdyZWFjdC1kYXRlcGlja2VyJywgJ3JlYWN0LW11bHRpLXNlbGVjdC1jb21wb25lbnQnXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gTWluaWZpY2F0aW9uIHNldHRpbmdzXG4gICAgICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgICAgIC8vIFJlZHVjZSBidW5kbGUgc2l6ZVxuICAgICAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsIC8vIFNraXAgZm9yIGZhc3RlciBidWlsZHNcbiAgICB9LFxuXG4gICAgLy8gUGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uc1xuICAgIGVzYnVpbGQ6IHtcbiAgICAgICAgbG9nT3ZlcnJpZGU6IHsgJ3RoaXMtaXMtdW5kZWZpbmVkLWluLWVzbSc6ICdzaWxlbnQnIH0sXG4gICAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvUyxTQUFTLG9CQUFvQjtBQUNqVSxPQUFPLFdBQVc7QUFHbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBRWpCLFNBQVM7QUFBQSxJQUNMLFFBQVEsQ0FBQyxTQUFTLGFBQWEsYUFBYTtBQUFBLEVBQ2hEO0FBQUE7QUFBQSxFQUdBLGNBQWM7QUFBQSxJQUNWLFNBQVM7QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNKO0FBQUEsSUFDQSxPQUFPO0FBQUE7QUFBQSxFQUNYO0FBQUEsRUFFQSxRQUFRO0FBQUEsSUFDSixNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNILFFBQVE7QUFBQSxRQUNKLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNaO0FBQUEsSUFDSjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0gsWUFBWTtBQUFBO0FBQUEsTUFDWixVQUFVO0FBQUE7QUFBQSxJQUNkO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDRCxTQUFTO0FBQUE7QUFBQSxJQUNiO0FBQUEsSUFDQSxJQUFJO0FBQUEsTUFDQSxRQUFRO0FBQUEsSUFDWjtBQUFBLEVBQ0o7QUFBQTtBQUFBLEVBR0EsT0FBTztBQUFBLElBQ0gsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBO0FBQUEsSUFDWCx1QkFBdUI7QUFBQSxJQUN2QixlQUFlO0FBQUEsTUFDWCxRQUFRO0FBQUE7QUFBQSxRQUVKLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBO0FBQUEsUUFFaEIsY0FBYztBQUFBO0FBQUEsVUFFVixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsbUJBQW1CO0FBQUE7QUFBQSxVQUUxRCxnQkFBZ0IsQ0FBQyxvQkFBb0IsZUFBZSxlQUFlO0FBQUE7QUFBQSxVQUVuRSxpQkFBaUIsQ0FBQyxrQkFBa0I7QUFBQTtBQUFBLFVBRXBDLGFBQWEsQ0FBQyxpQkFBaUIsZ0JBQWdCLGVBQWUsbUJBQW1CO0FBQUE7QUFBQSxVQUVqRixnQkFBZ0IsQ0FBQyxVQUFVO0FBQUE7QUFBQSxVQUUzQixlQUFlLENBQUMsZ0JBQWdCLG9CQUFvQiw4QkFBOEI7QUFBQSxRQUN0RjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUE7QUFBQSxJQUVBLFFBQVE7QUFBQSxJQUNSLGNBQWM7QUFBQTtBQUFBLElBRWQsc0JBQXNCO0FBQUE7QUFBQSxFQUMxQjtBQUFBO0FBQUEsRUFHQSxTQUFTO0FBQUEsSUFDTCxhQUFhLEVBQUUsNEJBQTRCLFNBQVM7QUFBQSxFQUN4RDtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
