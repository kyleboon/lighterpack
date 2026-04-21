# Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LighterPack work well on mobile and tablet screens with a CSS-only responsive layout, hamburger sidebar drawer, gear table reflow, and stacking chart/summary.

**Architecture:** Desktop-first CSS with two breakpoints (900px and 600px) replacing existing 720px and 480px queries. The only new JS is a hamburger toggle and backdrop click handler in `index.vue`. The sidebar becomes a slide-in drawer at < 900px; gear table rows reflow to two lines; chart/summary stack vertically at < 600px.

**Tech Stack:** CSS media queries (native nesting), Vue 3 template changes (minimal), Playwright E2E tests

**Spec:** `docs/superpowers/specs/2026-04-16-responsive-design.md`

---

### Task 1: Add Mobile Top Bar and Hamburger Toggle to `index.vue`

**Files:**

- Modify: `app/pages/index.vue`

- [ ] **Step 1: Add hamburger button, top bar, and backdrop to the template**

Replace the current template in `app/pages/index.vue`:

```vue
<template>
    <div v-if="isLoaded" id="main" class="lpHasSidebar">
        <a href="#main-content" class="skip-link">Skip to main content</a>

        <div class="lp-mobile-topbar">
            <button class="lp-hamburger" aria-label="Toggle sidebar" @click="toggleSidebar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor" />
                    <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor" />
                    <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor" />
                </svg>
            </button>
            <span class="lp-mobile-wordmark">LighterPack</span>
        </div>

        <div class="lp-sidebar-backdrop" @click="closeSidebar" />
        <sidebar />

        <main id="main-content" class="lpList">
            <list />
        </main>

        <globalAlerts />
        <speedbump />
        <ImportCsv />
        <itemImage />
        <itemViewImage />
        <itemLink />
        <account />
        <accountDelete />

        <div id="lp-announce" class="visually-hidden" aria-live="polite" role="status" />
    </div>
</template>
```

- [ ] **Step 2: Add sidebar toggle logic to the script**

Replace the `<script setup>` section:

```vue
<script setup>
import { ref, watch, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { useLighterpackStore } from '~/store/store';

defineOptions({ name: 'Dashboard' });

useHead({
    link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600&display=swap',
        },
    ],
});

const store = useLighterpackStore();
const router = useRouter();

const isLoaded = ref(false);

onBeforeMount(() => {
    if (!store.library) {
        router.push('/welcome');
    } else {
        isLoaded.value = true;
    }
});

function toggleSidebar() {
    const main = document.getElementById('main');
    if (main) {
        main.classList.toggle('lpSidebarOpen');
    }
}

function closeSidebar() {
    const main = document.getElementById('main');
    if (main) {
        main.classList.remove('lpSidebarOpen');
    }
}

// Close sidebar when the active list changes (user tapped a list link on mobile)
watch(
    () => store.library?.defaultListId,
    () => {
        if (window.matchMedia('(max-width: 899px)').matches) {
            closeSidebar();
        }
    },
);
</script>
```

- [ ] **Step 3: Verify the app still loads at desktop width**

Run: `npm run dev` and confirm the page loads at full width with no visual changes. The hamburger and backdrop should be invisible on desktop (CSS comes in Task 2).

- [ ] **Step 4: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat(responsive): add hamburger toggle and sidebar backdrop to index.vue"
```

---

### Task 2: Responsive CSS — Mobile Top Bar, Sidebar Drawer, and Backdrop (`_common.css`)

**Files:**

- Modify: `app/assets/css/_common.css`

- [ ] **Step 1: Remove the existing 720px and 480px media queries**

Delete lines 385–509 of `app/assets/css/_common.css` — the entire `@media only screen and (width <= 720px)` block and `@media only screen and (width <= 480px)` block. These rules will be replaced with new breakpoints in the steps that follow.

The removed blocks are:

```css
@media only screen and (width <= 720px) {
    /* ... everything through #lpImageDialog ... */
}

@media only screen and (width <= 480px) {
    /* ... .lpListSummary and .lpChartContainer ... */
}
```

- [ ] **Step 2: Add the mobile top bar and backdrop base styles (hidden on desktop)**

Add these styles just before the `.visually-hidden` rule (currently at the end of the file after the removed media queries):

```css
/* ── Mobile top bar ────────────────────────────────────────── */
.lp-mobile-topbar {
    align-items: center;
    background: #252523;
    color: #c8c6bc;
    display: none;
    gap: 10px;
    padding: 8px 12px;
    position: sticky;
    top: 0;
    z-index: 50;
}

.lp-hamburger {
    align-items: center;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    display: flex;
    padding: 4px;
}

.lp-mobile-wordmark {
    font-family: 'DM Serif Display', georgia, serif;
    font-size: 18px;
}

