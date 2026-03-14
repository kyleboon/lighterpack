import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `item${now}`, 'testtest', `item+${now}@lighterpack.com`);
}

test.describe('Item and category management', () => {
    test('should rename the default category', async ({ page }) => {
        await freshUser(page);
        const categoryInput = page.locator('.lpCategoryName').first();
        await categoryInput.fill('Shelter');
        await expect(categoryInput).toHaveValue('Shelter');
    });

    test('should add a new category', async ({ page }) => {
        await freshUser(page);
        await page.getByText('Add new category').click();
        await expect(page.locator('.lpCategory')).toHaveCount(2);
    });

    test('should rename the default item', async ({ page }) => {
        await freshUser(page);
        const nameInput = page.locator('input.lpName').first();
        await nameInput.fill('Tent');
        await expect(nameInput).toHaveValue('Tent');
    });

    test('should add a new item to a category', async ({ page }) => {
        await freshUser(page);
        await page.getByText('Add new item').click();
        await expect(page.locator('.lpItem')).toHaveCount(2);
    });

    test('should set item weight and see category subtotal update', async ({ page }) => {
        await freshUser(page);
        await page.locator('input.lpWeight').first().fill('500');
        // @input triggers saveWeight; subtotal recalculates reactively
        await expect(page.locator('.lpItemsFooter .lpDisplaySubtotal').first()).toContainText('500');
    });

    test('should delete an item', async ({ page }) => {
        await freshUser(page);
        // Add a second item so we are not deleting the only one
        await page.getByText('Add new item').click();
        await expect(page.locator('.lpItem')).toHaveCount(2);

        await page.locator('.lpRemoveItem').first().click({ force: true });
        await expect(page.locator('.lpItem')).toHaveCount(1);
    });

    test('should delete a category after confirming the speedbump', async ({ page }) => {
        await freshUser(page);
        // Add a second category — the last category in a list cannot be deleted
        await page.getByText('Add new category').click();
        await expect(page.locator('.lpCategory')).toHaveCount(2);

        await page.locator('.lpRemoveCategory').first().click({ force: true });
        await page.getByRole('button', { name: 'Yes' }).click();
        await expect(page.locator('.lpCategory')).toHaveCount(1);
    });

    test('should mark an item as worn and show worn weight in the list summary', async ({ page }) => {
        await freshUser(page);

        // Enable the worn optional field via Settings
        await page.locator('#settings').hover();
        await page.getByLabel('Worn items').check();

        // Give the item a weight so the list summary becomes visible (totalWeight > 0)
        await page.locator('input.lpWeight').first().fill('200');

        // Toggle worn on the item (icon is visibility:hidden until hover — use force)
        await page.locator('.lpWorn').first().click({ force: true });

        // The worn breakdown row should now appear in the list summary
        await expect(page.locator('.lpWornWeight')).toBeVisible();
    });
});
