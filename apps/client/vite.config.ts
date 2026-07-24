import { defineConfig, lazyPlugins } from 'vite-plus';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  plugins: lazyPlugins(() => [vue()]),
});