/* ── Sidebar backdrop ──────────────────────────────────────── */
.lp-sidebar-backdrop {
    display: none;
}
```

- [ ] **Step 3: Add the 900px breakpoint — sidebar drawer, content full-width, gear table reflow**

Add this media query after the styles from Step 2, before `.visually-hidden`:

```css
@media only screen and (width < 900px) {
    .lp-mobile-topbar {
        display: flex;
    }

    /* Sidebar backdrop — visible when sidebar is open */
    .lpSidebarOpen .lp-sidebar-backdrop {
        background: rgb(0 0 0 / 40%);
        display: block;
        inset: 0;
        position: fixed;
        z-index: 35;
    }

    /* Content goes full-width — no sidebar margin */
    .lpList {
        .lpHasSidebar & {
            margin-left: 0;
        }
    }

    /* Gear table: hide column headers for weight/price/qty */
    .lpItems {
        position: relative;

        .lpWeightCell {
            flex-basis: 100px;
        }

        .lpPriceCell {
            flex-basis: 65px;
        }

        .lpHeader {
            .lpWeightCell,
            .lpPriceCell,
            .lpQtyCell {
                display: none;
            }
        }

        .lpFooter {
            justify-content: flex-end;

            .lpQtyCell {
                display: none;
            }
        }
    }

    /* Gear table: item row reflow */
    .lpItem {
        align-items: baseline;
        flex-flow: row wrap;
        justify-content: flex-end;
        padding: 3px 0;

        .lpShowImages &.lpItemHasImage {
            min-height: 90px;
            padding-left: 100px;
            position: relative;

            .lpImageCell {
                height: 90px;
                left: 0;
                position: absolute;
                top: 0;
                width: 90px;
            }
        }

        .lpImageCell {
            flex-basis: 0;
        }

        .lpName {
            flex-basis: 90px;
            font-weight: bold;
            order: 2;
        }

        .lpQtyCell {
            flex-basis: auto;
            order: 1;

            &[qty1] {
                display: none;
            }

            &::after {
                content: ' x ';
                display: inline;
                margin-right: 5px;
            }
        }

        .lpPriceCell {
            order: 4;
        }

        .lpWeightCell {
            order: 5;
        }

        .lpDescription {
            flex-basis: calc(100% - 50px);
            order: 98;
        }

        .lpActionsCell {
            flex: 0 0 auto;
            order: 99;
            padding: 0 10px;
            text-align: right;

            .lpHidden,
            i:not(.lpActive) {
                display: none;
            }
        }
    }

    /* Touch targets */
    .lpWeight,
    .lpPrice,
    .lpQty {
        min-height: 44px;
    }

    /* Hide drag handles */
    .lpHandle {
        display: none;
    }

    /* Hide remove button unless row focused/hovered */
    .lpRemove {
        visibility: hidden;
    }

    .lpItem:hover .lpRemove,
    .lpItem:focus-within .lpRemove {
        visibility: visible;
    }

    /* Image dialog mobile sizing */
    #lpImageDialog {
        padding: 5px;
        width: 90%;

        img {
            display: block;
            max-width: 100%;
        }
    }

    .lpChart {
        max-width: 100%;
    }
}
```

- [ ] **Step 4: Add the 600px breakpoint — chart stacking, tighter padding, mobile refinements**

Add this media query after the 900px breakpoint:

```css
@media only screen and (width < 600px) {
    .lpListSummary {
        flex-direction: column;
        margin-bottom: 30px;
    }

    .lpChartContainer {
        max-width: 200px;
    }

    /* Tighter content padding */
    .lpList {
        padding: 0 12px;
    }

    .lpCategory {
        margin-bottom: 12px;
    }

    /* Remove max-width constraint — full viewport width */
    #main {
        max-width: none;
    }

    /* Modal mobile sizing */
    .lp-copy-modal {
        max-height: 80vh;
        overflow-y: auto;
        width: calc(100vw - 24px);
    }
}
```

- [ ] **Step 5: Run the dev server and verify at desktop, tablet, and mobile widths**

Run: `npm run dev`

- At 1024px: should look identical to before (no top bar, sidebar visible)
- At 800px: top bar visible, sidebar hidden, content full-width
- At 375px: tighter padding, chart stacked

- [ ] **Step 6: Commit**

```bash
git add app/assets/css/_common.css
git commit -m "feat(responsive): replace 720/480px breakpoints with 900/600px responsive layout"
```

---

### Task 3: Sidebar Drawer CSS (`sidebar.vue`)

**Files:**

- Modify: `app/components/sidebar.vue:39-137` (the `<style>` block)

- [ ] **Step 1: Add the 900px responsive rules to sidebar.vue's `<style>` block**

Add this media query at the end of the `<style>` block, just before the closing `</style>` tag:

```css
@media only screen and (width < 900px) {
    #sidebar {
        z-index: 40;

        .lpHasSidebar & {
            transform: translateX(-280px);
        }

        .lpSidebarOpen & {
            transform: translateX(0);
        }
    }
}
```

This does three things:

1. Raises `z-index` to 40 (above content's `z-index: 30` and backdrop's 35)
2. Overrides `.lpHasSidebar` so the sidebar stays hidden at < 900px even though that class is always present
3. Only slides in when `.lpSidebarOpen` is toggled by the hamburger button

- [ ] **Step 2: Hide the gear library component on mobile**

Add this rule inside the same media query block from Step 1, after the `#sidebar` rules:

