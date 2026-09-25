import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy backend ASP.NET Core API
      '/api': {
        target: 'http://localhost:5286',
        changeOrigin: true,
        secure: false,
      },
      // Proxy Python Agent 2 FastAPI service
      '/ai': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai/, ''),
      },
      // Proxy Python Agent 1 FastAPI service
      '/agent1': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent1/, ''),
      },
    },
  },
});
