import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser } from './auth-utils';

/**
 * Registers a fresh user, adds a named item with weight, obtains a share URL,
 * and returns both the page and the share URL so tests can navigate to it.
 */
async function setupSharedList(page: any): Promise<string> {
    const now = Date.now();
    await registerUser(page, `share${now}`, 'testtest', `share+${now}@lighterpack.com`);

    // Name the list and add one item with a weight so the donut chart renders
    await page.getByPlaceholder('List name').fill('Summer Pack');
    await page.locator('input.lpCategoryName').first().fill('Shelter');
    await page.locator('.lpCategory').first().locator('input.lpName').first().fill('Tent');
    await page.locator('.lpCategory').first().locator('input.lpWeight').first().fill('800');

    // Hover the Share header item to reveal the share URL
    await page.getByText('Share', { exact: true }).hover();

    const shareUrlInput = page.getByLabel('Share your list');
    await expect(shareUrlInput).toHaveValue(/\S/, { timeout: 10000 });
    const shareUrl = await shareUrlInput.inputValue();

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

        // Navigate to the share page in the same session (cookies still set) —
        // then log out and reload to verify it is truly public
        await page.context().clearCookies();
        await page.goto(shareUrl);

        await expect(page.locator('.lpListName')).toContainText('Summer Pack');
    });

    test('should show category and item names on the share page', async ({ page }) => {
        const shareUrl = await setupSharedList(page);

        await page.context().clearCookies();
        await page.goto(shareUrl);

        await expect(page.locator('.lpShare')).toContainText('Shelter');
        await expect(page.locator('.lpShare')).toContainText('Tent');
    });

    test('should render a donut chart SVG on the share page', async ({ page }) => {
        const shareUrl = await setupSharedList(page);

        await page.context().clearCookies();
        await page.goto(shareUrl);

        // The share page inlines the SVG chart via {{{chartSvg}}}
        await expect(page.locator('.lpChartContainer svg')).toBeVisible();
    });

    test('should show total weight in the share page summary', async ({ page }) => {
        const shareUrl = await setupSharedList(page);

        await page.context().clearCookies();
        await page.goto(shareUrl);

        // The totals container should contain the weight value (800 oz)
        await expect(page.locator('.lpTotalsContainer')).toContainText('800');
    });
});
