import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/coinbaseRank': {
        target: 'https://rss.applemarketingtools.com/api/v2/us/apps/top-free/200/finance.json',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coinbaseRank/, ''),
      },
    },
  },
});