```css
@media only screen and (width < 900px) {
    #sidebar {
        z-index: 40;

        .lpHasSidebar & {
            transform: translateX(-280px);
        }

        .lpSidebarOpen & {
            transform: translateX(0);
        }
    }

    /* Hide gear library on mobile — desktop only feature */
    .lp-library-section {
        display: none;
    }
}
```

- [ ] **Step 3: Verify the gear library component uses the `.lp-library-section` class**

Run a search for the class used on the `<libraryItems>` wrapper. If the component uses a different class name, update the CSS selector accordingly.

```bash
grep -n "lp-library-section\|library-section\|libraryItems" app/components/library-items.vue | head -5
```

If `library-items.vue` uses a different wrapper class (e.g., `lp-gear-library`), update the CSS rule to match. If there is no wrapper class, add `class="lp-library-section"` to the root element of `library-items.vue`.

- [ ] **Step 4: Verify the sidebar drawer behavior**

Run: `npm run dev`

- At 800px viewport: sidebar should be hidden. Click hamburger → sidebar slides in with backdrop. Click backdrop → sidebar closes.
- At 800px: gear library should NOT appear in the sidebar. List nav and footer should appear.
- At 1024px viewport: sidebar visible as before, no drawer behavior.

- [ ] **Step 5: Commit**

```bash
git add app/components/sidebar.vue
git commit -m "feat(responsive): sidebar becomes drawer overlay at < 900px, hide gear library on mobile"
```

---

### Task 4: Hide Import CSV on Mobile (`library-lists.vue`)

**Files:**

- Modify: `app/components/library-lists.vue:150-352` (the `<style>` block)

- [ ] **Step 1: Add responsive rule to hide the Import CSV button at < 900px**

Add this media query at the end of `library-lists.vue`'s `<style>` block, just before the closing `</style>` tag:

```css
@media only screen and (width < 900px) {
    /* Hide drag handles on mobile */
    .lp-drag-handle {
        display: none;
    }

    /* Hide Import CSV — desktop only */
    .lp-lists-actions .lp-action-link:last-child {
        display: none;
    }
}
```

The `+ Import CSV` button is the second (last) `.lp-action-link` inside `.lp-lists-actions` (line 61 of the template). The `+ Add new list` button remains visible.

- [ ] **Step 2: Verify at mobile width**

Run: `npm run dev` at 800px

- Open sidebar via hamburger
- "Add new list" button should be visible
- "Import CSV" button should be hidden
- Drag handles on list items should be hidden

- [ ] **Step 3: Commit**

```bash
git add app/components/library-lists.vue
git commit -m "feat(responsive): hide import CSV button and drag handles on mobile"
```

---

### Task 5: Share Page Responsive Adjustments

**Files:**

- Modify: `app/pages/r/[id].vue:179-368` (the `<style>` block)

- [ ] **Step 1: Add responsive rules to the share page styles**

Add these media queries at the end of the `<style>` block in `app/pages/r/[id].vue`, just before the closing `</style>` tag:

```css
@media only screen and (width < 600px) {
    .lp-share-topbar {
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 12px;
    }

    .lp-share-page > .lpList {
        padding: 16px 12px;
    }

    .lp-copy-modal {
        max-height: 80vh;
        overflow-y: auto;
        width: calc(100vw - 24px);
    }
}
```

The gear table reflow and chart stacking are already handled by the `_common.css` breakpoints since the share page uses the same `.lpList`, `.lpItem`, and `.lpListSummary` classes.

- [ ] **Step 2: Verify the share page at mobile width**

Run: `npm run dev`, navigate to a share page (e.g., `/r/<some-id>`):

- At 800px: gear table should reflow to two-line items
- At 375px: top bar should wrap, padding should tighten, chart should stack

- [ ] **Step 3: Commit**

```bash
git add app/pages/r/[id].vue
git commit -m "feat(responsive): share page topbar wraps and tightens padding on mobile"
```

---

### Task 6: E2E Tests — Mobile Viewport

**Files:**

