import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `settings${now}`, 'testtest', `settings+${now}@baseweight.pro`);
}

/** Opens the Account Settings modal (settings moved from header popover in redesign). */
async function openSettings(page: any) {
    await page.evaluate(() => {
        const store = (document.getElementById('lp') as any).__vue_app__.config.globalProperties.$store;
        store.showModal('account');
    });
    await expect(page.locator('#accountSettings')).toBeVisible();
}

/** Closes the Account Settings modal. */
async function closeSettings(page: any) {
    await page.locator('#accountSettings').getByText('Close').click();
    await expect(page.locator('#accountSettings')).toBeHidden();
}

test.describe('List settings', () => {
    test('should toggle item prices column on and off', async ({ page }) => {
        await freshUser(page);

        // Prices are hidden by default
        await expect(page.locator('input.bwPrice').first()).toBeHidden();

        await openSettings(page);
        await page.getByLabel('Item prices').check();
        await closeSettings(page);

        await expect(page.locator('input.bwPrice').first()).toBeVisible();

        // Toggle it back off
        await openSettings(page);
        await page.getByLabel('Item prices').uncheck();
        await closeSettings(page);

        await expect(page.locator('input.bwPrice').first()).toBeHidden();
    });

    test('should toggle worn items column on and off', async ({ page }) => {
        await freshUser(page);

        // Worn items are ON by default — verify the element exists, then disable it
        await expect(page.locator('.bwWorn').first()).toBeAttached();

        await openSettings(page);
        await page.getByLabel('Worn items').uncheck();
        await closeSettings(page);

        // After disabling: element is removed from the DOM via v-if
        await expect(page.locator('.bwWorn').first()).not.toBeAttached();
    });

    test('should toggle consumable items column on and off', async ({ page }) => {
        await freshUser(page);

        // Consumable items are ON by default — verify the element exists, then disable it
        await expect(page.locator('.bwConsumable').first()).toBeAttached();

        await openSettings(page);
        await page.getByLabel('Consumable items').uncheck();
        await closeSettings(page);

        // After disabling: element is removed from the DOM via v-if
        await expect(page.locator('.bwConsumable').first()).not.toBeAttached();
    });

    test('should toggle list description field on and off', async ({ page }) => {
        await freshUser(page);

        await expect(page.locator('#listDescriptionContainer')).toBeHidden();

        await openSettings(page);
        await page.getByLabel('List descriptions').check();
        await closeSettings(page);

        await expect(page.locator('#listDescriptionContainer')).toBeVisible();
    });

    test('should change the currency symbol', async ({ page }) => {
        await freshUser(page);

        // Enable prices first so the currency setting is visible
        await openSettings(page);
        await page.getByLabel('Item prices').check();

        // Change currency symbol to €
        await page.locator('#currencySymbol').fill('€');
        await closeSettings(page);

        // The list summary only renders when total weight > 0, so set a weight and price
        await page.locator('input.bwWeight').first().fill('100');
        await page.locator('input.bwPrice').first().fill('100');

        await expect(page.locator('.bwTotalsContainer')).toContainText('€');
    });

    test('should switch the total weight unit', async ({ page }) => {
        await freshUser(page);

        // Set a weight so the summary (and unit selector) appears
        await page.locator('input.bwWeight').first().fill('500');

        // The unit selector is a native <select> in the summary total row
        await page.locator('.bw-summary-total .bw-unit-select').selectOption('lb');

        await expect(page.locator('.bw-summary-total .bw-unit-select')).toHaveValue('lb');
    });
});
