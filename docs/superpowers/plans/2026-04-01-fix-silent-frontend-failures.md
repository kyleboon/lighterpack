# Fix Silent Frontend Failures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 13 silent `.catch(() => {})` blocks in the Pinia store with proper error handling — rollback + user-facing error toasts for settings, reload + error toast for sort order batches, and error-only toasts for secondary `opt_images` calls.

**Architecture:** All changes are in `app/store/store.js`. Each silent catch gets a handler that either (a) reverts the optimistic UI update and shows an error, (b) reloads the full library from the server and shows an error, or (c) just shows an error. Uses the existing `_showError()` and `_reloadLibrary()` methods — no new infrastructure needed.

**Tech Stack:** Vue 3, Pinia, existing `_showError()` / `_reloadLibrary()` store methods

---

## Task 1: Add rollback + error handling to `toggleSidebar`

**Files:**

- Modify: `app/store/store.js:147-152`

- [ ] **Step 1: Capture old value and add error handler**

Replace lines 147-152:

```javascript
toggleSidebar() {
    const old = this.library.showSidebar;
    this.library.showSidebar = !this.library.showSidebar;
    if (this.loggedIn) {
        this._api('PATCH', '/api/library', { show_sidebar: this.library.showSidebar ? 1 : 0 }).catch(() => {
            this.library.showSidebar = old;
            this._showError('Failed to save setting.');
        });
    }
},
```

- [ ] **Step 2: Run unit tests**

Run: `npm run test:unit`
Expected: All PASS (no tests directly test toggleSidebar; this verifies no regressions)

- [ ] **Step 3: Commit**

```bash
git add app/store/store.js
git commit -m "fix: add error handling to toggleSidebar in store"
```

---

## Task 2: Add rollback + error handling to `setDefaultList`

**Files:**

- Modify: `app/store/store.js:153-159`

- [ ] **Step 1: Capture old value and add error handler**

Replace lines 153-159:

```javascript
setDefaultList(list) {
    const oldId = this.library.defaultListId;
    this.library.defaultListId = list.id;
    this.library.getListById(this.library.defaultListId).calculateTotals();
    if (this.loggedIn) {
        this._api('PATCH', '/api/library', { default_list_id: list.id }).catch(() => {
            this.library.defaultListId = oldId;
            this.library.getListById(oldId).calculateTotals();
            this._showError('Failed to save setting.');
        });
    }
},
```

- [ ] **Step 2: Run unit tests**

Run: `npm run test:unit`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add app/store/store.js
git commit -m "fix: add error handling to setDefaultList in store"
```

---

## Task 3: Add rollback + error handling to `setTotalUnit`, `updateCurrencySymbol`, `updateItemUnit`

These three actions follow the same pattern: capture old value, set new value, PATCH, revert on failure.

**Files:**

- Modify: `app/store/store.js:160-196`

- [ ] **Step 1: Update `setTotalUnit` (lines 160-165)**

```javascript
setTotalUnit(unit) {
    const old = this.library.totalUnit;
    this.library.totalUnit = unit;
    if (this.loggedIn) {
        this._api('PATCH', '/api/library', { total_unit: unit }).catch(() => {
            this.library.totalUnit = old;
            this._showError('Failed to save setting.');
        });
    }
},
```

- [ ] **Step 2: Update `updateCurrencySymbol` (lines 185-190)**

```javascript
updateCurrencySymbol(currencySymbol) {
    const old = this.library.currencySymbol;
    this.library.currencySymbol = currencySymbol;
    if (this.loggedIn) {
        this._api('PATCH', '/api/library', { currency_symbol: currencySymbol }).catch(() => {
            this.library.currencySymbol = old;
            this._showError('Failed to save setting.');
        });
    }
},
```

- [ ] **Step 3: Update `updateItemUnit` (lines 191-196)**

```javascript
updateItemUnit(unit) {
    const old = this.library.itemUnit;
    this.library.itemUnit = unit;
    if (this.loggedIn) {
        this._api('PATCH', '/api/library', { item_unit: unit }).catch(() => {
            this.library.itemUnit = old;
            this._showError('Failed to save setting.');
        });
    }
},
```

- [ ] **Step 4: Run unit tests**

Run: `npm run test:unit`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add app/store/store.js
git commit -m "fix: add error handling to unit and currency settings in store"
```

---

## Task 4: Add rollback + error handling to `toggleOptionalField`

**Files:**

- Modify: `app/store/store.js:166-184`

- [ ] **Step 1: Capture old value and add error handler**

Replace lines 166-184:

```javascript
toggleOptionalField(optionalField) {
    const old = this.library.optionalFields[optionalField];
    this.library.optionalFields[optionalField] = !this.library.optionalFields[optionalField];
    this.library.getListById(this.library.defaultListId).calculateTotals();
    if (this.loggedIn) {
        const keyMap = {
            images: 'opt_images',
            price: 'opt_price',
            worn: 'opt_worn',
            consumable: 'opt_consumable',
            listDescription: 'opt_list_description',
        };
        const key = keyMap[optionalField];
        if (key) {
            this._api('PATCH', '/api/library', {
                [key]: this.library.optionalFields[optionalField] ? 1 : 0,
            }).catch(() => {
                this.library.optionalFields[optionalField] = old;
                this.library.getListById(this.library.defaultListId).calculateTotals();
                this._showError('Failed to save setting.');
            });
        }
    }
},
```

