import { defineConfig } from 'vite-plus';

export default defineConfig({
  clearScreen: false,
  pack: {
    entry: ['src/main.ts'],
    format: ['esm'],
    target: 'node22',
  },
});
