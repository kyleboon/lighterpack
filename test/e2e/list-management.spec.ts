import { test, expect } from '@playwright/test';

import { testRoot } from './utils';

import { registerUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `list${now}`, 'testtest', `list+${now}@lighterpack.com`);
}

/** Creates a new list via the store (sidebar button is behind .lpList z-index). */
async function addNewList(page: any) {
    await page.evaluate(() => {
        const app = (document.getElementById('lp') as any).__vue_app__;
        app.config.globalProperties.$store.newList();
    });
    // Ensure the sidebar is open (newList changes defaultListId which may hide the sidebar
    // briefly during the transition — wait for lpHasSidebar to stabilise)
    await page.waitForFunction(() => document.getElementById('main')?.classList.contains('lpHasSidebar'));
}

test.describe('List management', () => {
    test('should create a new list', async ({ page }) => {
        await freshUser(page);

        await addNewList(page);
        await expect(page.locator('.lp-nav-list-item')).toHaveCount(2);
    });

    test('should switch to a different list', async ({ page }) => {
        await freshUser(page);

        await addNewList(page);

        // Second list is now in the sidebar; click it to make it active
        const secondList = page.locator('.lp-nav-list-item').nth(1);
        await secondList.locator('.lp-nav-link').click();

        await expect(secondList).toHaveClass(/is-active/);
    });

    test('should delete a list after confirming the speedbump', async ({ page }) => {
        await freshUser(page);

        // Create a second list so there is one to delete
        await addNewList(page);

        // Switch to second list so the first list's remove button is visible
        await page.locator('.lp-nav-list-item').nth(1).locator('.lp-nav-link').click();

        // Delete the first list
        await page.locator('.lp-nav-list-item').nth(0).locator('.lp-nav-remove').click({ force: true });
        await page.getByRole('button', { name: 'Yes' }).click();

        await expect(page.locator('.lp-nav-list-item')).toHaveCount(1);
    });

    test('should copy a list', async ({ page }) => {
        await freshUser(page);

        // Add a category name so the list has content to copy
        await page.locator('input.lpCategoryName').first().fill('Shelter');

        // Copy the current list via the list-actions menu
        await page.locator('button[aria-label="List actions"]').click();
        await page.locator('.lp-actions-menu-item', { hasText: 'Copy this list' }).click();

        await expect(page.locator('.lp-nav-list-item')).toHaveCount(2);
    });

    test('should rename a list', async ({ page }) => {
        await freshUser(page);

        const listNameInput = page.getByPlaceholder('List name');
        await listNameInput.fill('Weekend Trip');
        // Blur to trigger save
        await listNameInput.blur();

        // The sidebar should reflect the new name
        await expect(page.locator('.lp-nav-link').first()).toContainText('Weekend Trip');
    });
});
