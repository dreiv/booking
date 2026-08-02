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
              bookingId: 'bfb6c1a2-1e2e-4c1b-9a8b-1234567890ab',
              hotelId: 1,
              roomTypeId: 1,
              userId: 1,
              guestEmail: 'playwright@example.com',
              guestFirstName: 'Playwright',
              guestLastName: 'Guest',
              checkIn: '2026-08-01',
              checkOut: '2026-08-03',
              status: 'confirmed',
              roomCount: 1,
              expiresAt: null,
              createdAt: '2026-07-01T10:00:00.000Z',
            },
          ],
        },
      });
    });
  });

  test('loads successfully and displays bookings', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Playwright Guest')).toBeVisible();
  });

  test('passes accessibility audit', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Playwright Guest')).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('matches visual baseline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Playwright Guest')).toBeVisible();

    await expect(page).toHaveScreenshot('homepage-baseline.png');
  });

  test('handles server error response', async ({ page }) => {
    await page.route('/api/bookings', async (route) => {
      await route.fulfill({ status: 500, json: { error: 'Server Error' } });
    });

    await page.goto('/');
    await expect(page.getByRole('alert')).toHaveText('Failed to connect to backend server');
  });
});
