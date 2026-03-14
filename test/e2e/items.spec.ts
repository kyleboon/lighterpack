import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `item${now}`, 'testtest', `item+${now}@lighterpack.com`);
}

/**
 * Seeds the list with 3 categories and 6 items so tests start with
 * meaningful data rather than a single unnamed category and item.
 *
 * Result:
 *   Shelter    — Tent (800 oz, $500), Sleeping Bag (600 oz, $200)
 *   Clothing   — Rain Jacket (300 oz, $150), Fleece (250 oz, $100)
 *   Kitchen    — Stove (100 oz, $80), Fuel Canister (200 oz, $15)
 */
async function seedListData(page: any) {
    // Enable item prices via Settings
    await page.locator('#settings').hover();
    await page.getByLabel('Item prices').check();
    // Click away to close the popover before interacting with the list
    await page.locator('.lpListBody').click();

    // Fill the default category and its existing item
    await page.locator('input.lpCategoryName').first().fill('Shelter');
    await page.locator('.lpCategory').first().locator('input.lpName').first().fill('Tent');
    await page.locator('.lpCategory').first().locator('input.lpWeight').first().fill('800');
    await page.locator('.lpCategory').first().locator('input.lpPrice').first().fill('500');

    // Add second item to Shelter
    await page.locator('.lpCategory').first().getByText('Add new item').click();
    await page.locator('.lpCategory').first().locator('input.lpName').nth(1).fill('Sleeping Bag');
    await page.locator('.lpCategory').first().locator('input.lpWeight').nth(1).fill('600');
    await page.locator('.lpCategory').first().locator('input.lpPrice').nth(1).fill('200');

    // Add Clothing category — store.newCategory creates one default item, so fill it then add a second
    await page.getByText('Add new category').click();
    await page.locator('input.lpCategoryName').nth(1).fill('Clothing');
    await page.locator('.lpCategory').nth(1).locator('input.lpName').first().fill('Rain Jacket');
    await page.locator('.lpCategory').nth(1).locator('input.lpWeight').first().fill('300');
    await page.locator('.lpCategory').nth(1).locator('input.lpPrice').first().fill('150');
    await page.locator('.lpCategory').nth(1).getByText('Add new item').click();
    await page.locator('.lpCategory').nth(1).locator('input.lpName').nth(1).fill('Fleece');
    await page.locator('.lpCategory').nth(1).locator('input.lpWeight').nth(1).fill('250');
    await page.locator('.lpCategory').nth(1).locator('input.lpPrice').nth(1).fill('100');

    // Add Kitchen category — same pattern
    await page.getByText('Add new category').click();
    await page.locator('input.lpCategoryName').nth(2).fill('Kitchen');
    await page.locator('.lpCategory').nth(2).locator('input.lpName').first().fill('Stove');
    await page.locator('.lpCategory').nth(2).locator('input.lpWeight').first().fill('100');
    await page.locator('.lpCategory').nth(2).locator('input.lpPrice').first().fill('80');
    await page.locator('.lpCategory').nth(2).getByText('Add new item').click();
    await page.locator('.lpCategory').nth(2).locator('input.lpName').nth(1).fill('Fuel Canister');
    await page.locator('.lpCategory').nth(2).locator('input.lpWeight').nth(1).fill('200');
    await page.locator('.lpCategory').nth(2).locator('input.lpPrice').nth(1).fill('15');
}

test.describe('Item and category management', () => {
    test('should rename a category', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        const categoryInput = page.locator('input.lpCategoryName').nth(1);
        await categoryInput.fill('Apparel');
        await expect(categoryInput).toHaveValue('Apparel');
    });

    test('should add a new category', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        await page.getByText('Add new category').click();
        await expect(page.locator('.lpCategory')).toHaveCount(4);
    });

    test('should rename an item', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        const nameInput = page.locator('.lpCategory').nth(2).locator('input.lpName').first();
        await nameInput.fill('Pocket Rocket');
        await expect(nameInput).toHaveValue('Pocket Rocket');
    });

    test('should add a new item to a category', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        await page.locator('.lpCategory').nth(1).getByText('Add new item').click();
        await expect(page.locator('.lpItem')).toHaveCount(7);
    });

    test('should show category subtotal weight for seeded items', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        // Shelter: Tent (800) + Sleeping Bag (600) = 1400 oz
        const subtotal = page.locator('.lpCategory').first().locator('.lpDisplaySubtotal');
        await expect(subtotal).toContainText('1400');
    });

    test('should delete an item', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        await page.locator('.lpRemoveItem').first().click({ force: true });
        await expect(page.locator('.lpItem')).toHaveCount(5);
    });

    test('should delete a category after confirming the speedbump', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        await page.locator('.lpRemoveCategory').first().click({ force: true });
        await page.getByRole('button', { name: 'Yes' }).click();
        await expect(page.locator('.lpCategory')).toHaveCount(2);
    });

    test('should mark an item as worn and show worn weight in the list summary', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);

        // Enable the worn optional field via Settings
        await page.locator('#settings').hover();
        await page.getByLabel('Worn items').check();

        // Toggle worn on the first item (Tent, 800 oz)
        await page.locator('.lpWorn').first().click({ force: true });

        // The worn breakdown row should now appear in the list summary
        await expect(page.locator('.lpWornWeight')).toBeVisible();
    });
});
