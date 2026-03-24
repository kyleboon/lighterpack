import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `exp${now}`, 'testtest', `exp+${now}@lighterpack.com`);
}

/**
 * Seeds a small list, publishes it to get an externalId, and returns the CSV
 * download URL so the caller can fetch the file content.
 */
async function seedAndGetCsvUrl(page: any): Promise<string> {
    // Add two categories with one item each
    await page.locator('input.lpCategoryName').first().fill('Shelter');
    await page.locator('.lpCategory').first().locator('input.lpName').first().fill('Tent');
    await page.locator('.lpCategory').first().locator('input.lpWeight').first().fill('800');

    await page.getByText('Add new category').click();
    await page.locator('input.lpCategoryName').nth(1).fill('Kitchen');
    await page.locator('.lpCategory').nth(1).locator('input.lpName').first().fill('Stove');
    await page.locator('.lpCategory').nth(1).locator('input.lpWeight').first().fill('100');

    // Open the Share popover to reveal the share URL
    await page.getByText('Share', { exact: true }).hover();
    const shareUrlInput = page.getByLabel('Share your list');
    await expect(shareUrlInput).toHaveValue(/\S/, { timeout: 10000 });
    const shareUrl = await shareUrlInput.inputValue();

    // Saves are immediate — poll briefly to allow in-flight PATCH requests to complete
    const externalId = shareUrl.split('/r/')[1];
    const csvUrl = `${testRoot}csv/${externalId}`;
    await expect(async () => {
        const response = await page.request.get(csvUrl);
        expect(response.status()).toBe(200);
        expect(await response.text()).toContain('Tent');
    }).toPass({ timeout: 5000 });

    return csvUrl;
}

test.describe('Export and re-import a list', () => {
    test('should export a CSV that contains the seeded items', async ({ page }) => {
        await freshUser(page);
        const csvUrl = await seedAndGetCsvUrl(page);

        const response = await page.request.get(csvUrl);
        expect(response.status()).toBe(200);

        const body = await response.text();
        expect(body).toContain('Tent');
        expect(body).toContain('Stove');
        expect(body).toContain('Shelter');
        expect(body).toContain('Kitchen');
    });

    test('should round-trip: exported CSV imports back with all items', async ({ page }) => {
        await freshUser(page);
        const csvUrl = await seedAndGetCsvUrl(page);

        // Download the CSV
        const response = await page.request.get(csvUrl);
        expect(response.status()).toBe(200);
        const csvContent = await response.text();

        // Create a new blank list to import into
        // Create a second list via the store (sidebar button is behind .lpList z-index)
        await page.evaluate(() => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            app.config.globalProperties.$store.newList();
        });
        await page.locator('.lp-nav-list-item').nth(1).locator('.lp-nav-link').click();

        // #csv is visually off-screen (position:absolute; left:-999px) but always in the DOM
        await page.locator('#csv').setInputFiles(
            {
                name: 'export.csv',
                mimeType: 'text/csv',
                buffer: Buffer.from(csvContent),
            },
            { force: true },
        );

        // Validation modal should show both items
        await expect(page.locator('#importValidate')).toBeVisible();
        await expect(page.locator('#importData')).toContainText('Tent');
        await expect(page.locator('#importData')).toContainText('Stove');

        // Confirm the import
        await page.locator('#importConfirm').click();
        await expect(page.locator('#importValidate')).toBeHidden();

        // Both items should now appear in the new list
        await expect(page.locator('.lpItem')).toHaveCount(2);
        await expect(page.locator('.lpCategory')).toHaveCount(2);
    });

    test('should preserve item weights after round-trip', async ({ page }) => {
        await freshUser(page);
        const csvUrl = await seedAndGetCsvUrl(page);

        const response = await page.request.get(csvUrl);
        const csvContent = await response.text();

        // Create a second list via the store (sidebar button is behind .lpList z-index)
        await page.evaluate(() => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            app.config.globalProperties.$store.newList();
        });
        await page.locator('.lp-nav-list-item').nth(1).locator('.lp-nav-link').click();

        await page.locator('#csv').setInputFiles(
            {
                name: 'export.csv',
                mimeType: 'text/csv',
                buffer: Buffer.from(csvContent),
            },
            { force: true },
        );

        await expect(page.locator('#importValidate')).toBeVisible();
        await page.locator('#importConfirm').click();

        // The first imported category (Shelter) subtotal should reflect Tent at 800 oz
        await expect(page.locator('.lpCategory').first().locator('.lpDisplaySubtotal')).toContainText('800');
    });
});
