import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Client App - E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/bookings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          data: [
            {
              id: 'bkg-1',
              guestName: 'Playwright Guest',
              roomType: 'double',
              checkIn: '2026-08-01',
              checkOut: '2026-08-03',
              status: 'pending',
              createdAt: '2026-07-01T10:00:00.000Z',
            },
          ],
        },
      });
    });
  });

  test('loads successfully, passes a11y audit, and matches visual baseline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Playwright Guest')).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await expect(page).toHaveScreenshot('homepage-baseline.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('handles server error response', async ({ page }) => {
    await page.route('/api/bookings', async (route) => {
      await route.fulfill({ status: 500, json: { error: 'Server Error' } });
    });

    await page.goto('/');
    await expect(page.getByRole('alert')).toHaveText('Failed to connect to backend server');
  });
});