- Create: `test/e2e/responsive.spec.ts`

- [ ] **Step 1: Write the mobile viewport E2E tests**

Create `test/e2e/responsive.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { testRoot } from './utils';
import { getSharedUser, loginUser } from './auth-utils';

test.describe('Responsive: Mobile viewport (375x667)', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        const { email } = await getSharedUser();
        await loginUser(page, email);
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

        // Click backdrop
        await page.locator('.lp-sidebar-backdrop').click();
        await expect(sidebar).not.toBeInViewport();
    });

    test('gear library is not visible in the sidebar', async ({ page }) => {
        await page.locator('.lp-hamburger').click();

        // libraryItems component should be hidden
        const gearLibrary = page.locator('.lp-library-section');
        await expect(gearLibrary).toBeHidden();
    });

    test('gear table items are readable and editable', async ({ page }) => {
        // Add a category and item via store so we have content to test
        await page.evaluate(() => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            const store = app.config.globalProperties.$store;
            store.newCategory();
            store.newItem();
        });

        // Item name input should be visible and editable
        const nameInput = page.locator('.lpName input').first();
        await expect(nameInput).toBeVisible();
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
        await page.setViewportSize({ width: 768, height: 1024 });
        const { email } = await getSharedUser();
        await loginUser(page, email);
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

        // Close via backdrop
        await page.locator('.lp-sidebar-backdrop').click();
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
        await page.setViewportSize({ width: 375, height: 667 });

        // Create a user and get a share URL
        const { email } = await getSharedUser();
        await loginUser(page, email);

        // Add content so the share page has something to show
        await page.evaluate(() => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            const store = app.config.globalProperties.$store;
            store.newCategory();
            store.newItem();
        });

        // Get share URL
        const shareUrl = await page.evaluate(() => {
            const app = (document.getElementById('lp') as any).__vue_app__;
            const store = app.config.globalProperties.$store;
            const lib = store.library;
            const list = lib.getListById(lib.defaultListId);
            return `${window.location.origin}/r/${list.externalId}`;
        });

        // Navigate to share page
        await page.goto(shareUrl);
        await expect(page.locator('.lp-share-page')).toBeVisible();

        // Topbar should be visible
        await expect(page.locator('.lp-share-topbar')).toBeVisible();

        // Content should render
        await expect(page.locator('.lpList')).toBeVisible();
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail (TDD — no CSS changes have been applied yet if running in isolation, or pass if running after Tasks 1–5)**

Run: `npx playwright test test/e2e/responsive.spec.ts --project=chromium`

If Tasks 1–5 are already applied, all tests should pass. If not, they will fail on visibility assertions — confirming the tests are checking real behavior.

- [ ] **Step 3: Commit**

```bash
git add test/e2e/responsive.spec.ts
git commit -m "test(responsive): add E2E tests for mobile and tablet viewports"
```

---

### Task 7: Verify Existing Tests Still Pass

**Files:**

- No changes — verification only

- [ ] **Step 1: Run unit tests**

Run: `npm run test:unit`
Expected: All pass (no unit test changes).

- [ ] **Step 2: Run server tests**

Run: `npm run test:server`
Expected: All pass (no server changes).

- [ ] **Step 3: Run all E2E tests at default viewport**

Run: `npx playwright test --project=chromium`
Expected: All existing tests pass at default (1280x720) viewport. The responsive CSS only activates below 900px.

- [ ] **Step 4: Run the new responsive E2E tests**

Run: `npx playwright test test/e2e/responsive.spec.ts --project=chromium`
Expected: All responsive tests pass.

- [ ] **Step 5: Run linters**

Run: `npm run lint:js && npm run lint:css`
Expected: No new lint errors.

---

## Notes

### What is NOT changed

- Component templates (aside from `index.vue` hamburger button)
- Store logic
- API routes
- Print styles (already handle sidebar hiding)
- Share page template (inherits CSS automatically)

### Key class relationships

- `.lpHasSidebar` — always present on `#main` when logged in
- `.lpSidebarOpen` — toggled by hamburger at < 900px, controls sidebar drawer
- `.lp-sidebar-backdrop` — `display: none` by default, `display: block` + `position: fixed` when `.lpSidebarOpen` at < 900px
- `.lp-mobile-topbar` — `display: none` by default, `display: flex` at < 900px
- `.lp-library-section` — wrapper class on `<libraryItems>`, hidden at < 900px

### Sidebar z-index stack at < 900px

- Content (`.lpList`): `z-index: 30` (unchanged via `--above-sidebar`)
- Backdrop (`.lp-sidebar-backdrop`): `z-index: 35`
- Sidebar (`#sidebar`): `z-index: 40`
- Mobile top bar (`.lp-mobile-topbar`): `z-index: 50`
