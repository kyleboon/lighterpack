import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { getSharedUser, registerUser, loginUser, logoutUser } from './auth-utils';

test('has title', async ({ page }) => {
    await page.goto(testRoot);

    await expect(page).toHaveTitle(/LighterPack/);
    await expect(page).toHaveScreenshot();
});

test.describe('User Authentication Tests', () => {
    test.beforeAll(async ({ browser }) => {
        const { username, password, email } = await getSharedUser();
        const page = await browser.newPage();
        await page.goto(testRoot);
        await page.fill('.lpRegister input[name="username"]', username);
        await page.fill('.lpRegister input[name="email"]', email);
        await page.fill('.lpRegister input[name="password"]', password);
        await page.fill('.lpRegister input[name="passwordConfirm"]', password);
        await page.getByRole('button').filter({ hasText: 'Register' }).click();
        // Wait for either success (redirect to dashboard) or duplicate user error
        await Promise.race([
            page.waitForURL(testRoot),
            page.waitForSelector('.lpError', { timeout: 5000 }).catch(() => {}),
        ]);
        await page.close();
    });

    test('should successfully register a new user', async ({ page }) => {
        await page.goto(testRoot);

        const now = Date.now();
        const username = `test${now}`;
        const email = `test+${now}@lighterpack.com`;
        const password = 'testtest';

        await registerUser(page, username, password, email);
        await expect(page.getByText(`Signed in as ${username}`)).toBeVisible();
        await expect(page.getByText('Welcome to LighterPack!')).toBeVisible();
    });

    test('should successfully log in an existing user', async ({ page }) => {
        await page.goto(testRoot);

        const { username, password } = await getSharedUser();

        await loginUser(page, username, password);
        await expect(page.getByText(`Signed in as ${username}`)).toBeVisible();
        await expect(page.getByText('Welcome to LighterPack!')).toBeVisible();
        await expect(page).toHaveScreenshot();
    });

    test('should successfully log out', async ({ page }) => {
        await page.goto(testRoot);

        const { username, password } = await getSharedUser();

        await loginUser(page, username, password);
        await logoutUser(page);
        await expect(page.getByRole('heading').filter({ hasText: 'Sign in' })).toBeVisible();
    });

    test('should successfully change password', async ({ page }) => {
        await page.goto(testRoot);

        const now = Date.now();
        const username = `pw${now}`;
        const email = `pw+${now}@lighterpack.com`;
        const password = 'testtest';
        const newPassword = 'testtest2';

        await registerUser(page, username, password, email);
        await page.getByText('Signed in as').hover();
        await page.getByText('Account Settings').click();

        await page.getByPlaceholder('New Password', { exact: true }).fill(newPassword);
        await page.getByPlaceholder('Confirm New Password').fill(newPassword);

        await page.getByText('Submit').click();

        await expect(page.getByText('Please enter your current password.')).toBeVisible();

        await page.getByPlaceholder('Current password').fill(password);

        await page.getByText('Submit').click();
        await expect(page.getByRole('heading').filter({ hasText: 'Account Settings' })).toBeHidden();

        await logoutUser(page);

        await expect(page.getByText('Welcome to LighterPack!')).toBeHidden();

        await loginUser(page, username, newPassword);

        await expect(page.getByText('Welcome to LighterPack!')).toBeVisible();
    });

    test('should successfully delete a user', async ({ page }) => {
        await page.goto(testRoot);

        const now = Date.now();
        const username = `del${now}`;
        const email = `del+${now}@lighterpack.com`;
        const password = 'testtest';

        await registerUser(page, username, password, email);
        await page.getByText('Signed in as').hover();
        await page.getByText('Account Settings').click();
        await page.getByText('Delete Account').click();
        await page.getByText('Permanently delete account').click();

        await expect(page.getByText('Please enter your current password.')).toBeVisible();
        await expect(page.getByText('Please enter the confirmation text.')).toBeVisible();

        await page.getByPlaceholder('Current password', { exact: true }).fill(password);
        await page.getByPlaceholder('Confirmation text').fill('delete my account');

        await page.getByText('Permanently delete account').click();
        await expect(page.getByRole('heading').filter({ hasText: 'Sign in' })).toBeVisible();
    });
});
