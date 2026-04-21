import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser, loginUser, logoutUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `item${now}`, 'testtest', `item+${now}@baseweight.pro`);
}

/**
 * Seeds the list with 4 categories and 8 items so tests start with
 * meaningful data rather than a single unnamed category and item.
 *
 * Result:
 *   List description: markdown prose with heading, bold, italic, and a link
 *   Shelter  — Tent (800 oz, $500, qty 1), Sleeping Bag (600 oz, $200, qty 1)
 *   Clothing — Rain Jacket (300 oz, $150, qty 1, worn), Fleece (250 oz, $100, qty 1, worn)
 *              worn total: 550 oz (the worn row intentionally has no price column in the summary)
 *   Kitchen  — Stove (100 oz, $80, qty 1), Fuel Canister (200 oz, $15, qty 3)
 *   Food     — Trail Mix (8 oz, $8, qty 1, consumable), Energy Bars (6 oz, $12, qty 3, consumable)
 *              consumable totals: 26 oz, $44.00
 */
async function seedListData(page: any) {
    // Enable optional fields via the store — settings moved to Account Settings modal in redesign
    await page.evaluate(() => {
        const store = (document.getElementById('lp') as any).__vue_app__.config.globalProperties.$store;
        ['price', 'listDescription', 'consumable', 'worn'].forEach((f) => {
            if (!store.library.optionalFields[f]) store.toggleOptionalField(f);
        });
    });

    // Set the list description using markdown
    await page
        .locator('#listDescription')
        .fill(
            '## Summer Backpacking Kit\n\nA **lightweight** setup for 3-season trips.\n\n- Targets a [base weight](https://en.wikipedia.org/wiki/Ultralight_backpacking) under 10 lb\n- Suitable for *moderate* trails',
        );

    // Fill the default category and its existing item
    await page.locator('input.bwCategoryName').first().fill('Shelter');
    await page.locator('.bwCategory').first().locator('input.bwName').first().fill('Tent');
    await page.locator('.bwCategory').first().locator('input.bwDescription').first().fill('3-season backpacking tent');
    await page.locator('.bwCategory').first().locator('input.bwWeight').first().fill('800');
    await page.locator('.bwCategory').first().locator('input.bwPrice').first().fill('500');

    // Add second item to Shelter
    await page.locator('.bwCategory').first().getByText('Add new item').click();
    await page.locator('.bwCategory').first().locator('input.bwName').nth(1).fill('Sleeping Bag');
    await page.locator('.bwCategory').first().locator('input.bwDescription').nth(1).fill('20°F down sleeping bag');
    await page.locator('.bwCategory').first().locator('input.bwWeight').nth(1).fill('600');
    await page.locator('.bwCategory').first().locator('input.bwPrice').nth(1).fill('200');

    // Add Clothing category — store.newCategory creates one default item, so fill it then add a second
    await page.getByText('Add new category').click();
    await page.locator('input.bwCategoryName').nth(1).fill('Clothing');
    await page.locator('.bwCategory').nth(1).locator('input.bwName').first().fill('Rain Jacket');
    await page.locator('.bwCategory').nth(1).locator('input.bwDescription').first().fill('Waterproof hardshell');
    await page.locator('.bwCategory').nth(1).locator('input.bwWeight').first().fill('300');
    await page.locator('.bwCategory').nth(1).locator('input.bwPrice').first().fill('150');
    await page.locator('.bwCategory').nth(1).locator('.bwWorn').first().click({ force: true });
    await page.locator('.bwCategory').nth(1).getByText('Add new item').click();
    await page.locator('.bwCategory').nth(1).locator('input.bwName').nth(1).fill('Fleece');
    await page.locator('.bwCategory').nth(1).locator('input.bwDescription').nth(1).fill('Midlayer insulation');
    await page.locator('.bwCategory').nth(1).locator('input.bwWeight').nth(1).fill('250');
    await page.locator('.bwCategory').nth(1).locator('input.bwPrice').nth(1).fill('100');
    await page.locator('.bwCategory').nth(1).locator('.bwWorn').nth(1).click({ force: true });

    // Add Kitchen category — same pattern
    await page.getByText('Add new category').click();
    await page.locator('input.bwCategoryName').nth(2).fill('Kitchen');
    await page.locator('.bwCategory').nth(2).locator('input.bwName').first().fill('Stove');
    await page.locator('.bwCategory').nth(2).locator('input.bwDescription').first().fill('Canister stove');
    await page.locator('.bwCategory').nth(2).locator('input.bwWeight').first().fill('100');
    await page.locator('.bwCategory').nth(2).locator('input.bwPrice').first().fill('80');
    await page.locator('.bwCategory').nth(2).getByText('Add new item').click();
    await page.locator('.bwCategory').nth(2).locator('input.bwName').nth(1).fill('Fuel Canister');
    await page.locator('.bwCategory').nth(2).locator('input.bwDescription').nth(1).fill('100g canister');
    await page.locator('.bwCategory').nth(2).locator('input.bwWeight').nth(1).fill('200');
    await page.locator('.bwCategory').nth(2).locator('input.bwPrice').nth(1).fill('15');
    await page.locator('.bwCategory').nth(2).locator('input.bwQty').nth(1).fill('3');

    // Add Food category with 2 consumable items
    await page.getByText('Add new category').click();
    await page.locator('input.bwCategoryName').nth(3).fill('Food');
    await page.locator('.bwCategory').nth(3).locator('input.bwName').first().fill('Trail Mix');
    await page
        .locator('.bwCategory')
        .nth(3)
        .locator('input.bwDescription')
        .first()
        .fill('Assorted nuts and dried fruit');
    await page.locator('.bwCategory').nth(3).locator('input.bwWeight').first().fill('8');
    await page.locator('.bwCategory').nth(3).locator('input.bwPrice').first().fill('8');
    await page.locator('.bwCategory').nth(3).locator('.bwConsumable').first().click({ force: true });
    await page.locator('.bwCategory').nth(3).getByText('Add new item').click();
    await page.locator('.bwCategory').nth(3).locator('input.bwName').nth(1).fill('Energy Bars');
    await page.locator('.bwCategory').nth(3).locator('input.bwDescription').nth(1).fill('High protein snack bars');
    await page.locator('.bwCategory').nth(3).locator('input.bwWeight').nth(1).fill('6');
    await page.locator('.bwCategory').nth(3).locator('input.bwPrice').nth(1).fill('12');
    await page.locator('.bwCategory').nth(3).locator('input.bwQty').nth(1).fill('3');
    await page.locator('.bwCategory').nth(3).locator('.bwConsumable').nth(1).click({ force: true });
}

