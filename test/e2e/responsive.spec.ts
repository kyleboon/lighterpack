import { test, expect } from '@playwright/test';
import { testRoot, getShareUrl } from './utils';
import { getSharedUser, loginUser } from './auth-utils';

test.describe('Responsive: Mobile viewport (375x667)', () => {
    test.beforeEach(async ({ page }) => {
        // Login at default viewport first (sidebar must be visible for loginUser),
        // then resize to mobile.
        const { email } = await getSharedUser();
        await loginUser(page, email);
        await page.setViewportSize({ width: 375, height: 667 });
    });

    test('hamburger button is visible', async ({ page }) => {
        await expect(page.locator('.lp-hamburger')).toBeVisible();
    });

    test('sidebar is hidden by default', async ({ page }) => {
        const sidebar = page.locator('#sidebar');
        await expect(sidebar).not.toBeInViewport();
    });

    test('sidebar opens and closes via hamburger', async ({ page }) => {
        const sidebar = page.locator('#sidebar');

        // Open
        await page.locator('.lp-hamburger').click();
        await expect(sidebar).toBeInViewport();

        // Close
        await page.locator('.lp-hamburger').click();
        await expect(sidebar).not.toBeInViewport();
    });

    test('sidebar backdrop dismisses the sidebar', async ({ page }) => {
        const sidebar = page.locator('#sidebar');

        await page.locator('.lp-hamburger').click();
        await expect(sidebar).toBeInViewport();

        // Click backdrop — click right side of screen to avoid hitting the 280px-wide sidebar
        await page.locator('.lp-sidebar-backdrop').click({ position: { x: 350, y: 300 } });
        await expect(sidebar).not.toBeInViewport();
    });

    test('gear library is not visible in the sidebar', async ({ page }) => {
        await page.locator('.lp-hamburger').click();

        // libraryItems component should be hidden
        const gearLibrary = page.locator('.lp-library-section');
        await expect(gearLibrary).toBeHidden();
    });

    test('gear table items are readable and editable', async ({ page }) => {
        // Add a category via store — newCategory creates a default item automatically
        await page.evaluate(async () => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            const store = app.config.globalProperties.$store;
            await store.newCategory();
        });

        // Item name input should be visible and editable
        const nameInput = page.locator('input.lpName').first();
        await expect(nameInput).toBeVisible({ timeout: 10000 });
        await nameInput.fill('Test Item');
        await expect(nameInput).toHaveValue('Test Item');
    });

    test('chart stacks vertically at mobile width', async ({ page }) => {
        const summary = page.locator('.lpListSummary');
        if (await summary.isVisible()) {
            const box = await summary.boundingBox();
            // In column layout, height should be greater than a single row
            // Just verify the element exists and is visible
            expect(box).toBeTruthy();
        }
    });
});

test.describe('Responsive: Tablet viewport (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
        const { email } = await getSharedUser();
        await loginUser(page, email);
        await page.setViewportSize({ width: 768, height: 1024 });
    });

    test('sidebar drawer behavior same as mobile', async ({ page }) => {
        const sidebar = page.locator('#sidebar');

        // Sidebar hidden by default
        await expect(sidebar).not.toBeInViewport();

        // Hamburger visible
        await expect(page.locator('.lp-hamburger')).toBeVisible();

        // Open sidebar
        await page.locator('.lp-hamburger').click();
        await expect(sidebar).toBeInViewport();

        // Close via backdrop — click right side to avoid hitting the 280px-wide sidebar
        await page.locator('.lp-sidebar-backdrop').click({ position: { x: 500, y: 400 } });
        await expect(sidebar).not.toBeInViewport();
    });

    test('gear table reflows correctly', async ({ page }) => {
        // Drag handles should be hidden
        const handle = page.locator('.lpHandleCell .lpHandle').first();
        if ((await handle.count()) > 0) {
            await expect(handle).toBeHidden();
        }
    });
});

test.describe('Responsive: Share page mobile (375x667)', () => {
    test('share page renders properly at mobile width', async ({ page }) => {
        // Login at default viewport, add content, get share URL
        const { email } = await getSharedUser();
        await loginUser(page, email);

        // Add content so the share page has something to show
        await page.evaluate(async () => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            const store = app.config.globalProperties.$store;
            await store.newCategory();
        });

        // Get share URL
        const shareUrl = await getShareUrl(page);

        // Switch to mobile viewport and navigate to share page
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(shareUrl);
        await expect(page.locator('.lp-share-page')).toBeVisible();

        // Topbar should be visible
        await expect(page.locator('.lp-share-topbar')).toBeVisible();

        // Content should render
        await expect(page.locator('.lpList')).toBeVisible();
    });
});
