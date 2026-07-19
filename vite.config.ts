import { defineConfig } from 'vite-plus';
import type { UserConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

const currentDir = path.basename(process.cwd());

const getProjectConfig = (): UserConfig => {
  switch (currentDir) {
    case 'client':
      return {
        plugins: [vue()] as never,
        server: {
          proxy: {
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
              secure: false,
            },
          },
        },
      };

    case 'server':
      return {
        server: {
          port: 3000,
        },
      };

    default:
      return {};
  }
};

export default defineConfig({
  staged: { '*': 'vp check --fix' },
  fmt: { singleQuote: true },
  lint: { options: { typeAware: true, typeCheck: true } },
  run: { cache: true },

  ...getProjectConfig(),
});
