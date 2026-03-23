import { test, expect } from '@playwright/test';
import { testRoot } from './utils';

test.describe('Authentication error handling', () => {
    test('should show error for missing email on signin', async ({ page }) => {
        await page.goto(`${testRoot}signin`);

        await page.getByRole('button').filter({ hasText: 'Send sign-in link' }).click();

        await expect(page.locator('.lp-errors-item')).toContainText('Please enter your email address.');
    });
});
