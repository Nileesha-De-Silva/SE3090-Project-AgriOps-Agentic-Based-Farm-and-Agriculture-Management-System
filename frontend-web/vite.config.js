import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    css: true,
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy backend ASP.NET Core API
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:5286',
        changeOrigin: true,
        secure: false,
      },
      // Proxy Python Agent 2 FastAPI service
      '/ai': {
        target: process.env.AGENT2_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai/, ''),
      },
      // Proxy Python Agent 1 FastAPI service
      '/agent1': {
        target: process.env.AGENT1_URL || 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent1/, ''),
      },
      // Proxy Python Agent 3 FastAPI service
      '/agent3': {
        target: process.env.AGENT3_URL || 'http://localhost:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent3/, ''),
      },
      // Proxy Python Agent 4 FastAPI service
      '/agent4': {
        target: process.env.AGENT4_URL || 'http://localhost:8004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent4/, ''),
      },
    },
  },
});
