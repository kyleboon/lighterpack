import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `list${now}`, 'testtest', `list+${now}@lighterpack.com`);
}

test.describe('List management', () => {
    test('should create a new list', async ({ page }) => {
        await freshUser(page);

        await page.locator('.listContainerHeader .lpTarget a.lpAdd').click();
        // Move mouse away so the hover flyout closes and doesn't intercept subsequent clicks
        await page.mouse.move(0, 400);
        await expect(page.locator('.lpLibraryList')).toHaveCount(2);
    });

    test('should switch to a different list', async ({ page }) => {
        await freshUser(page);

        await page.locator('.listContainerHeader .lpTarget a.lpAdd').click();
        await page.mouse.move(0, 400);

        // Second list is now in the sidebar; click it to make it active
        const secondList = page.locator('.lpLibraryList').nth(1);
        await secondList.locator('.lpLibraryListSwitch').click();

        await expect(secondList).toHaveClass(/lpActive/);
    });

    test('should delete a list after confirming the speedbump', async ({ page }) => {
        await freshUser(page);

        // Create a second list so there is one to delete
        await page.locator('.listContainerHeader .lpTarget a.lpAdd').click();
        await page.mouse.move(0, 400);

        // Switch to second list so the first list's remove button is visible
        await page.locator('.lpLibraryList').nth(1).locator('.lpLibraryListSwitch').click();

        // Delete the first list
        await page.locator('.lpLibraryList').nth(0).locator('.lpRemove').click({ force: true });
        await page.getByRole('button', { name: 'Yes' }).click();

        await expect(page.locator('.lpLibraryList')).toHaveCount(1);
    });

    test('should copy a list', async ({ page }) => {
        await freshUser(page);

        // Add an item name so the list has a real name to copy
        await page.locator('input.lpCategoryName').first().fill('Shelter');

        // Trigger the copy-list modal via the bus event (same as clicking "Copy a list" in the flyout)
        await page.evaluate(() => (window as any).bus.$emit('copyList'));

        // The copy-list modal should appear; select the first list and confirm
        await expect(page.locator('#copyListDialog')).toBeVisible();
        await page.locator('#listToCopy').selectOption({ index: 0 });
        await page.locator('#copyConfirm').click();

        await expect(page.locator('.lpLibraryList')).toHaveCount(2);
    });

    test('should rename a list', async ({ page }) => {
        await freshUser(page);

        const listNameInput = page.getByPlaceholder('List Name');
        await listNameInput.fill('Weekend Trip');
        // Blur to trigger save
        await listNameInput.blur();

        // The sidebar should reflect the new name
        await expect(page.locator('.lpLibraryListSwitch').first()).toContainText('Weekend Trip');
    });
});
