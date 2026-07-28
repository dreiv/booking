import { configDefaults, defineConfig, lazyPlugins } from 'vite-plus';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  clearScreen: false,
  plugins: lazyPlugins(() => [vue(), tailwindcss()]),
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
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
