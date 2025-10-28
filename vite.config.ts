import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // Listen on all addresses
        watch: {
            usePolling: true, // Enable polling for file changes (helps on Windows)
            interval: 100, // Check for changes every 100ms
        },
        hmr: {
            overlay: true, // Show errors as overlay
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'], // Pre-bundle dependencies
    },
})

