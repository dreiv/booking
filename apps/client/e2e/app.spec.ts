import { test, expect } from '@playwright/test';

test.describe('Client App - E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { message: 'Hello from Playwright E2E!' },
      });
    });
  });

  test('loads successfully and displays API content', async ({ page }) => {
    await page.goto('/');

    const apiMessage = page.getByText('Hello from Playwright E2E!');
    await expect(apiMessage).toBeVisible();
  });

  test('handles server error response', async ({ page }) => {
    await page.route('/api', async (route) => {
      await route.fulfill({
        status: 500,
        json: { message: 'Server Error' },
      });
    });

    await page.goto('/');
  });
});
