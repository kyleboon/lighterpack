import { test, expect } from '@playwright/test';
import { testRoot } from './utils';
import { getSharedUser, loginUser, logoutUser } from './auth-utils';

test('has title', async ({ page }) => {
    await page.goto(testRoot);

    await expect(page).toHaveTitle(/BaseWeight/);
});

test.describe('User Authentication Tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('magic link form shows "check your email" state after submission', async ({ page }) => {
        await page.goto(`${testRoot}signin`);

        await page.fill('.signin input[name="email"]', 'test@example.com');
        await page.getByRole('button').filter({ hasText: 'Send sign-in link' }).click();

        await expect(page.getByText('Check your email')).toBeVisible();
    });

    test('should successfully log in an existing user', async ({ page }) => {
        const { email } = await getSharedUser();

        await loginUser(page, email);
        await expect(page.locator('.bw-sidebar-footer')).toBeVisible();
        await expect(page.getByText('Welcome to BaseWeight!')).toBeVisible();
    });

    test('should successfully log out', async ({ page }) => {
        const { email } = await getSharedUser();

        await loginUser(page, email);
        await logoutUser(page);
        await expect(page.locator('.bw-landing')).toBeVisible();
    });

    test('should successfully delete a user', async ({ page }) => {
        const now = Date.now();
        const email = `del${now}@baseweight.pro`;

        await loginUser(page, email);
        await page.getByText('Account settings').click();
        await page.getByText('Delete account').click();

        await page.getByPlaceholder('Your email address').fill(email);
        await page.getByText('Permanently delete account').click();

        await expect(page.locator('.bw-landing')).toBeVisible();
    });
});