test.describe('Item and category management', () => {
    test('should rename a category', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        const categoryInput = page.locator('input.bwCategoryName').nth(1);
        await categoryInput.fill('Apparel');
        await expect(categoryInput).toHaveValue('Apparel');
    });

    test('should add a new category', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        await page.getByText('Add new category').click();
        await expect(page.locator('.bwCategory')).toHaveCount(5);
    });

    test('should rename an item', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        const nameInput = page.locator('.bwCategory').nth(2).locator('input.bwName').first();
        await nameInput.fill('Pocket Rocket');
        await expect(nameInput).toHaveValue('Pocket Rocket');
    });

    test('should add a new item to a category', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        await page.locator('.bwCategory').nth(1).getByText('Add new item').click();
        await expect(page.locator('.bwItem')).toHaveCount(9);
    });

    test('should show category subtotal weight for seeded items', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        // Shelter: Tent (800) + Sleeping Bag (600) = 1400 oz
        const subtotal = page.locator('.bwCategory').first().locator('.bwDisplaySubtotal');
        await expect(subtotal).toContainText('1400');
    });

    test('should delete an item', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        await page.locator('.bwRemoveItem').first().click({ force: true });
        await expect(page.locator('.bwItem')).toHaveCount(7);
    });

    test('should delete a category after confirming the speedbump', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        await page.locator('.bwRemoveCategory').first().click({ force: true });
        await page.getByRole('button', { name: 'Yes' }).click();
        await expect(page.locator('.bwCategory')).toHaveCount(3);
    });

    test('should show correct per-category and total weights and prices in the list summary', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);

        const categories = page.locator('.bw-summary-row');

        // Per-category subtotals
        await expect(categories.nth(0).locator('.bwDisplaySubtotal')).toContainText('1400');
        await expect(categories.nth(0).locator('.bw-s-price')).toContainText('$700.00');

        await expect(categories.nth(1).locator('.bwDisplaySubtotal')).toContainText('550');
        await expect(categories.nth(1).locator('.bw-s-price')).toContainText('$250.00');

        await expect(categories.nth(2).locator('.bwDisplaySubtotal')).toContainText('700');
        await expect(categories.nth(2).locator('.bw-s-price')).toContainText('$125.00');

        await expect(categories.nth(3).locator('.bwDisplaySubtotal')).toContainText('26');
        await expect(categories.nth(3).locator('.bw-s-price')).toContainText('$44.00');

        // Total row
        await expect(page.locator('.bw-summary-total .bwTotalValue')).toContainText('2676');
        await expect(page.locator('.bw-summary-total .bw-s-price')).toContainText('$1119.00');

        // Base weight = total (2676) − worn (550) − consumable (26) = 2100
        await expect(page.locator('[data-weight-type="base"] .bwDisplaySubtotal')).toContainText('2100');
    });

    test('should show consumable weight and price in the list summary', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        // Trail Mix (8 oz × 1) + Energy Bars (6 oz × 3) = 26 oz
        await expect(page.locator('[data-weight-type="consumable"]')).toBeVisible();
        await expect(page.locator('[data-weight-type="consumable"] .bwDisplaySubtotal')).toContainText('26');
    });

    test('should display existing categories and items after logout and login', async ({ page }) => {
        const ts = Date.now();
        const username = `rt${ts}`;
        const password = 'testtest';
        const email = `rt+${ts}@baseweight.pro`;
        await registerUser(page, username, password, email);

        // Add a category and two items via the UX
        await page.locator('input.bwCategoryName').first().fill('Shelter');
        await page.locator('.bwCategory').first().locator('input.bwName').first().fill('Tent');
        await page.locator('.bwCategory').first().locator('input.bwWeight').first().fill('800');
        await page.locator('.bwCategory').first().getByText('Add new item').click();
        await page.locator('.bwCategory').first().locator('input.bwName').nth(1).fill('Sleeping Bag');
        await page.locator('.bwCategory').first().locator('input.bwWeight').nth(1).fill('600');

        // Wait for autosave (10s debounce + buffer)
        await page.waitForTimeout(12000);

        await logoutUser(page);
        await loginUser(page, email);

        // Previously saved category and items must render from DB
        await expect(page.locator('.bwCategory')).toHaveCount(1);
        await expect(page.locator('input.bwCategoryName').first()).toHaveValue('Shelter');
        await expect(page.locator('.bwItem')).toHaveCount(2);
        await expect(page.locator('.bwCategory').first().locator('input.bwName').first()).toHaveValue('Tent');
        await expect(page.locator('.bwCategory').first().locator('input.bwName').nth(1)).toHaveValue('Sleeping Bag');
    });

    test('should show worn weight for clothing items in the list summary', async ({ page }) => {
        await freshUser(page);
        await seedListData(page);
        // Rain Jacket (300 oz) + Fleece (250 oz) = 550 oz worn
        await expect(page.locator('[data-weight-type="worn"]')).toBeVisible();
        await expect(page.locator('[data-weight-type="worn"] .bwDisplaySubtotal')).toContainText('550');
    });
});
