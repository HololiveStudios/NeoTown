import { defineConfig } from 'vite';
import { createApiHandler } from './server-api.js';

const handleApi = createApiHandler(process.cwd());

export default defineConfig({
  root: '.',
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    port: 5173,
    open: false
  },
  plugins: [
    {
      name: 'neotown-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
          if (urlPath.startsWith('/api/')) {
            const handled = await handleApi(req, res, urlPath);
            if (handled) return;
          }
          next();
        });
      }
    }
  ]
});
