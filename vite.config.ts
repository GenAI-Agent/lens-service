import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  define: {
    'process.env': '{}',
    'process.env.NODE_ENV': '"production"'
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LensService',
      fileName: 'lens-service',
      formats: ['umd', 'es']
    },
    rollupOptions: {
      external: ['openai', 'html2canvas', 'pg', 'events', 'util', 'net', 'tls', 'crypto', 'dns', 'fs', 'path', 'stream', 'string_decoder'],
      output: {
        globals: {
          openai: 'OpenAI',
          html2canvas: 'html2canvas',
          pg: 'pg',
          events: 'events',
          util: 'util',
          net: 'net',
          tls: 'tls',
          crypto: 'crypto',
          dns: 'dns',
          fs: 'fs',
          path: 'path',
          stream: 'stream',
          string_decoder: 'string_decoder'
        }
      }
    }
  }
});

