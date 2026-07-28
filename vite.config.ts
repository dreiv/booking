import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
    '*.{ts,vue}': 'vp test related --run',
  },
  fmt: { singleQuote: true },
  lint: { options: { typeAware: true, typeCheck: true } },
  run: { cache: true },
});
