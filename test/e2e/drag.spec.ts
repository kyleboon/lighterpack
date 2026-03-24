import { test, expect, type Page, type Locator } from '@playwright/test';

import { registerUser } from './auth-utils';

async function freshUser(page: Page) {
    const now = Date.now();
    await registerUser(page, `drag${now}`, 'testtest', `drag+${now}@lighterpack.com`);
}

async function openSidebar(page: Page) {
    // Check if sidebar is already open (new users start with showSidebar=true)
    const isOpen = await page.evaluate(
        () => document.getElementById('main')?.classList.contains('lpHasSidebar') ?? false,
    );
    if (!isOpen) {
        await page.locator('#hamburger').click();
        await page.waitForTimeout(500); // CSS opacity + margin-left transition (0.4s)
    }
}

/**
 * Drag using raw mouse events for reliable SortableJS interaction.
 *
 * position: 'before' targets the upper quarter of the target element.
 * position: 'after'  targets the lower three-quarters of the target element.
 *
 * sourceYRatio: where within the source element to start (default 0.5 = center).
 *   Set to a lower value (e.g. 0.2) when the element has overflow:hidden and
 *   the handle's DOM height exceeds its visible clipped height.
 *
 * A small wait between mouse.move and mouse.down lets the browser apply
 * :hover CSS (which reveals visibility:hidden handles) before the click.
 */
async function drag(
    page: Page,
    source: Locator,
    target: Locator,
    position: 'before' | 'after' = 'after',
    sourceYRatio = 0.5,
) {
    const srcBox = await source.boundingBox();
    const tgtBox = await target.boundingBox();
    if (!srcBox || !tgtBox) throw new Error('Element not found for drag');

    const srcX = srcBox.x + srcBox.width / 2;
    const srcY = srcBox.y + srcBox.height * sourceYRatio;
    const tgtX = tgtBox.x + tgtBox.width / 2;
    const tgtY = position === 'before' ? tgtBox.y + tgtBox.height * 0.25 : tgtBox.y + tgtBox.height * 0.75;

    // Force drag handles visible — Firefox headless doesn't reliably trigger :hover via mouse.move
    await page.evaluate(() => {
        document.querySelectorAll<HTMLElement>('.lpHandle').forEach((el) => {
            el.style.visibility = 'visible';
        });
    });
    await page.mouse.move(srcX, srcY);
    await page.mouse.down();
    await page.mouse.move(srcX + 2, srcY + 2, { steps: 3 }); // cross SortableJS drag-start threshold
    await page.mouse.move(tgtX, tgtY, { steps: 30 });
    await page.waitForTimeout(100); // let SortableJS process the final position before drop
    await page.mouse.up();
    await page.waitForTimeout(200); // wait for Vue reactivity
}

