# List Actions Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the split share/export/copy-list UX with a single `⋯` icon button in the list header that opens a grouped dropdown menu containing all list-level actions.

**Architecture:** Delete `share.vue` and create a new `list-actions.vue` component that owns the ellipsis button, dropdown state, externalId generation, clipboard copy, and CSV export. Remove the "Copy a list" entry from the sidebar. All other components (`copy-list.vue`, `store.js`, `global-alerts.vue`) are unchanged.

**Tech Stack:** Vue 3.5, Pinia, Vitest + `@vue/test-utils`, existing `Popover` component, existing `fetchJson` utility, Navigator Clipboard API.

---

## File Map

| File                                         | Action     | Responsibility                                                                            |
| -------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `app/components/list-actions.vue`            | **Create** | `⋯` button + dropdown, externalId fetch, clipboard copy, CSV nav, copy-list modal trigger |
| `app/components/share.vue`                   | **Delete** | Replaced entirely by `list-actions.vue`                                                   |
| `app/components/list.vue`                    | **Modify** | Swap `<share />` for `<list-actions />`                                                   |
| `app/components/library-lists.vue`           | **Modify** | Remove `+ Copy a list` button and `copyList()` function                                   |
| `test/unit/components/list-actions.spec.js`  | **Create** | Unit tests for the new component                                                          |
| `test/unit/components/share.spec.js`         | **Delete** | Obsolete — covered by new spec file                                                       |
| `test/unit/components/library-lists.spec.js` | **Modify** | Remove the `copyList` test                                                                |

---

## Task 1: Remove `+ Copy a list` from the sidebar

**Files:**

- Modify: `app/components/library-lists.vue`
- Modify: `test/unit/components/library-lists.spec.js`

- [ ] **Step 1: Update the library-lists test — remove the `copyList` test**

    Open `test/unit/components/library-lists.spec.js` and delete the test at lines 65–72:

    ```js
    it('copyList calls store.showModal with "copyList"', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.showModal = vi.fn();
        const wrapper = mount(LibraryLists, { global: { stubs } });
        wrapper.vm.copyList();
        expect(store.showModal).toHaveBeenCalledWith('copyList');
    });
    ```

- [ ] **Step 2: Run the suite to confirm the test currently passes (baseline)**

    ```bash
    npm run test:unit -- --reporter=verbose test/unit/components/library-lists.spec.js
    ```

    Expected: all tests pass including `copyList`.

- [ ] **Step 3: Remove `copyList` from `library-lists.vue`**

    In `app/components/library-lists.vue`:
    1. Delete the button in the template (around line 46):

        ```html
        <button class="lp-action-link" @click="copyList">+ Copy a list</button>
        ```

    2. Delete the `copyList` function in `<script setup>` (around lines 105–107):
        ```js
        function copyList() {
            store.showModal('copyList');
        }
        ```

- [ ] **Step 4: Run the tests to confirm they still pass**

    ```bash
    npm run test:unit -- --reporter=verbose test/unit/components/library-lists.spec.js
    ```

    Expected: all remaining tests pass.

- [ ] **Step 5: Commit**

    ```bash
    git add app/components/library-lists.vue test/unit/components/library-lists.spec.js
    git commit -m "feat: remove copy-list action from sidebar"
    ```

---

## Task 2: Create `list-actions.vue` with the `⋯` button (no dropdown yet)

**Files:**

- Create: `app/components/list-actions.vue`
- Create: `test/unit/components/list-actions.spec.js`

The goal of this task is the button only — visible when signed in, hidden when not. No dropdown logic yet.

