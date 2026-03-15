import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser } from './auth-utils';

test.describe('Authentication error handling', () => {
    test('should show error for wrong password', async ({ page }) => {
        await page.goto(testRoot);

        const now = Date.now();
        const username = `badpw${now}`;
        const email = `badpw+${now}@lighterpack.com`;
        const password = 'testtest';

        await registerUser(page, username, password, email);

        await page.getByText('Signed in as').hover();
        await page.getByText('Sign out').click();

        await page.fill('.signin input[name="username"]', username);
        await page.fill('.signin input[name="password"]', 'wrongpassword');
        await page.getByRole('button').filter({ hasText: 'Sign in' }).click();

        await expect(page.locator('.lpError')).toBeVisible();
    });

    test('should show error for duplicate username on registration', async ({ page }) => {
        await page.goto(testRoot);

        const now = Date.now();
        const username = `dup${now}`;
        const email = `dup+${now}@lighterpack.com`;
        const password = 'testtest';

        await registerUser(page, username, password, email);

        await page.getByText('Signed in as').hover();
        await page.getByText('Sign out').click();

        // After sign-out the page shows the sign-in form; navigate to the root to get the register form
        await page.goto(testRoot);

        // Try to register again with same username
        await page.fill('.lpRegister input[name="username"]', username);
        await page.fill('.lpRegister input[name="email"]', `dup2+${now}@lighterpack.com`);
        await page.fill('.lpRegister input[name="password"]', password);
        await page.fill('.lpRegister input[name="passwordConfirm"]', password);
        await page.getByRole('button').filter({ hasText: 'Register' }).click();

        await expect(page.locator('.lpError')).toBeVisible();
    });

    test('should show error for mismatched passwords on registration', async ({ page }) => {
        await page.goto(testRoot);

        const now = Date.now();
        await page.fill('.lpRegister input[name="username"]', `mismatch${now}`);
        await page.fill('.lpRegister input[name="email"]', `mismatch+${now}@lighterpack.com`);
        await page.fill('.lpRegister input[name="password"]', 'testtest');
        await page.fill('.lpRegister input[name="passwordConfirm"]', 'different');
        await page.getByRole('button').filter({ hasText: 'Register' }).click();

        await expect(page.locator('.lpError')).toContainText("passwords don't match");
    });

    test('should show error for missing username on signin', async ({ page }) => {
        await page.goto(testRoot);

        await page.fill('.signin input[name="password"]', 'testtest');
        await page.getByRole('button').filter({ hasText: 'Sign in' }).click();

        await expect(page.locator('.lpError')).toContainText('Please enter a username.');
    });

    test('should show error for missing password on signin', async ({ page }) => {
        await page.goto(testRoot);

        await page.fill('.signin input[name="username"]', 'someuser');
        await page.getByRole('button').filter({ hasText: 'Sign in' }).click();

        await expect(page.locator('.lpError')).toContainText('Please enter a password.');
    });

    test('should show error for missing fields on registration', async ({ page }) => {
        await page.goto(testRoot);

        await page.getByRole('button').filter({ hasText: 'Register' }).click();

        await expect(page.locator('.lpError').first()).toBeVisible();
    });
});
