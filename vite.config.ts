/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { demoGuard, isDemoEnabled } from './build/demo-guard.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const demo = isDemoEnabled(process.env.VITE_DEMO_DATA ?? env.VITE_DEMO_DATA);

  return {
    plugins: [react(), tailwindcss(), demoGuard(mode, demo)],
    define: {
      // Remplacé statiquement : en production, le module de démonstration est éliminé du bundle.
      __DEMO_DATA__: JSON.stringify(demo),
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      chunkSizeWarningLimit: 1100,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.tsx'],
      include: ['src/**/*.test.{ts,tsx}', 'build/**/*.test.ts', 'ingestion/**/*.test.ts'],
      css: false,
    },
  };
});
