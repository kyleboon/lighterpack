import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `item${now}`, 'testtest', `item+${now}@lighterpack.com`);
}

/**
 * Seeds the list with 4 categories and 8 items so tests start with
 * meaningful data rather than a single unnamed category and item.
 *
 * Result:
 *   List description: markdown prose with heading, bold, italic, and a link
 *   Shelter  — Tent (800 oz, $500, qty 1), Sleeping Bag (600 oz, $200, qty 1)
 *   Clothing — Rain Jacket (300 oz, $150, qty 1), Fleece (250 oz, $100, qty 1)
 *   Kitchen  — Stove (100 oz, $80, qty 1), Fuel Canister (200 oz, $15, qty 3)
 *   Food     — Trail Mix (8 oz, $8, qty 1, consumable), Energy Bars (6 oz, $12, qty 3, consumable)
 *              consumable totals: 26 oz, $44.00
 */
async function seedListData(page: any) {
    // Enable item prices, list description, and consumable items via Settings
    await page.locator('#settings').hover();
    await page.getByLabel('Item prices').check();
    await page.getByLabel('List descriptions').check();
    await page.getByLabel('Consumable items').check();
    // Click away to close the popover before interacting with the list
    await page.locator('.lpListBody').click();

    // Set the list description using markdown
    await page.locator('#listDescription').fill(
        '## Summer Backpacking Kit\n\nA **lightweight** setup for 3-season trips.\n\n- Targets a [base weight](https://en.wikipedia.org/wiki/Ultralight_backpacking) under 10 lb\n- Suitable for *moderate* trails',
    );

    // Fill the default category and its existing item
    await page.locator('input.lpCategoryName').first().fill('Shelter');
    await page.locator('.lpCategory').first().locator('input.lpName').first().fill('Tent');
    await page.locator('.lpCategory').first().locator('input.lpDescription').first().fill('3-season backpacking tent');
    await page.locator('.lpCategory').first().locator('input.lpWeight').first().fill('800');
    await page.locator('.lpCategory').first().locator('input.lpPrice').first().fill('500');

    // Add second item to Shelter
    await page.locator('.lpCategory').first().getByText('Add new item').click();
    await page.locator('.lpCategory').first().locator('input.lpName').nth(1).fill('Sleeping Bag');
    await page.locator('.lpCategory').first().locator('input.lpDescription').nth(1).fill('20°F down sleeping bag');
    await page.locator('.lpCategory').first().locator('input.lpWeight').nth(1).fill('600');
    await page.locator('.lpCategory').first().locator('input.lpPrice').nth(1).fill('200');

    // Add Clothing category — store.newCategory creates one default item, so fill it then add a second
    await page.getByText('Add new category').click();
    await page.locator('input.lpCategoryName').nth(1).fill('Clothing');
    await page.locator('.lpCategory').nth(1).locator('input.lpName').first().fill('Rain Jacket');
    await page.locator('.lpCategory').nth(1).locator('input.lpDescription').first().fill('Waterproof hardshell');
    await page.locator('.lpCategory').nth(1).locator('input.lpWeight').first().fill('300');
    await page.locator('.lpCategory').nth(1).locator('input.lpPrice').first().fill('150');
    await page.locator('.lpCategory').nth(1).getByText('Add new item').click();
    await page.locator('.lpCategory').nth(1).locator('input.lpName').nth(1).fill('Fleece');
    await page.locator('.lpCategory').nth(1).locator('input.lpDescription').nth(1).fill('Midlayer insulation');
    await page.locator('.lpCategory').nth(1).locator('input.lpWeight').nth(1).fill('250');
    await page.locator('.lpCategory').nth(1).locator('input.lpPrice').nth(1).fill('100');

    // Add Kitchen category — same pattern
    await page.getByText('Add new category').click();
    await page.locator('input.lpCategoryName').nth(2).fill('Kitchen');
    await page.locator('.lpCategory').nth(2).locator('input.lpName').first().fill('Stove');
    await page.locator('.lpCategory').nth(2).locator('input.lpDescription').first().fill('Canister stove');
    await page.locator('.lpCategory').nth(2).locator('input.lpWeight').first().fill('100');
    await page.locator('.lpCategory').nth(2).locator('input.lpPrice').first().fill('80');
    await page.locator('.lpCategory').nth(2).getByText('Add new item').click();
    await page.locator('.lpCategory').nth(2).locator('input.lpName').nth(1).fill('Fuel Canister');
    await page.locator('.lpCategory').nth(2).locator('input.lpDescription').nth(1).fill('100g canister');
    await page.locator('.lpCategory').nth(2).locator('input.lpWeight').nth(1).fill('200');
    await page.locator('.lpCategory').nth(2).locator('input.lpPrice').nth(1).fill('15');
    await page.locator('.lpCategory').nth(2).locator('input.lpQty').nth(1).fill('3');

    // Add Food category with 2 consumable items
    await page.getByText('Add new category').click();
    await page.locator('input.lpCategoryName').nth(3).fill('Food');
    await page.locator('.lpCategory').nth(3).locator('input.lpName').first().fill('Trail Mix');
    await page.locator('.lpCategory').nth(3).locator('input.lpDescription').first().fill('Assorted nuts and dried fruit');
    await page.locator('.lpCategory').nth(3).locator('input.lpWeight').first().fill('8');
    await page.locator('.lpCategory').nth(3).locator('input.lpPrice').first().fill('8');
    await page.locator('.lpCategory').nth(3).locator('.lpConsumable').first().click({ force: true });
    await page.locator('.lpCategory').nth(3).getByText('Add new item').click();
    await page.locator('.lpCategory').nth(3).locator('input.lpName').nth(1).fill('Energy Bars');
    await page.locator('.lpCategory').nth(3).locator('input.lpDescription').nth(1).fill('High protein snack bars');
    await page.locator('.lpCategory').nth(3).locator('input.lpWeight').nth(1).fill('6');
    await page.locator('.lpCategory').nth(3).locator('input.lpPrice').nth(1).fill('12');
    await page.locator('.lpCategory').nth(3).locator('input.lpQty').nth(1).fill('3');
    await page.locator('.lpCategory').nth(3).locator('.lpConsumable').nth(1).click({ force: true });
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
        await expect(page.locator('.lpCategory')).toHaveCount(5);
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
        await expect(page.locator('.lpItem')).toHaveCount(9);
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
        await expect(page.locator('.lpItem')).toHaveCount(7);
    });

    test('should delete a category after confirming the speedbump', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        await page.locator('.lpRemoveCategory').first().click({ force: true });
        await page.getByRole('button', { name: 'Yes' }).click();
        await expect(page.locator('.lpCategory')).toHaveCount(3);
    });

    test('should show consumable weight and price in the list summary', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        // Trail Mix (8 oz × 1) + Energy Bars (6 oz × 3) = 26 oz, $8 + $36 = $44.00
        await expect(page.locator('.lpConsumableWeight')).toBeVisible();
        await expect(page.locator('.lpConsumableWeight .lpDisplaySubtotal')).toContainText('26');
        await expect(page.locator('.lpConsumableWeight .lpCell.lpNumber.lpSubtotal').first()).toContainText('$44.00');
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
