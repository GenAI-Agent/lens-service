import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: './widget-main.ts',
      name: 'LensWidget',
      fileName: 'lens-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]'
      }
    }
  },
  server: {
    port: 5173
  }
});
