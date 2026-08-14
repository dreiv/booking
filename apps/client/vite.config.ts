import { configDefaults, defineConfig, lazyPlugins } from 'vite-plus';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  plugins: lazyPlugins(() => [vue(), tailwindcss()]),
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  test: {
    exclude: [...configDefaults.exclude, '**/e2e/**'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['{src,tests}/**/*.unit.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['{src,tests}/**/*.browser.ts'],
          setupFiles: ['./tests/setupTests.ts'],
          browser: {
            enabled: true,
            provider: playwright() as never,
            instances: [{ browser: 'chromium', headless: true }],
          },
        },
      },
    ],
  },
});
