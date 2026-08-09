import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', 'msw-storybook-addon'],
  framework: { name: '@storybook/vue3-vite', options: {} },
  core: { disableTelemetry: true },
};

export default config;
