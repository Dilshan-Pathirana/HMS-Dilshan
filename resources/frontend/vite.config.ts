import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        watch: {
            usePolling: true, // Ensures file changes are detected
            interval: 100, // Polling interval (in ms), adjust if necessary
        },
    },
});