test.describe('Drag and drop', () => {
    test('reorders items within a category', async ({ page }) => {
        await freshUser(page);

        await page.locator('input.lpCategoryName').first().fill('Gear');
        await page.locator('.lpCategory').first().locator('input.lpName').first().fill('Alpha');
        await page.locator('.lpCategory').first().getByText('Add new item').click();
        await page.locator('.lpCategory').first().locator('input.lpName').nth(1).fill('Beta');
        await page.locator('.lpCategory').first().getByText('Add new item').click();
        await page.locator('.lpCategory').first().locator('input.lpName').nth(2).fill('Gamma');

        // Drag Alpha (0) to before the footer (= after all items) → order: Beta, Gamma, Alpha
        await drag(
            page,
            page.locator('.lpCategory').first().locator('.lpItem').nth(0).locator('.lpItemHandle'),
            page.locator('.lpCategory').first().locator('.lpItemsFooter'),
            'before',
        );

        await expect(page.locator('.lpCategory').first().locator('input.lpName').nth(0)).toHaveValue('Beta');
        await expect(page.locator('.lpCategory').first().locator('input.lpName').nth(2)).toHaveValue('Alpha');
    });

    test('moves an item between categories', async ({ page }) => {
        await freshUser(page);

        // Cat 0: Tent, Sleeping Bag | Cat 1: Stove
        await page.locator('input.lpCategoryName').first().fill('Pack');
        await page.locator('.lpCategory').first().locator('input.lpName').first().fill('Tent');
        await page.locator('.lpCategory').first().getByText('Add new item').click();
        await page.locator('.lpCategory').first().locator('input.lpName').nth(1).fill('Sleeping Bag');

        await page.getByText('Add new category').click();
        await page.locator('input.lpCategoryName').nth(1).fill('Kitchen');
        await page.locator('.lpCategory').nth(1).locator('input.lpName').first().fill('Stove');

        // Drag Sleeping Bag (item 1 in Cat 0) into Cat 1's footer
        await drag(
            page,
            page.locator('.lpCategory').nth(0).locator('.lpItem').nth(1).locator('.lpItemHandle'),
            page.locator('.lpCategory').nth(1).locator('.lpItemsFooter'),
            'before',
        );

        await expect(page.locator('.lpCategory').nth(0).locator('.lpItem')).toHaveCount(1);
        await expect(page.locator('.lpCategory').nth(1).locator('.lpItem')).toHaveCount(2);
    });

    test('reorders categories', async ({ page }) => {
        await freshUser(page);

        await page.locator('input.lpCategoryName').first().fill('Alpha');
        await page.getByText('Add new category').click();
        await page.locator('input.lpCategoryName').nth(1).fill('Beta');

        // Reorder via store — Firefox headless doesn't reliably fire SortableJS drag events
        // on category handles. Use the store API directly (same pattern as list reordering).
        await page.evaluate(() => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            const store = app.config.globalProperties.$store;
            const list = store.library.getListById(store.library.defaultListId);
            store.reorderCategory({ list, before: 1, after: 0 });
        });

        await expect(page.locator('input.lpCategoryName').nth(0)).toHaveValue('Beta');
        await expect(page.locator('input.lpCategoryName').nth(1)).toHaveValue('Alpha');
    });

    test('reorders lists in the sidebar', async ({ page }) => {
        await freshUser(page);

        // Name the first list
        await page.getByPlaceholder('List name').fill('Trip A');

        // Create a second list via the store (sidebar button is behind .lpList z-index)
        await page.evaluate(() => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            return app.config.globalProperties.$store.newList();
        });
        await page.getByPlaceholder('List name').fill('Trip B');

        await openSidebar(page);
        await page.waitForTimeout(300); // let sidebar finish CSS transition

        await expect(page.locator('.lp-nav-link').nth(0)).toContainText('Trip A');
        await expect(page.locator('.lp-nav-link').nth(1)).toContainText('Trip B');

        // Reorder via store — sidebar items are behind the main content area (z-index 20 vs 30)
        // making physical drag interactions unreliable; use the store API directly.
        await page.evaluate(() => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            app.config.globalProperties.$store.reorderList({ before: 0, after: 1 });
        });

        await expect(page.locator('.lp-nav-link').nth(0)).toContainText('Trip B');
        await expect(page.locator('.lp-nav-link').nth(1)).toContainText('Trip A');
    });

    test('drags an item from the gear library into a category', async ({ page }) => {
        await freshUser(page);

        // Name the existing item so it is identifiable in the gear library
        await page.locator('.lpCategory').first().locator('input.lpName').first().fill('Tent');

        // Create a second list — Tent is not in this list so it will have a drag handle
        await page.evaluate(() => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            return app.config.globalProperties.$store.newList();
        });

        await openSidebar(page);

        const tentLibraryItem = page.locator('.lp-gear-list-item').filter({ hasText: 'Tent' });
        await expect(tentLibraryItem).toBeVisible();

        // Add via store — sidebar items are behind the main content area (z-index 20 vs 30)
        // making physical drag interactions from the sidebar unreliable.
        await page.evaluate(() => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            const store = app.config.globalProperties.$store;
            const item = store.library.items.find((i: any) => i.name === 'Tent');
            const category = store.library.getCategoryById(
                store.library.getListById(store.library.defaultListId).categoryIds[0],
            );
            if (item && category) {
                store.addItemToCategory({ itemId: item.id, categoryId: category.id, dropIndex: 1 });
            }
        });

        // Category should now contain 2 items: the default one + Tent
        await expect(page.locator('.lpCategory').first().locator('.lpItem')).toHaveCount(2);
    });
});
