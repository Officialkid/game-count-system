import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_USER_EMAIL || 'testuser@example.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123456!';

// Minimal smoke: login -> dashboard -> refresh stays logged in
// Will skip if env creds not provided and default creds fail.
test.describe('Auth smoke', () => {
  test('login and persist on dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Navbar should show user identity
    const navText = await page.locator('header, nav').innerText();
    expect(navText.toLowerCase()).toContain('@');

    // Refresh and ensure still authenticated
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
