import { test, expect } from '@playwright/test';

import { registerUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `csv${now}`, 'testtest', `csv+${now}@lighterpack.com`);
}

/** A minimal valid CSV matching the LighterPack import format. */
const VALID_CSV = [
    'Item Name,Category,Description,Qty,Weight,Unit',
    'Tent,Shelter,3-season tent,1,16,oz',
    'Sleeping Bag,Shelter,20F down bag,1,24,oz',
    'Stove,Kitchen,Canister stove,1,4,oz',
].join('\n');

/** A CSV whose only data row has an unrecognised unit — no valid rows after filtering. */
const INVALID_UNIT_CSV = ['Item Name,Category,Description,Qty,Weight,Unit', 'Tent,Shelter,desc,1,16,stone'].join('\n');

test.describe('CSV import', () => {
    test('should open the import validation modal with a valid CSV', async ({ page }) => {
        await freshUser(page);

        // #csv is visually off-screen (position:absolute; left:-999px) but always in the DOM
        await page.locator('#csv').setInputFiles(
            {
                name: 'gear.csv',
                mimeType: 'text/csv',
                buffer: Buffer.from(VALID_CSV),
            },
            { force: true },
        );

        // The validation modal should appear
        await expect(page.locator('#importValidate')).toBeVisible();

        // All three item rows should be listed
        await expect(page.locator('#importData .lpRow:not(.lpHeader)')).toHaveCount(3);
        await expect(page.locator('#importData')).toContainText('Tent');
        await expect(page.locator('#importData')).toContainText('Sleeping Bag');
        await expect(page.locator('#importData')).toContainText('Stove');
    });

    test('should import items into the list after confirming', async ({ page }) => {
        await freshUser(page);

        await page.locator('#csv').setInputFiles(
            {
                name: 'gear.csv',
                mimeType: 'text/csv',
                buffer: Buffer.from(VALID_CSV),
            },
            { force: true },
        );

        await expect(page.locator('#importValidate')).toBeVisible();
        await page.locator('#importConfirm').click();

        // After import, the modal should close and the items should appear in the list
        await expect(page.locator('#importValidate')).toBeHidden();
        await expect(page.locator('.lpItem')).toHaveCount(3);
    });

    test('should show an alert and not open the modal for a non-CSV file', async ({ page }) => {
        await freshUser(page);

        // Listen for the alert dialog before triggering the file change
        page.once('dialog', async (dialog) => {
            expect(dialog.message()).toContain('CSV');
            await dialog.dismiss();
        });

        await page.locator('#csv').setInputFiles(
            {
                name: 'gear.txt',
                mimeType: 'text/plain',
                buffer: Buffer.from(VALID_CSV),
            },
            { force: true },
        );

        await expect(page.locator('#importValidate')).toBeHidden();
    });

    test('should show an alert when no valid rows are found in the CSV', async ({ page }) => {
        await freshUser(page);

        page.once('dialog', async (dialog) => {
            expect(dialog.message()).toContain('Unable to load');
            await dialog.dismiss();
        });

        await page.locator('#csv').setInputFiles(
            {
                name: 'bad.csv',
                mimeType: 'text/csv',
                buffer: Buffer.from(INVALID_UNIT_CSV),
            },
            { force: true },
        );

        await expect(page.locator('#importValidate')).toBeHidden();
    });
});