- [ ] **Step 1: Write the failing test**

    Create `test/unit/components/list-actions.spec.js`:

    ```js
    import { describe, it, expect, vi, beforeEach } from 'vitest';
    import { mount } from '@vue/test-utils';
    import { createPinia, setActivePinia } from 'pinia';
    import { useLighterpackStore } from '../../../app/store/store.js';
    import ListActions from '../../../app/components/list-actions.vue';

    vi.mock('../../../app/utils/utils.js', async (importOriginal) => {
        const actual = await importOriginal();
        return { ...actual, fetchJson: vi.fn() };
    });

    const PopoverStub = {
        template: '<div><slot name="target" /><slot name="content" /></div>',
    };

    describe('ListActions component', () => {
        beforeEach(() => setActivePinia(createPinia()));

        const stubs = { Popover: PopoverStub };

        function makeStore(overrides = {}) {
            const store = useLighterpackStore();
            store.loggedIn = 'alice';
            store.library = {
                defaultListId: 'list1',
                getListById: () => ({ id: 'list1', externalId: 'abc123' }),
            };
            Object.assign(store, overrides);
            return store;
        }

        it('renders nothing when not signed in', () => {
            const store = useLighterpackStore();
            store.loggedIn = null;
            store.library = {
                defaultListId: 'list1',
                getListById: () => ({ id: 'list1', externalId: '' }),
            };
            const wrapper = mount(ListActions, { global: { stubs } });
            expect(wrapper.find('button').exists()).toBe(false);
        });

        it('renders the ellipsis button when signed in', () => {
            makeStore();
            const wrapper = mount(ListActions, { global: { stubs } });
            const btn = wrapper.find('button.lp-btn');
            expect(btn.exists()).toBe(true);
            expect(btn.attributes('aria-label')).toBe('List actions');
        });
    });
    ```

- [ ] **Step 2: Run the test to confirm it fails**

    ```bash
    npm run test:unit -- --reporter=verbose test/unit/components/list-actions.spec.js
    ```

    Expected: FAIL — `list-actions.vue` does not exist yet.

- [ ] **Step 3: Create `list-actions.vue` with button only**

    Create `app/components/list-actions.vue`:

    ```vue
    <template>
        <div v-if="isSignedIn" class="lp-list-actions">
            <button
                class="lp-btn lp-btn-icon lp-list-actions-btn"
                :class="{ 'is-copied': copied }"
                aria-label="List actions"
                title="List actions"
                @click="toggleMenu"
            >
                <svg
                    v-if="!copied"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    stroke="none"
                    aria-hidden="true"
                >
                    <circle cx="3" cy="8" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="13" cy="8" r="1.5" />
                </svg>
                <svg
                    v-else
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d="M3 8l4 4 6-6" />
                </svg>
            </button>
        </div>
    </template>

    <script setup>
    import { ref, computed } from 'vue';
    import { useLighterpackStore } from '../store/store.js';

    defineOptions({ name: 'ListActions' });

    const store = useLighterpackStore();

    const menuOpen = ref(false);
    const copied = ref(false);

    const isSignedIn = computed(() => store.loggedIn);

    function toggleMenu() {
        menuOpen.value = !menuOpen.value;
    }
    </script>

    <style lang="scss">
    .lp-list-actions {
        position: relative;
    }

    .lp-list-actions-btn {
        &.is-copied {
            background-color: var(--amber-50);
            color: var(--amber-400);
        }
    }
    </style>
    ```

- [ ] **Step 4: Run the tests to confirm they pass**

    ```bash
    npm run test:unit -- --reporter=verbose test/unit/components/list-actions.spec.js
    ```

    Expected: PASS.

- [ ] **Step 5: Commit**

    ```bash
    git add app/components/list-actions.vue test/unit/components/list-actions.spec.js
    git commit -m "feat: add list-actions component with ellipsis button"
    ```

---

## Task 3: Wire `list-actions` into `list.vue`, remove `share`

**Files:**

- Modify: `app/components/list.vue`

- [ ] **Step 1: Swap `<share />` for `<list-actions />` in `list.vue`**

    In `app/components/list.vue`:
    1. Replace the import (around line 113):

        ```js
        // Remove:
        import share from './share.vue';
        // Add:
        import listActions from './list-actions.vue';
        ```

    2. Replace the usage in the template (around line 36):
        ```html
        <!-- Remove: -->
        <share />
        <!-- Add: -->
        <list-actions />
        ```

- [ ] **Step 2: Verify the unit test for `list.vue` still passes**

    ```bash
    npm run test:unit -- --reporter=verbose test/unit/components/list.spec.js
    ```

    Expected: all pass.

- [ ] **Step 3: Commit**

    ```bash
    git add app/components/list.vue
    git commit -m "feat: wire list-actions into list header"
    ```

---

## Task 4: Add the dropdown menu to `list-actions.vue`

