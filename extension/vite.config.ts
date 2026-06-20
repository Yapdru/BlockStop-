import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'ES2020',
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/pages/popup.html'),
        sidebar: path.resolve(__dirname, 'src/pages/sidebar.html'),
        options: path.resolve(__dirname, 'src/pages/options.html'),
        'background/worker': path.resolve(__dirname, 'src/background/worker.ts'),
        'content/email-injector': path.resolve(__dirname, 'src/content/email-injector.ts'),
        'content/link-checker': path.resolve(__dirname, 'src/content/link-checker.ts'),
        'content/file-monitor': path.resolve(__dirname, 'src/content/file-monitor.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].chunk.js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
    },
  },
});
