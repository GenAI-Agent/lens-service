import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LensService',
      fileName: 'lens-service',
      formats: ['umd', 'es']
    },
    rollupOptions: {
      external: ['openai', 'html2canvas'],
      output: {
        globals: {
          openai: 'OpenAI',
          html2canvas: 'html2canvas'
        }
      }
    }
  }
});

