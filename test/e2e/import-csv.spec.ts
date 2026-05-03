import { test, expect } from '@playwright/test';

import { registerUser } from './auth-utils';

async function freshUser(page: any) {
    const now = Date.now();
    await registerUser(page, `csv${now}`, 'testtest', `csv+${now}@baseweight.pro`);
}

/** A minimal valid CSV matching the Baseweight import format. */
const VALID_CSV = [
    'Item Name,Category,Description,Qty,Weight,Unit',
    'Tent,Shelter,3-season tent,1,16,oz',
    'Sleeping Bag,Shelter,20F down bag,1,24,oz',
    'Stove,Kitchen,Canister stove,1,4,oz',
].join('\n');

/** A CSV whose only data row has an unrecognised unit — no valid rows after filtering. */
const INVALID_UNIT_CSV = ['Item Name,Category,Description,Qty,Weight,Unit', 'Tent,Shelter,desc,1,16,stone'].join('\n');

/** A full 10-column CSV matching the Baseweight export format. */
const FULL_CSV = [
    'Item Name,Category,desc,qty,weight,unit,url,price,worn,consumable',
    'Tent,Shelter,3-season tent,1,32,ounce,https://example.com/tent,350,Worn,',
    'Water Filter,Consumables,Squeeze filter,1,3,ounce,https://example.com/filter,35,,Consumable',
    'Rain Jacket,Clothing,Lightweight shell,1,8,ounce,,200,Worn,',
].join('\n');

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
        await expect(page.locator('#importData .bwRow:not(.bwHeader)')).toHaveCount(3);
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
        await expect(page.locator('.bwItem')).toHaveCount(3);
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

    test('should import all fields from a full 10-column CSV', async ({ page }) => {
        await freshUser(page);

        await page.locator('#csv').setInputFiles(
            {
                name: 'full_gear.csv',
                mimeType: 'text/csv',
                buffer: Buffer.from(FULL_CSV),
            },
            { force: true },
        );

        // The validation modal should appear with all three items
        await expect(page.locator('#importValidate')).toBeVisible();
        await expect(page.locator('#importData .bwRow:not(.bwHeader)')).toHaveCount(3);

        // Price, Worn, and Consumable columns should be visible in the header
        const header = page.locator('#importData .bwHeader');
        await expect(header).toContainText('Price');
        await expect(header).toContainText('Worn');
        await expect(header).toContainText('Consumable');

        // Confirm the import
        await page.locator('#importConfirm').click();
        await expect(page.locator('#importValidate')).toBeHidden();

        // All three items should be in the list
        await expect(page.locator('.bwItem')).toHaveCount(3);

        // Verify the imported data via the store
        const storeData = await page.evaluate(() => {
            const app = (document.getElementById('bw') as any).__vue_app__;
            const store = app.config.globalProperties.$store;
            const lib = store.library;
            const list = lib.getListById(lib.defaultListId);
            const items = [];
            for (const catId of list.categoryIds) {
                const cat = lib.getCategoryById(catId);
                for (const ci of cat.categoryItems) {
                    const item = lib.getItemById(ci.itemId);
                    items.push({
                        name: item.name,
                        url: item.url,
                        price: item.price,
                        worn: ci.worn,
                        consumable: ci.consumable,
                    });
                }
            }
            return items;
        });

        // Tent: url set, price 350, worn, not consumable
        const tent = storeData.find((i: any) => i.name === 'Tent');
        expect(tent.url).toBe('https://example.com/tent');
        expect(tent.price).toBe(350);
        expect(tent.worn).toBeTruthy();
        expect(tent.consumable).toBeFalsy();

        // Water Filter: url set, price 35, not worn, consumable
        const filter = storeData.find((i: any) => i.name === 'Water Filter');
        expect(filter.url).toBe('https://example.com/filter');
        expect(filter.price).toBe(35);
        expect(filter.worn).toBeFalsy();
        expect(filter.consumable).toBeTruthy();

        // Rain Jacket: no url, price 200, worn, not consumable
        const jacket = storeData.find((i: any) => i.name === 'Rain Jacket');
        expect(jacket.url).toBe('');
        expect(jacket.price).toBe(200);
        expect(jacket.worn).toBeTruthy();
        expect(jacket.consumable).toBeFalsy();
    });
});
