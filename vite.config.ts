import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [react()],
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
          target: 'https://www.searchapi.io/api/v1/search',
          changeOrigin: true,
          rewrite: (_path) => {
            const apiKey = env.VITE_SEARCHAPI_IO_KEY;
            if (!apiKey) {
              console.error(
                'SEARCHAPI.IO KEY MISSING: VITE_SEARCHAPI_IO_KEY is not defined in your .env file! API call will fail.'
              );
              // Return a path that will likely cause a clear error or empty response
              return '?error=missing_api_key'; 
            }
            const searchParams = `?engine=apple_app_store_top_charts&category=finance&chart=top_free&store_device=iphone&country=us&api_key=${apiKey}`;
            const fullUrl = `https://www.searchapi.io/api/v1/search${searchParams}`;
            console.log('[Vite Proxy] Full constructed SearchApi.io URL:', fullUrl);
            console.log('[Vite Proxy] Rewriting to SearchApi.io Target URL:', `https://www.searchapi.io/api/v1/search${searchParams}`);
            return searchParams;
          },
          secure: false, // Keep for local development if issues arise with SSL
        },
      },
    },
  });
};
