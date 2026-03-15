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

    // Open the Share popover to generate an externalId
    await page.getByText('Share', { exact: true }).hover();
    const shareUrlInput = page.getByLabel('Share your list');
    await expect(shareUrlInput).toHaveValue(/\S/, { timeout: 10000 });
    const shareUrl = await shareUrlInput.inputValue();

    // The app autosaves with a 10-second debounce. Poll until the CSV export
    // contains the seeded items so we know the data has been flushed to the server.
    const externalId = shareUrl.split('/r/')[1];
    const csvUrl = `${testRoot}csv/${externalId}`;
    await expect(async () => {
        const response = await page.request.get(csvUrl);
        expect(response.status()).toBe(200);
        expect(await response.text()).toContain('Tent');
    }).toPass({ timeout: 30000 });

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
        await page.locator('.listContainerHeader .lpTarget a.lpAdd').click();
        await page.mouse.move(0, 400);
        await page.locator('.lpLibraryList').nth(1).locator('.lpLibraryListSwitch').click();

        // #csv is always in the DOM; setInputFiles triggers the onchange handler directly
        await page.setInputFiles('#csv', {
            name: 'export.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent),
        });

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

        await page.locator('.listContainerHeader .lpTarget a.lpAdd').click();
        await page.mouse.move(0, 400);
        await page.locator('.lpLibraryList').nth(1).locator('.lpLibraryListSwitch').click();

        await page.setInputFiles('#csv', {
            name: 'export.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent),
        });

        await expect(page.locator('#importValidate')).toBeVisible();
        await page.locator('#importConfirm').click();

        // The first imported category (Shelter) subtotal should reflect Tent at 800 oz
        await expect(page.locator('.lpCategory').first().locator('.lpDisplaySubtotal')).toContainText('800');
    });
});
