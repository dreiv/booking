import type { Preview } from '@storybook/vue3-vite';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { handlers } from '../src/mocks/handlers';
import '../src/style.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    msw: [...handlers],
  },
  loaders: [mswLoader()],
};

export default preview;