- [ ] **Step 2: Run unit tests**

Run: `npm run test:unit`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add app/store/store.js
git commit -m "fix: add error handling to toggleOptionalField in store"
```

---

## Task 5: Add reload + error handling to sort order batch updates

Three actions fire N parallel PATCH calls for reordering. Wrap each batch in `Promise.all()` so failures are caught.

**Files:**

- Modify: `app/store/store.js:262-269` (reorderList)
- Modify: `app/store/store.js:368-377` (reorderCategory)
- Modify: `app/store/store.js:438-447` (reorderItem — same-category branch)

- [ ] **Step 1: Update `reorderList` (lines 262-269)**

```javascript
reorderList(args) {
    this.library.lists = arrayMove(this.library.lists, args.before, args.after);
    if (this.loggedIn) {
        const patches = this.library.lists.map((list, index) =>
            this._api('PATCH', `/api/lists/${list.id}`, { sort_order: index }),
        );
        Promise.all(patches).catch(async () => {
            await this._reloadLibrary();
            this._showError('Failed to save list order.');
        });
    }
},
```

- [ ] **Step 2: Update `reorderCategory` (lines 368-377)**

```javascript
reorderCategory(args) {
    const list = this.library.getListById(args.list.id);
    list.categoryIds = arrayMove(list.categoryIds, args.before, args.after);
    this.library.getListById(this.library.defaultListId).calculateTotals();
    if (this.loggedIn) {
        const patches = list.categoryIds.map((catId, index) =>
            this._api('PATCH', `/api/categories/${catId}`, { sort_order: index }),
        );
        Promise.all(patches).catch(async () => {
            await this._reloadLibrary();
            this._showError('Failed to save category order.');
        });
    }
},
```

- [ ] **Step 3: Update `reorderItem` same-category branch (lines 438-447)**

Replace the `if (!isCrossCategory)` block (lines 438-447):

```javascript
if (!isCrossCategory) {
    dropCategory.categoryItems = arrayMove(dropCategory.categoryItems, oldIndex, args.dropIndex);
    this.library.getListById(this.library.defaultListId).calculateTotals();
    if (this.loggedIn) {
        const patches = dropCategory.categoryItems.map((ci, index) =>
            this._api('PATCH', `/api/categories/${dropCategory.id}/items/${ci.itemId}`, {
                sort_order: index,
            }),
        );
        Promise.all(patches).catch(async () => {
            await this._reloadLibrary();
            this._showError('Failed to save item order.');
        });
    }
}
```

- [ ] **Step 4: Run unit tests**

Run: `npm run test:unit`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add app/store/store.js
git commit -m "fix: add error handling to sort order batch updates in store"
```

---

## Task 6: Add error toast to `opt_images` fire-and-forget patches

Three places silently enable the images toggle after a successful image save. Add a minimal error toast — no rollback needed since the primary operation succeeded.

**Files:**

- Modify: `app/store/store.js:601` (updateItemImageUrl)
- Modify: `app/store/store.js:634` (uploadImage)
- Modify: `app/store/store.js:670` (addImageUrl)

- [ ] **Step 1: Update `updateItemImageUrl` (line 601)**

Replace:

```javascript
this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {});
```

With:

```javascript
this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {
    this._showError('Failed to enable images setting.');
});
```

- [ ] **Step 2: Update `uploadImage` (line 634)**

Replace:

```javascript
this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {});
```

With:

```javascript
this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {
    this._showError('Failed to enable images setting.');
});
```

- [ ] **Step 3: Update `addImageUrl` (line 670)**

Replace:

```javascript
this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {});
```

With:

```javascript
this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {
    this._showError('Failed to enable images setting.');
});
```

- [ ] **Step 4: Run unit tests**

Run: `npm run test:unit`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add app/store/store.js
git commit -m "fix: add error toast to opt_images enable calls in store"
```

---

## Task 7: Run full test suite and update README roadmap

- [ ] **Step 1: Run all tests**

Run: `npm run test:unit && npm run test:server`
Expected: All PASS

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test`
Expected: All PASS (error paths only trigger on API failure, not exercised in E2E)

- [ ] **Step 3: Run lint**

Run: `npm run lint:js`
Expected: No errors

- [ ] **Step 4: Update README roadmap**

In `README.md`, change:

```markdown
- [ ] Fix silent frontend failures — 15+ `.catch(() => {})` blocks in Pinia store swallow errors without user feedback
```

to:

```markdown
- [x] Fix silent frontend failures — 15+ `.catch(() => {})` blocks in Pinia store swallow errors without user feedback
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: mark silent frontend failures fix as complete in roadmap"
```

---

## Verification

After all tasks, confirm no silent catches remain (except the 2 intentional ones):

```bash
grep -n '\.catch(() => {})' app/store/store.js
```

Expected output — exactly 2 matches:

- Line 84: `signout()` — intentionally silent
- Line 805: `init()` / `_reloadLibrary` — intentionally silent
