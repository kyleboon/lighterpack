import { test, expect } from '@playwright/test';

import { testRoot, getShareUrl } from './utils';

import { registerUser } from './auth-utils';

/**
 * Registers a fresh user, adds a named item with weight, obtains a share URL,
 * and returns the share URL so tests can navigate to it.
 */
async function setupSharedList(page: any): Promise<string> {
    const now = Date.now();
    await registerUser(page, `share${now}`, 'testtest', `share+${now}@lighterpack.com`);

    // Name the list and add one item with a weight so the donut chart renders
    await page.getByPlaceholder('List name').fill('Summer Pack');
    await page.locator('input.lpCategoryName').first().fill('Shelter');
    await page.locator('.lpCategory').first().locator('input.lpName').first().fill('Tent');
    await page.locator('.lpCategory').first().locator('input.lpWeight').first().fill('800');

    const shareUrl = await getShareUrl(page);

    // Saves are immediate — poll briefly to allow in-flight PATCH requests to complete
    await expect(async () => {
        const response = await page.request.get(shareUrl);
        expect(response.status()).toBe(200);
        expect(await response.text()).toContain('Tent');
    }).toPass({ timeout: 5000 });

    return shareUrl;
}

test.describe('Share page', () => {
    test('should be accessible without login and show the list name', async ({ page }) => {
        const shareUrl = await setupSharedList(page);
        await page.context().clearCookies();
        await page.goto(shareUrl);

        // Now uses h1.lp-list-title instead of .lpListName
        await expect(page.locator('h1.lp-list-title')).toContainText('Summer Pack');
    });

    test('should show category and item names on the share page', async ({ page }) => {
        const shareUrl = await setupSharedList(page);
        await page.context().clearCookies();
        await page.goto(shareUrl);

        // Uses the same .lpCategory and .lpItem classes as index
        await expect(page.locator('.lpCategory')).toContainText('Shelter');
        await expect(page.locator('.lpItem')).toContainText('Tent');
    });

    test('should render a donut chart SVG on the share page', async ({ page }) => {
        const shareUrl = await setupSharedList(page);
        await page.context().clearCookies();
        await page.goto(shareUrl);

        await expect(page.locator('.lpChartContainer svg')).toBeVisible();
    });

    test('should show total weight in the share page summary', async ({ page }) => {
        const shareUrl = await setupSharedList(page);
        await page.context().clearCookies();
        await page.goto(shareUrl);

        await expect(page.locator('.lpTotalsContainer')).toContainText('800');
    });

    test('should not show edit controls on the share page', async ({ page }) => {
        const shareUrl = await setupSharedList(page);
        await page.context().clearCookies();
        await page.goto(shareUrl);

        // No editable inputs, no add buttons, no drag handles
        await expect(page.locator('input.lpName')).toHaveCount(0);
        await expect(page.locator('.addCategory')).toHaveCount(0);
        await expect(page.locator('.lpHandle')).toHaveCount(0);
    });

    test('should show sign-in form when not authenticated', async ({ page }) => {
        const shareUrl = await setupSharedList(page);
        await page.context().clearCookies();
        await page.goto(shareUrl);

        await expect(page.locator('form.signin')).toBeVisible();
    });

    test('should show copy button when authenticated', async ({ page }) => {
        const shareUrl = await setupSharedList(page);
        // Navigate to share page while still logged in
        await page.goto(shareUrl);

        await expect(page.locator('.lp-share-copy-btn')).toBeVisible();
    });
});
