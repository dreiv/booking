import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-vue';
import axe from 'axe-core';
import App from '#/App.vue';

test('renders App component and displays API data intercepted by MSW', async () => {
  const { getByText, container } = render(App);

  await expect.element(getByText('Hello from MSW!')).toBeInTheDocument();

  const results = await axe.run(container);
  expect(results.violations).toEqual([]);
});