**Files:**

- Modify: `app/components/list-actions.vue`
- Modify: `test/unit/components/list-actions.spec.js`

- [ ] **Step 1: Add tests for dropdown open/close behaviour**

    Append to the `describe` block in `test/unit/components/list-actions.spec.js`:

    ```js
    it('menu is closed by default', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        expect(wrapper.vm.menuOpen).toBe(false);
    });

    it('clicking the button opens the menu', async () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.find('button.lp-btn').trigger('click');
        expect(wrapper.vm.menuOpen).toBe(true);
    });

    it('clicking the button again closes the menu', async () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.find('button.lp-btn').trigger('click');
        await wrapper.find('button.lp-btn').trigger('click');
        expect(wrapper.vm.menuOpen).toBe(false);
    });

    it('closeMenu sets menuOpen to false', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        wrapper.vm.menuOpen = true;
        wrapper.vm.closeMenu();
        expect(wrapper.vm.menuOpen).toBe(false);
    });

    it('renders Copy this list menu item', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        expect(wrapper.text()).toContain('Copy this list');
    });

    it('renders Copy share link menu item', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        expect(wrapper.text()).toContain('Copy share link');
    });

    it('renders Export to CSV menu item', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        expect(wrapper.text()).toContain('Export to CSV');
    });
    ```

- [ ] **Step 2: Run to confirm the new tests fail**

    ```bash
    npm run test:unit -- --reporter=verbose test/unit/components/list-actions.spec.js
    ```

    Expected: new tests FAIL (no Popover, no menu items yet).

