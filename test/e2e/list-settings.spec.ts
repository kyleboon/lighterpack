import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `settings${now}`, 'testtest', `settings+${now}@lighterpack.com`);
}

test.describe('List settings', () => {
    test('should toggle item prices column on and off', async ({ page }) => {
        await freshUser(page);

        // Prices are hidden by default
        await expect(page.locator('input.lpPrice').first()).toBeHidden();

        await page.locator('#settings').hover();
        await page.getByLabel('Item prices').check();
        await page.locator('.lpListBody').click();

        await expect(page.locator('input.lpPrice').first()).toBeVisible();

        // Toggle it back off
        await page.locator('#settings').hover();
        await page.getByLabel('Item prices').uncheck();
        await page.locator('.lpListBody').click();

        await expect(page.locator('input.lpPrice').first()).toBeHidden();
    });

    test('should toggle worn items column on and off', async ({ page }) => {
        await freshUser(page);

        // Worn items are ON by default — verify the element exists, then disable it
        await expect(page.locator('.lpWorn').first()).toBeAttached();

        await page.locator('#settings').hover();
        await page.getByLabel('Worn items').uncheck();
        await page.locator('.lpListBody').click();

        // After disabling: element is removed from the DOM via v-if
        await expect(page.locator('.lpWorn').first()).not.toBeAttached();
    });

    test('should toggle consumable items column on and off', async ({ page }) => {
        await freshUser(page);

        // Consumable items are ON by default — verify the element exists, then disable it
        await expect(page.locator('.lpConsumable').first()).toBeAttached();

        await page.locator('#settings').hover();
        await page.getByLabel('Consumable items').uncheck();
        await page.locator('.lpListBody').click();

        // After disabling: element is removed from the DOM via v-if
        await expect(page.locator('.lpConsumable').first()).not.toBeAttached();
    });

    test('should toggle list description field on and off', async ({ page }) => {
        await freshUser(page);

        await expect(page.locator('#listDescriptionContainer')).toBeHidden();

        await page.locator('#settings').hover();
        await page.getByLabel('List descriptions').check();
        await page.locator('.lpListBody').click();

        await expect(page.locator('#listDescriptionContainer')).toBeVisible();
    });

    test('should change the currency symbol', async ({ page }) => {
        await freshUser(page);

        // Enable prices first so the currency setting is visible
        await page.locator('#settings').hover();
        await page.getByLabel('Item prices').check();

        // Change currency symbol to €
        await page.locator('#currencySymbol').fill('€');
        await page.locator('.lpListBody').click();

        // The list summary only renders when total weight > 0, so set a weight and price
        await page.locator('input.lpWeight').first().fill('100');
        await page.locator('input.lpPrice').first().fill('100');

        await expect(page.locator('.lpTotalsContainer')).toContainText('€');
    });

    test('should switch the total weight unit', async ({ page }) => {
        await freshUser(page);

        // Set a weight so a total row appears
        await page.locator('input.lpWeight').first().fill('500');

        // The unit dropdown is in the total row; click it to open
        await page.locator('.lpTotalUnit .lpUnitSelect').click();
        await page.locator('.lpTotalUnit .lpUnitDropdown li.lb').click();

        // The unit label in the total row should now show lb
        await expect(page.locator('.lpTotalUnit .lpDisplay')).toContainText('lb');
    });
});
