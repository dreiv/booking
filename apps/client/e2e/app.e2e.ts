import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Client App - E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { message: 'Hello from Playwright E2E!' },
      });
    });
  });

  test('loads successfully, passes a11y audit, and matches visual baseline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Hello from Playwright E2E!')).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await expect(page).toHaveScreenshot('homepage-baseline.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('handles server error response', async ({ page }) => {
    await page.route('/api', async (route) => {
      await route.fulfill({
        status: 500,
        json: { message: 'Server Error' },
      });
    });

    await page.goto('/');
    await expect(page.getByText('Failed to connect to backend server')).toBeVisible();
  });
});