- [ ] **Step 3: Add the dropdown to `list-actions.vue`**

    Replace the full template and add the Popover import. Final `list-actions.vue`:

    ```vue
    <template>
        <div v-if="isSignedIn" class="lp-list-actions">
            <Popover id="list-actions" :shown="menuOpen" @hide="closeMenu">
                <template #target>
                    <button
                        class="lp-btn lp-btn-icon lp-list-actions-btn"
                        :class="{ 'is-copied': copied }"
                        aria-label="List actions"
                        title="List actions"
                        @click="toggleMenu"
                    >
                        <svg
                            v-if="!copied"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            stroke="none"
                            aria-hidden="true"
                        >
                            <circle cx="3" cy="8" r="1.5" />
                            <circle cx="8" cy="8" r="1.5" />
                            <circle cx="13" cy="8" r="1.5" />
                        </svg>
                        <svg
                            v-else
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M3 8l4 4 6-6" />
                        </svg>
                    </button>
                </template>
                <template #content>
                    <div class="lp-actions-menu">
                        <div class="lp-actions-menu-section-label">Share</div>
                        <button
                            class="lp-actions-menu-item"
                            :disabled="loading"
                            :aria-disabled="loading"
                            @click="copyShareLink"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7 4" />
                                <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L9 12" />
                            </svg>
                            Copy share link
                        </button>

                        <div class="lp-actions-menu-divider" />
                        <div class="lp-actions-menu-section-label">Export</div>
                        <button
                            class="lp-actions-menu-item"
                            :disabled="loading"
                            :aria-disabled="loading"
                            @click="exportCSV"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M8 2v9" />
                                <path d="M5 8l3 3 3-3" />
                                <path d="M3 13h10" />
                            </svg>
                            Export to CSV
                        </button>

                        <div class="lp-actions-menu-divider" />
                        <div class="lp-actions-menu-section-label">Manage</div>
                        <button class="lp-actions-menu-item" @click="copyList">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <rect x="2" y="4" width="10" height="10" rx="1" />
                                <path d="M5 4V3a1 1 0 011-1h7a1 1 0 011 1v10a1 1 0 01-1 1h-1" />
                            </svg>
                            Copy this list
                        </button>
                    </div>
                </template>
            </Popover>
        </div>
    </template>

    <script setup>
    import { ref, computed } from 'vue';
    import { useLighterpackStore } from '../store/store.js';
    import { fetchJson } from '../utils/utils.js';
    import Popover from './popover.vue';

    defineOptions({ name: 'ListActions' });

    const store = useLighterpackStore();

    const menuOpen = ref(false);
    const copied = ref(false);
    const loading = ref(false);

    const isSignedIn = computed(() => store.loggedIn);
    const library = computed(() => store.library);
    const list = computed(() => library.value.getListById(library.value.defaultListId));
    const baseUrl = computed(() => {
        const loc = window.location;
        return loc.origin || `${loc.protocol}//${loc.hostname}`;
    });

    function toggleMenu() {
        menuOpen.value = !menuOpen.value;
    }

    function closeMenu() {
        menuOpen.value = false;
    }

    async function ensureExternalId() {
        if (list.value.externalId) return list.value.externalId;
        loading.value = true;
        try {
            const response = await fetchJson('/api/external-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
            });
            store.setExternalId({ externalId: response.externalId, list: list.value });
            return response.externalId;
        } catch {
            store._showError('An error occurred while generating a share link. Please try again.');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function copyShareLink() {
        if (loading.value) return;
        closeMenu();
        const id = await ensureExternalId();
        if (!id) return;
        const url = `${baseUrl.value}/r/${id}`;
        try {
            await navigator.clipboard.writeText(url);
            copied.value = true;
            setTimeout(() => {
                copied.value = false;
            }, 2000);
        } catch {
            store._showError('Could not copy to clipboard. Please copy the link manually.');
        }
    }

    async function exportCSV() {
        if (loading.value) return;
        closeMenu();
        const id = await ensureExternalId();
        if (!id) return;
        window.open(`${baseUrl.value}/csv/${id}`, '_blank');
    }

    function copyList() {
        closeMenu();
        store.showModal('copyList');
    }
    </script>

    <style lang="scss">
    .lp-list-actions {
        position: relative;
    }

    .lp-list-actions-btn {
        &.is-copied {
            background-color: var(--amber-50);
            color: var(--amber-400);
        }
    }

    /* Right-align the dropdown panel so it doesn't overflow the viewport */
    #list-actions .lp-popover-content {
        left: auto;
        right: 0;
        transform: none;

        &::before {
            left: auto;
            margin-left: 0;
            right: 12px;
        }
    }

    #list-actions.is-shown .lp-popover-content {
        transform: none;
    }

    /* Menu content */
    .lp-actions-menu {
        display: flex;
        flex-direction: column;
        min-width: 190px;
        padding: 4px 0;
    }

    .lp-actions-menu-section-label {
        color: var(--charcoal-300);
        font-family: var(--font-ui);
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.06em;
        padding: 6px 12px 2px;
        text-transform: uppercase;
        user-select: none;
    }

    .lp-actions-menu-item {
        align-items: center;
        background: transparent;
        border: none;
        border-radius: var(--radius-md);
        color: var(--color-text-primary);
        cursor: pointer;
        display: flex;
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        gap: var(--space-2);
        margin: 0 4px;
        padding: 7px 8px;
        text-align: left;
        transition: background-color var(--transition-fast);
        width: calc(100% - 8px);

        &:hover {
            background-color: var(--stone-100);
        }

        &:focus-visible {
            outline: 2px solid var(--amber-400);
            outline-offset: 2px;
        }

        &:disabled,
        &[aria-disabled='true'] {
            color: var(--charcoal-300);
            cursor: not-allowed;
            pointer-events: none;
        }

        svg {
            color: var(--charcoal-300);
            flex-shrink: 0;
        }
    }

    .lp-actions-menu-divider {
        background: var(--stone-200);
        height: 1px;
        margin: 4px 12px;
    }
    </style>
    ```

- [ ] **Step 4: Run all list-actions tests**

    ```bash
    npm run test:unit -- --reporter=verbose test/unit/components/list-actions.spec.js
    ```

    Expected: all tests pass.

- [ ] **Step 5: Commit**

    ```bash
    git add app/components/list-actions.vue test/unit/components/list-actions.spec.js
    git commit -m "feat: add dropdown menu to list-actions component"
    ```

---

## Task 5: Add action behaviour tests (externalId, clipboard, copyList)

**Files:**

- Modify: `test/unit/components/list-actions.spec.js`

- [ ] **Step 1: Add behaviour tests**

    Append to the describe block:

    ```js
    it('copyList calls store.showModal with "copyList"', async () => {
        const store = makeStore();
        store.showModal = vi.fn();
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.vm.copyList();
        expect(store.showModal).toHaveBeenCalledWith('copyList');
    });

    it('copyList closes the menu', async () => {
        const store = makeStore();
        store.showModal = vi.fn();
        const wrapper = mount(ListActions, { global: { stubs } });
        wrapper.vm.menuOpen = true;
        await wrapper.vm.copyList();
        expect(wrapper.vm.menuOpen).toBe(false);
    });

    it('copyShareLink sets copied=true on success', async () => {
        makeStore();
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.vm.copyShareLink();
        expect(wrapper.vm.copied).toBe(true);
    });

    it('copyShareLink calls fetchJson when no externalId', async () => {
        const { fetchJson } = await import('../../../app/utils/utils.js');
        fetchJson.mockResolvedValueOnce({ externalId: 'newid' });
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = {
            defaultListId: 'list1',
            getListById: () => ({ id: 'list1', externalId: '' }),
        };
        store.setExternalId = vi.fn();
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.vm.copyShareLink();
        expect(fetchJson).toHaveBeenCalledWith('/api/external-id', expect.any(Object));
        expect(store.setExternalId).toHaveBeenCalledWith({ externalId: 'newid', list: expect.any(Object) });
    });

    it('exportCSV opens a new tab', async () => {
        makeStore();
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.vm.exportCSV();
        expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('/csv/abc123'), '_blank');
        openSpy.mockRestore();
    });

    it('loading state prevents re-entry', async () => {
        const { fetchJson } = await import('../../../app/utils/utils.js');
        // fetchJson never resolves — simulates an in-flight request
        fetchJson.mockImplementation(() => new Promise(() => {}));
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = {
            defaultListId: 'list1',
            getListById: () => ({ id: 'list1', externalId: '' }),
        };
        const wrapper = mount(ListActions, { global: { stubs } });
        wrapper.vm.copyShareLink(); // starts the fetch, sets loading = true
        expect(wrapper.vm.loading).toBe(true);
        // second call while loading should be a no-op
        const secondCall = wrapper.vm.copyShareLink();
        await secondCall;
        expect(fetchJson).toHaveBeenCalledTimes(1);
    });
    ```

- [ ] **Step 2: Run to confirm all tests pass**

    ```bash
    npm run test:unit -- --reporter=verbose test/unit/components/list-actions.spec.js
    ```

    Expected: all tests pass.

- [ ] **Step 3: Commit**

    ```bash
    git add test/unit/components/list-actions.spec.js
    git commit -m "test: add action behaviour tests for list-actions"
    ```

---

## Task 6: Delete `share.vue` and its test, run full suite

**Files:**

- Delete: `app/components/share.vue`
- Delete: `test/unit/components/share.spec.js`

- [ ] **Step 1: Delete the files**

    ```bash
    git rm app/components/share.vue test/unit/components/share.spec.js
    ```

- [ ] **Step 2: Run the full unit test suite**

    ```bash
    npm run test:unit
    ```

    Expected: all tests pass. If any test imports `share.vue` directly, fix the import.

- [ ] **Step 3: Run lint**

    ```bash
    npm run lint:js
    npm run lint:css
    ```

    Expected: no errors.

- [ ] **Step 4: Commit**

    ```bash
    git add -u
    git commit -m "feat: delete share.vue — replaced by list-actions"
    ```

---

## Task 7: Manual smoke test

Start the dev server and verify the feature end-to-end:

```bash
npm run dev
```

- [ ] Sign in and open a list
- [ ] Confirm the `⋯` button appears in the list header (right side)
- [ ] Confirm no "Share" button appears
- [ ] Confirm "Copy a list" is no longer in the sidebar
- [ ] Click `⋯` — dropdown should open with three sections (Share / Export / Manage)
- [ ] Click **Copy share link** — button should show a checkmark briefly; paste the clipboard into a browser tab and confirm the share URL is correct
- [ ] Click `⋯` → **Export to CSV** — should open the CSV download in a new tab
- [ ] Click `⋯` → **Copy this list** — the copy-list modal should open
- [ ] Click outside the dropdown — it should close
- [ ] Press Escape while the dropdown is open — it should close
- [ ] Sign out — confirm the `⋯` button is hidden
