import { expect, test } from 'vitest';
import { render } from 'vitest-browser-vue';
import App from '@/App.vue';

test('renders App component and displays API data intercepted by MSW', async () => {
  const { getByText } = render(App);

  await expect.element(getByText('Hello from MSW!')).toBeInTheDocument();
});
