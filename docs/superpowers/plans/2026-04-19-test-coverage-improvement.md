# Test Coverage Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase unit test coverage from 56% to ~75% and server test coverage from 63% to ~85% by testing the highest-impact gaps: the Pinia store, utility functions, server API handlers, and the `buildLibraryBlob` server utility.

**Architecture:** Tests follow existing project patterns — Vitest with `@vue/test-utils` for unit tests, in-memory SQLite + stubbed Nitro globals for server tests. No new test infrastructure needed. Each task targets one file/module with its own spec file.

**Tech Stack:** Vitest, Pinia, `@vue/test-utils`, Drizzle ORM (in-memory SQLite), vi.fn() / vi.mock()

---

## File Structure

| Action | File                                     | Responsibility                                                                    |
| ------ | ---------------------------------------- | --------------------------------------------------------------------------------- |
| Modify | `test/unit/store/store.spec.ts`          | Add store action tests (currently only tests `loadShareData`)                     |
| Create | `test/unit/utils/utils.spec.ts`          | Tests for `displayWeight`, `displayPrice`, `lpError`, `fetchJson`, window globals |
| Create | `test/unit/utils/csrf.spec.ts`           | Tests for `getCsrfToken`                                                          |
| Modify | `test/unit/utils/weight.spec.ts`         | Add missing edge cases for `MgToWeight` display mode and zero/invalid inputs      |
| Create | `test/server/account-delete.spec.ts`     | Full handler tests for `POST /api/account/delete`                                 |
| Create | `test/server/images-reorder.spec.ts`     | Full handler tests for `POST /api/images/reorder`                                 |
| Create | `test/server/images-url.spec.ts`         | Full handler tests for `POST /api/images/url`                                     |
| Create | `test/server/images-delete-full.spec.ts` | Full handler tests for `DELETE /api/images/[id]` (beyond auth guard)              |
| Create | `test/server/library-blob.spec.ts`       | Tests for `buildLibraryBlob` in `server/utils/library.ts`                         |

---

### Task 1: `getCsrfToken` utility tests

**Files:**

- Create: `test/unit/utils/csrf.spec.ts`
- Tested: `app/utils/csrf.ts`

- [ ] **Step 1: Write the tests**

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { getCsrfToken } from '../../../app/utils/csrf';

describe('getCsrfToken', () => {
    afterEach(() => {
        // Clear all cookies
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        });
    });

    it('returns the csrf_token cookie value', () => {
        document.cookie = 'csrf_token=abc123; path=/';
        expect(getCsrfToken()).toBe('abc123');
    });

    it('returns null when csrf_token cookie is not set', () => {
        expect(getCsrfToken()).toBeNull();
    });

    it('returns the correct token when multiple cookies exist', () => {
        document.cookie = 'other=value; path=/';
        document.cookie = 'csrf_token=xyz789; path=/';
        document.cookie = 'another=thing; path=/';
        expect(getCsrfToken()).toBe('xyz789');
    });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run test/unit/utils/csrf.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 3: Commit**

```bash
git add test/unit/utils/csrf.spec.ts
git commit -m "test: add unit tests for getCsrfToken utility"
```

---

### Task 2: `displayWeight`, `displayPrice`, and window globals tests

**Files:**

- Create: `test/unit/utils/utils.spec.ts`
- Tested: `app/utils/utils.ts`

- [ ] **Step 1: Write the tests**

```typescript
import { describe, it, expect } from 'vitest';
import { displayWeight, displayPrice } from '../../../app/utils/utils';

describe('displayWeight', () => {
    it('converts milligrams to the specified unit', () => {
        expect(displayWeight(28349.5, 'oz')).toBe(1);
    });

    it('returns 0 for zero milligrams', () => {
        expect(displayWeight(0, 'oz')).toBe(0);
    });

    it('returns 0 for an invalid unit', () => {
        expect(displayWeight(1000, 'invalid' as any)).toBe(0);
    });
});

describe('displayPrice', () => {
    it('formats price with symbol and two decimals', () => {
        expect(displayPrice(9.9, '$')).toBe('$9.90');
    });

    it('formats zero price', () => {
        expect(displayPrice(0, '$')).toBe('$0.00');
    });

    it('returns symbol + 0.00 for undefined price', () => {
        expect(displayPrice(undefined, '€')).toBe('€0.00');
    });

    it('uses the provided currency symbol', () => {
        expect(displayPrice(5, '£')).toBe('£5.00');
    });
});

describe('window globals', () => {
    it('exposes arrayMove on window', () => {
        expect(window.arrayMove).toBeTypeOf('function');
    });

    it('arrayMove reorders elements correctly', () => {
        const result = window.arrayMove(['a', 'b', 'c', 'd'], 0, 2);
        expect(result).toEqual(['b', 'c', 'a', 'd']);
    });

    it('arrayMove does not mutate the original array', () => {
        const original = [1, 2, 3];
        window.arrayMove(original, 0, 2);
        expect(original).toEqual([1, 2, 3]);
    });

    it('exposes getElementIndex on window', () => {
        expect(window.getElementIndex).toBeTypeOf('function');
    });

    it('exposes readCookie on window', () => {
        expect(window.readCookie).toBeTypeOf('function');
    });

    it('readCookie returns null for missing cookie', () => {
        expect(window.readCookie('nonexistent')).toBeNull();
    });

    it('exposes createCookie on window', () => {
        expect(window.createCookie).toBeTypeOf('function');
    });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run test/unit/utils/utils.spec.ts`
Expected: PASS (11 tests)

- [ ] **Step 3: Commit**

```bash
git add test/unit/utils/utils.spec.ts
git commit -m "test: add unit tests for displayWeight, displayPrice, and window globals"
```

---

### Task 3: `lpError` class tests

**Files:**

- Modify: `test/unit/utils/utils.spec.ts`
- Tested: `app/utils/utils.ts` (lpError class)

Note: `lpError` is not exported. It's used internally by `fetchJson`. We need to test it through `fetchJson` or by importing it if possible. Since `lpError` is not exported, we'll test its behavior indirectly through `fetchJson` in a later task. Instead, let's add the weight edge case tests here.

Skip this task — `lpError` is tested indirectly via `fetchJson` in Task 4.

---

### Task 4: `fetchJson` tests

**Files:**

- Modify: `test/unit/utils/utils.spec.ts`
- Tested: `app/utils/utils.ts` (fetchJson function)

- [ ] **Step 1: Write the tests (append to utils.spec.ts)**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { displayWeight, displayPrice, fetchJson } from '../../../app/utils/utils';

// Add at top of file — mock csrf module
vi.mock('../../../app/utils/csrf', () => ({
    getCsrfToken: vi.fn(() => null),
}));

// Add these describes after the existing ones:

describe('fetchJson', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchSpy = vi.fn();
        globalThis.fetch = fetchSpy;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('resolves with parsed JSON on success', async () => {
        fetchSpy.mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({ data: 'test' })),
        });
        const result = await fetchJson('/api/test');
        expect(result).toEqual({ data: 'test' });
    });

    it('sets Content-Type to application/json when no body', async () => {
        fetchSpy.mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve('{}'),
        });
        await fetchJson('/api/test');
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/test',
            expect.objectContaining({
                headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
            }),
        );
    });

    it('defaults to GET method', async () => {
        fetchSpy.mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve('{}'),
        });
        await fetchJson('/api/test');
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/test',
            expect.objectContaining({
                method: 'GET',
            }),
        );
    });

    it('rejects with lpError on non-ok response', async () => {
        fetchSpy.mockResolvedValue({
            ok: false,
            status: 500,
            text: () => Promise.resolve(JSON.stringify({ message: 'Server error' })),
        });
        await expect(fetchJson('/api/test')).rejects.toThrow('Server error');
    });

    it('navigates to /welcome on 401 response', async () => {
        fetchSpy.mockResolvedValue({
            ok: false,
            status: 401,
            text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
        });
        // navigateTo is mocked in test/unit/setup.ts — should not reject
        const result = await fetchJson('/api/test');
        expect(result).toBeUndefined();
    });

    it('rejects with default message on network failure', async () => {
        fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(fetchJson('/api/test')).rejects.toThrow('An error occurred, please try again later.');
    });

    it('injects CSRF token header when token exists', async () => {
        const { getCsrfToken } = await import('../../../app/utils/csrf');
        vi.mocked(getCsrfToken).mockReturnValue('test-token');

        fetchSpy.mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve('{}'),
        });
        await fetchJson('/api/test');
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/test',
            expect.objectContaining({
                headers: expect.objectContaining({ 'X-CSRF-Token': 'test-token' }),
            }),
        );
    });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run test/unit/utils/utils.spec.ts`
Expected: PASS (all tests)

- [ ] **Step 3: Commit**

```bash
git add test/unit/utils/utils.spec.ts
git commit -m "test: add fetchJson unit tests covering success, error, CSRF, and navigation"
```

---

### Task 5: Weight utility edge cases

**Files:**

- Modify: `test/unit/utils/weight.spec.ts`
- Tested: `shared/utils/weight.ts`

- [ ] **Step 1: Add missing test cases**

Append to the existing `MgToWeight` describe block in `test/unit/utils/weight.spec.ts`:

```typescript
it('returns 0 for an unknown unit', () => {
    expect(MgToWeight(1000, 'invalid' as any)).toBe(0);
});

it('returns 0 for zero milligrams', () => {
    expect(MgToWeight(0, 'g')).toBe(0);
});

it('formats pounds display with lbs and oz', () => {
    // 2.5 lb = 1,133,980 mg → "2lbs 8oz"
    expect(MgToWeight(1133980, 'lb', true)).toBe('2lbs 8oz');
});

it('formats pounds display with only oz when less than 1 lb', () => {
    // 0.5 lb = 226,796 mg → "8oz"
    expect(MgToWeight(226796, 'lb', true)).toBe('8oz');
});

it('formats pounds display with only lbs when oz is 0', () => {
    // Exactly 1 lb = 453,592 mg → "1lb"
    expect(MgToWeight(453592, 'lb', true)).toBe('1lb');
});

it('formats pounds display singular lb', () => {
    expect(MgToWeight(453592, 'lb', true)).toBe('1lb');
});

it('formats pounds display plural lbs', () => {
    // 2 lb = 907,184 mg → "2lbs"
    expect(MgToWeight(907184, 'lb', true)).toBe('2lbs');
});

it('formats 0 mg in display mode as 0oz', () => {
    expect(MgToWeight(0, 'lb', true)).toBe('0oz');
});
```

Also append to the `WeightToMg` describe block:

```typescript
it('returns 0 for an unknown unit', () => {
    expect(WeightToMg(1, 'invalid' as any)).toBe(0);
});

it('handles zero value', () => {
    expect(WeightToMg(0, 'g')).toBe(0);
    expect(WeightToMg(0, 'kg')).toBe(0);
    expect(WeightToMg(0, 'oz')).toBe(0);
    expect(WeightToMg(0, 'lb')).toBe(0);
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run test/unit/utils/weight.spec.ts`
Expected: PASS (all tests, including new edge cases)

- [ ] **Step 3: Commit**

```bash
git add test/unit/utils/weight.spec.ts
git commit -m "test: add weight util edge cases — display mode, zero, and invalid units"
```

---

### Task 6: Pinia store — session and data loading actions

**Files:**

- Modify: `test/unit/store/store.spec.ts`
- Tested: `app/store/store.ts` (signout, setLoggedIn, loadLibraryData, clearLibraryData, \_showError)

- [ ] **Step 1: Add imports and mock setup at top of file**

Add `vi` to the import and add `$fetch` mock:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store';

// Mock $fetch globally (Nuxt auto-import)
const mockFetch = vi.fn();
(globalThis as any).$fetch = mockFetch;
```

- [ ] **Step 2: Add session and data loading tests**

Append after the existing `loadShareData` describe block:

```typescript
describe('session actions', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockFetch.mockReset();
    });

    it('signout clears library and loggedIn state', () => {
        const store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [],
            categories: [],
            lists: [{ id: 1, name: 'List', categoryIds: [], externalId: 'abc', description: '', images: [] }],
        });
        store.loadLibraryData(blob);
        store.loggedIn = 'user@test.com';

        store.signout();

        expect(store.loggedIn).toBe(false);
        expect(store.library).toBeFalsy();
    });

    it('setLoggedIn sets the loggedIn state', () => {
        const store = useLighterpackStore();
        store.setLoggedIn('user@test.com');
        expect(store.loggedIn).toBe('user@test.com');
    });

    it('setLoggedIn can clear the logged in state', () => {
        const store = useLighterpackStore();
        store.setLoggedIn('user@test.com');
        store.setLoggedIn(false);
        expect(store.loggedIn).toBe(false);
    });
});

describe('loadLibraryData', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('loads a library from a plain object', () => {
        const store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [{ id: 1, name: 'Tent', weight: 1000, authorUnit: 'oz', price: 0, url: '', images: [] }],
            categories: [
                {
                    id: 2,
                    name: 'Shelter',
                    categoryItems: [{ itemId: 1, qty: 1, worn: 0, consumable: false, star: 0 }],
                    images: [],
                },
            ],
            lists: [{ id: 3, name: 'Trip', categoryIds: [2], externalId: 'abc', description: '', images: [] }],
            defaultListId: 3,
        });
        store.loadLibraryData(blob);
        expect(store.library).toBeTruthy();
        expect(store.library.items).toHaveLength(1);
        expect(store.library.items[0].name).toBe('Tent');
    });

    it('loads a library from a JSON string', () => {
        const store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [],
            categories: [],
            lists: [{ id: 1, name: 'List', categoryIds: [], externalId: 'abc', description: '', images: [] }],
        });
        store.loadLibraryData(JSON.stringify(blob));
        expect(store.library).toBeTruthy();
    });

    it('pushes alert on invalid data', () => {
        const store = useLighterpackStore();
        store.loadLibraryData('not valid json {{{');
        expect(store.globalAlerts).toHaveLength(1);
        expect(store.globalAlerts[0].message).toContain('error');
    });
});

describe('clearLibraryData', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('resets library to unloaded state', () => {
        const store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [],
            categories: [],
            lists: [{ id: 1, name: 'List', categoryIds: [], externalId: 'abc', description: '', images: [] }],
        });
        store.loadLibraryData(blob);
        expect(store.library).toBeTruthy();

        store.clearLibraryData();
        expect(store.library).toBeFalsy();
    });
});

describe('_showError', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('pushes the provided message as a global alert', () => {
        const store = useLighterpackStore();
        store._showError('Something went wrong');
        expect(store.globalAlerts).toHaveLength(1);
        expect(store.globalAlerts[0].message).toBe('Something went wrong');
    });

    it('uses default message for empty string', () => {
        const store = useLighterpackStore();
        store._showError('');
        expect(store.globalAlerts[0].message).toBe('An error occurred.');
    });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx vitest run test/unit/store/store.spec.ts`
Expected: PASS (all existing + new tests)

- [ ] **Step 4: Commit**

```bash
git add test/unit/store/store.spec.ts
git commit -m "test: add store tests for session, loadLibraryData, clearLibraryData, _showError"
```

---

### Task 7: Pinia store — activeList getter

**Files:**

- Modify: `test/unit/store/store.spec.ts`
- Tested: `app/store/store.ts` (activeList getter)

- [ ] **Step 1: Add getter tests**

```typescript
describe('activeList getter', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('returns null when library is not loaded', () => {
        const store = useLighterpackStore();
        expect(store.activeList).toBeNull();
    });

    it('returns the list matching defaultListId', () => {
        const store = useLighterpackStore();
        const blob = makeLibraryBlob({
            defaultListId: 2,
            items: [],
            categories: [],
            lists: [
                { id: 1, name: 'First', categoryIds: [], externalId: 'a', description: '', images: [] },
                { id: 2, name: 'Second', categoryIds: [], externalId: 'b', description: '', images: [] },
            ],
        });
        store.loadLibraryData(blob);
        expect(store.activeList).toBeTruthy();
        expect(store.activeList!.name).toBe('Second');
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run test/unit/store/store.spec.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add test/unit/store/store.spec.ts
git commit -m "test: add activeList getter tests"
```

---

### Task 8: Pinia store — library settings actions (offline mode)

**Files:**

- Modify: `test/unit/store/store.spec.ts`
- Tested: `app/store/store.ts` (toggleSidebar, setTotalUnit, updateCurrencySymbol, updateItemUnit, toggleOptionalField — offline paths)

- [ ] **Step 1: Add library settings tests**

```typescript
describe('library settings (offline)', () => {
    let store: ReturnType<typeof useLighterpackStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [],
            categories: [],
            lists: [{ id: 1, name: 'List', categoryIds: [], externalId: 'abc', description: '', images: [] }],
        });
        store.loadLibraryData(blob);
        // Ensure offline mode
        store.loggedIn = false;
    });

    it('toggleSidebar flips the showSidebar flag', () => {
        const before = store.library.showSidebar;
        store.toggleSidebar();
        expect(store.library.showSidebar).toBe(!before);
    });

    it('setTotalUnit updates the total unit', () => {
        store.setTotalUnit('kg');
        expect(store.library.totalUnit).toBe('kg');
    });

    it('updateCurrencySymbol updates the symbol', () => {
        store.updateCurrencySymbol('€');
        expect(store.library.currencySymbol).toBe('€');
    });

    it('updateItemUnit updates the item unit', () => {
        store.updateItemUnit('g');
        expect(store.library.itemUnit).toBe('g');
    });

    it('toggleOptionalField flips the field value', () => {
        const before = store.library.optionalFields.price;
        store.toggleOptionalField('price');
        expect(store.library.optionalFields.price).toBe(!before);
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run test/unit/store/store.spec.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add test/unit/store/store.spec.ts
git commit -m "test: add offline library settings action tests"
```

---

### Task 9: Pinia store — list management actions (offline mode)

**Files:**

- Modify: `test/unit/store/store.spec.ts`
- Tested: `app/store/store.ts` (newList, updateListName, removeList, setExternalId — offline paths)

- [ ] **Step 1: Add list management tests**

```typescript
describe('list management (offline)', () => {
    let store: ReturnType<typeof useLighterpackStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [{ id: 1, name: 'Tent', weight: 1000, authorUnit: 'oz', price: 0, url: '', images: [] }],
            categories: [
                {
                    id: 2,
                    name: 'Shelter',
                    categoryItems: [{ itemId: 1, qty: 1, worn: 0, consumable: false, star: 0 }],
                    images: [],
                },
            ],
            lists: [{ id: 3, name: 'Trip', categoryIds: [2], externalId: 'abc', description: '', images: [] }],
            defaultListId: 3,
            sequence: 100,
        });
        store.loadLibraryData(blob);
        store.loggedIn = false;
    });

    it('newList creates a new list with a category and item', async () => {
        const listCount = store.library.lists.length;
        await store.newList();
        expect(store.library.lists.length).toBe(listCount + 1);
    });

    it('newList sets the new list as default', async () => {
        const oldDefaultId = store.library.defaultListId;
        await store.newList();
        expect(store.library.defaultListId).not.toBe(oldDefaultId);
    });

    it('updateListName changes the list name', () => {
        store.updateListName({ id: 3, name: 'Weekend Trip' });
        expect(store.library.getListById(3).name).toBe('Weekend Trip');
    });

    it('removeList does nothing when only one list exists', () => {
        store.removeList({ id: 3 });
        expect(store.library.lists.length).toBe(1);
    });

    it('removeList removes the list when multiple lists exist', async () => {
        await store.newList();
        expect(store.library.lists.length).toBe(2);
        store.removeList({ id: 3 });
        expect(store.library.lists.length).toBe(1);
    });

    it('setExternalId sets the externalId on a list', () => {
        store.setExternalId({ list: { id: 3 }, externalId: 'new-id' });
        expect(store.library.getListById(3).externalId).toBe('new-id');
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run test/unit/store/store.spec.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add test/unit/store/store.spec.ts
git commit -m "test: add offline list management store action tests"
```

---

### Task 10: Pinia store — category management actions (offline mode)

**Files:**

- Modify: `test/unit/store/store.spec.ts`
- Tested: `app/store/store.ts` (newCategory, updateCategoryName, updateCategoryColor, removeCategory)

- [ ] **Step 1: Add category management tests**

```typescript
describe('category management (offline)', () => {
    let store: ReturnType<typeof useLighterpackStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [{ id: 1, name: 'Tent', weight: 1000, authorUnit: 'oz', price: 0, url: '', images: [] }],
            categories: [
                {
                    id: 2,
                    name: 'Shelter',
                    categoryItems: [{ itemId: 1, qty: 1, worn: 0, consumable: false, star: 0 }],
                    images: [],
                },
            ],
            lists: [{ id: 3, name: 'Trip', categoryIds: [2], externalId: 'abc', description: '', images: [] }],
            defaultListId: 3,
            sequence: 100,
        });
        store.loadLibraryData(blob);
        store.loggedIn = false;
    });

    it('newCategory adds a new category to the list', async () => {
        const list = store.library.getListById(3);
        const catCount = store.library.categories.length;
        await store.newCategory(list);
        expect(store.library.categories.length).toBe(catCount + 1);
    });

    it('updateCategoryName changes the category name', () => {
        store.updateCategoryName({ id: 2, name: 'Big Four' });
        expect(store.library.getCategoryById(2).name).toBe('Big Four');
    });

    it('updateCategoryColor sets the category color', () => {
        store.updateCategoryColor({ id: 2, color: { r: 255, g: 0, b: 0 } });
        expect(store.library.getCategoryById(2).color).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('removeCategory removes the category from the library', () => {
        const catCount = store.library.categories.length;
        store.removeCategory({ id: 2 });
        expect(store.library.categories.length).toBe(catCount - 1);
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run test/unit/store/store.spec.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add test/unit/store/store.spec.ts
git commit -m "test: add offline category management store action tests"
```

---

### Task 11: Pinia store — modal and UI actions

**Files:**

- Modify: `test/unit/store/store.spec.ts`
- Tested: `app/store/store.ts` (showModal, closeModal, initSpeedbump, confirmSpeedbump, closeSpeedbump, triggerImportCSV)

- [ ] **Step 1: Add modal/UI tests**

```typescript
describe('modal and UI actions', () => {
    let store: ReturnType<typeof useLighterpackStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useLighterpackStore();
    });

    it('showModal sets activeModal', () => {
        store.showModal('account');
        expect(store.activeModal).toBe('account');
    });

    it('closeModal clears activeModal', () => {
        store.showModal('account');
        store.closeModal();
        expect(store.activeModal).toBeNull();
    });

    it('initSpeedbump sets the speedbump state', () => {
        const callback = vi.fn();
        store.initSpeedbump(callback, { message: 'Are you sure?' });
        expect(store.speedbump).toBeTruthy();
        expect(store.speedbump!.callback).toBe(callback);
    });

    it('confirmSpeedbump calls callback with true and clears state', () => {
        const callback = vi.fn();
        store.initSpeedbump(callback);
        store.confirmSpeedbump();
        expect(callback).toHaveBeenCalledWith(true);
        expect(store.speedbump).toBeNull();
    });

    it('closeSpeedbump clears speedbump without calling callback', () => {
        const callback = vi.fn();
        store.initSpeedbump(callback);
        store.closeSpeedbump();
        expect(callback).not.toHaveBeenCalled();
        expect(store.speedbump).toBeNull();
    });

    it('triggerImportCSV increments the trigger counter', () => {
        const before = store.importCSVTrigger;
        store.triggerImportCSV();
        expect(store.importCSVTrigger).toBe(before + 1);
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run test/unit/store/store.spec.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add test/unit/store/store.spec.ts
git commit -m "test: add modal and UI action tests for the store"
```

---

### Task 12: Account delete handler — full coverage

**Files:**

- Create: `test/server/account-delete.spec.ts`
- Tested: `server/api/account/delete.post.ts`

- [ ] **Step 1: Write the tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initDb, getDb } from '../../server/db.js';
import * as schema from '../../server/schema.js';

// Stub Nitro auto-imports
(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; message: string; data?: any }) => {
    const err = new Error(opts.message) as Error & { statusCode: number; data?: any };
    err.statusCode = opts.statusCode;
    if (opts.data) err.data = opts.data;
    return err;
};
(globalThis as any).setResponseStatus = () => {};
(globalThis as any).getRequestURL = () => ({ pathname: '/api/account/delete' });

let readBodyValue: unknown;
(globalThis as any).readBody = () => Promise.resolve(readBodyValue);

function setBody(val: unknown) {
    readBodyValue = val;
}

describe('POST /api/account/delete', () => {
    let db: ReturnType<typeof getDb>;

    beforeEach(() => {
        db = initDb(':memory:');
        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();
    });

    async function callHandler(user: { id: string; email: string } | null, body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/account/delete.post.js');
        return mod.default({
            context: {
                user,
                logger: { info: () => {}, warn: () => {}, error: () => {} },
            },
        });
    }

    it('rejects unauthenticated requests with 401', async () => {
        await expect(callHandler(null, { email: 'a@test.com' })).rejects.toMatchObject({
            statusCode: 401,
        });
    });

    it('rejects when email does not match the user account', async () => {
        await expect(
            callHandler({ id: 'user-1', email: 'a@test.com' }, { email: 'wrong@test.com' }),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: 'Email does not match your account.',
        });
    });

    it('deletes the user account when email matches', async () => {
        const result = await callHandler({ id: 'user-1', email: 'a@test.com' }, { email: 'a@test.com' });
        expect(result).toEqual({ message: 'success' });

        // Verify user is deleted from DB
        const users = db.select().from(schema.user).all();
        expect(users).toHaveLength(0);
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run --config vitest.server.config.ts test/server/account-delete.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 3: Commit**

```bash
git add test/server/account-delete.spec.ts
git commit -m "test: add full handler tests for POST /api/account/delete"
```

---

### Task 13: Image reorder handler — full coverage

**Files:**

- Create: `test/server/images-reorder.spec.ts`
- Tested: `server/api/images/reorder.post.ts`

- [ ] **Step 1: Write the tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initDb, getDb } from '../../server/db.js';
import * as schema from '../../server/schema.js';

(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; message: string; data?: any }) => {
    const err = new Error(opts.message) as Error & { statusCode: number; data?: any };
    err.statusCode = opts.statusCode;
    if (opts.data) err.data = opts.data;
    return err;
};
(globalThis as any).setResponseStatus = () => {};
(globalThis as any).getRequestURL = () => ({ pathname: '/api/images/reorder' });

let readBodyValue: unknown;
(globalThis as any).readBody = () => Promise.resolve(readBodyValue);

function setBody(val: unknown) {
    readBodyValue = val;
}

describe('POST /api/images/reorder', () => {
    let db: ReturnType<typeof getDb>;

    beforeEach(() => {
        db = initDb(':memory:');

        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();

        db.insert(schema.user)
            .values({
                id: 'user-2',
                email: 'b@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();

        // Seed images for user-1
        db.insert(schema.images)
            .values([
                {
                    id: 1,
                    user_id: 'user-1',
                    entity_type: 'item',
                    entity_id: 1,
                    filename: 'a.webp',
                    is_local: true,
                    sort_order: 0,
                    created_at: 0,
                },
                {
                    id: 2,
                    user_id: 'user-1',
                    entity_type: 'item',
                    entity_id: 1,
                    filename: 'b.webp',
                    is_local: true,
                    sort_order: 1,
                    created_at: 0,
                },
            ])
            .run();

        // Seed an image for user-2
        db.insert(schema.images)
            .values({
                id: 3,
                user_id: 'user-2',
                entity_type: 'item',
                entity_id: 1,
                filename: 'c.webp',
                is_local: true,
                sort_order: 0,
                created_at: 0,
            })
            .run();
    });

    function authedEvent(userId: string | null) {
        return {
            context: {
                user: userId ? { id: userId } : null,
                logger: { info: () => {}, warn: () => {}, error: () => {} },
            },
        };
    }

    async function callHandler(userId: string | null, body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/images/reorder.post.js');
        return mod.default(authedEvent(userId));
    }

    it('rejects unauthenticated requests with 401', async () => {
        await expect(callHandler(null, [{ id: 1, sort_order: 1 }])).rejects.toMatchObject({
            statusCode: 401,
        });
    });

    it('reorders images owned by the user', async () => {
        const result = await callHandler('user-1', [
            { id: 1, sort_order: 1 },
            { id: 2, sort_order: 0 },
        ]);
        expect(result).toEqual({ ok: true });
    });

    it('rejects when user does not own all images (403)', async () => {
        await expect(
            callHandler('user-1', [
                { id: 1, sort_order: 0 },
                { id: 3, sort_order: 1 }, // owned by user-2
            ]),
        ).rejects.toMatchObject({
            statusCode: 403,
        });
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run --config vitest.server.config.ts test/server/images-reorder.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 3: Commit**

```bash
git add test/server/images-reorder.spec.ts
git commit -m "test: add full handler tests for POST /api/images/reorder"
```

---

### Task 14: Image URL handler — full coverage

**Files:**

- Create: `test/server/images-url.spec.ts`
- Tested: `server/api/images/url.post.ts`

- [ ] **Step 1: Write the tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initDb, getDb } from '../../server/db.js';
import * as schema from '../../server/schema.js';

(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; message: string; data?: any }) => {
    const err = new Error(opts.message) as Error & { statusCode: number; data?: any };
    err.statusCode = opts.statusCode;
    if (opts.data) err.data = opts.data;
    return err;
};
(globalThis as any).setResponseStatus = () => {};
(globalThis as any).getRequestURL = () => ({ pathname: '/api/images/url' });

let readBodyValue: unknown;
(globalThis as any).readBody = () => Promise.resolve(readBodyValue);

function setBody(val: unknown) {
    readBodyValue = val;
}

describe('POST /api/images/url', () => {
    let db: ReturnType<typeof getDb>;

    beforeEach(() => {
        db = initDb(':memory:');

        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();
    });

    async function callHandler(userId: string | null, body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/images/url.post.js');
        return mod.default({
            context: {
                user: userId ? { id: userId } : null,
                logger: { info: () => {}, warn: () => {}, error: () => {} },
            },
        });
    }

    it('rejects unauthenticated requests with 401', async () => {
        await expect(
            callHandler(null, { entityType: 'item', entityId: 1, url: 'https://example.com/img.jpg' }),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('creates an image record and returns id, url, sort_order', async () => {
        const result = await callHandler('user-1', {
            entityType: 'item',
            entityId: 1,
            url: 'https://example.com/img.jpg',
        });
        expect(result).toHaveProperty('id');
        expect(result.url).toBe('https://example.com/img.jpg');
        expect(result.sort_order).toBe(0);
    });

    it('increments sort_order for subsequent images', async () => {
        await callHandler('user-1', { entityType: 'item', entityId: 1, url: 'https://example.com/1.jpg' });
        const result = await callHandler('user-1', {
            entityType: 'item',
            entityId: 1,
            url: 'https://example.com/2.jpg',
        });
        expect(result.sort_order).toBe(1);
    });

    it('rejects when image count reaches the maximum (4)', async () => {
        for (let i = 0; i < 4; i++) {
            await callHandler('user-1', { entityType: 'item', entityId: 1, url: `https://example.com/${i}.jpg` });
        }
        await expect(
            callHandler('user-1', { entityType: 'item', entityId: 1, url: 'https://example.com/5.jpg' }),
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('stores image with is_local false', async () => {
        await callHandler('user-1', { entityType: 'item', entityId: 1, url: 'https://example.com/img.jpg' });
        const images = db.select().from(schema.images).all();
        expect(images[0].is_local).toBe(false);
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run --config vitest.server.config.ts test/server/images-url.spec.ts`
Expected: PASS (5 tests)

- [ ] **Step 3: Commit**

```bash
git add test/server/images-url.spec.ts
git commit -m "test: add full handler tests for POST /api/images/url"
```

---

### Task 15: Image delete handler — full coverage

**Files:**

- Create: `test/server/images-delete-full.spec.ts`
- Tested: `server/api/images/[id].delete.ts`

- [ ] **Step 1: Write the tests**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDb, getDb } from '../../server/db.js';
import * as schema from '../../server/schema.js';

(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number };
    err.statusCode = opts.statusCode;
    return err;
};
(globalThis as any).getRouterParam = (_event: any, name: string) => _event._params?.[name];

// Mock config module
vi.mock('config', () => ({
    default: { get: () => './uploads' },
}));

// Mock fs operations
vi.mock('node:fs', () => ({
    existsSync: vi.fn(() => false),
    unlinkSync: vi.fn(),
}));

describe('DELETE /api/images/[id]', () => {
    let db: ReturnType<typeof getDb>;

    beforeEach(() => {
        db = initDb(':memory:');

        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();

        // Seed a remote image
        db.insert(schema.images)
            .values({
                id: 1,
                user_id: 'user-1',
                entity_type: 'item',
                entity_id: 1,
                filename: 'https://example.com/img.jpg',
                is_local: false,
                sort_order: 0,
                created_at: 0,
            })
            .run();

        // Seed a local image
        db.insert(schema.images)
            .values({
                id: 2,
                user_id: 'user-1',
                entity_type: 'item',
                entity_id: 1,
                filename: 'abc123.webp',
                is_local: true,
                sort_order: 1,
                created_at: 0,
            })
            .run();
    });

    async function callHandler(userId: string | null, imageId: string) {
        const mod = await import('../../server/api/images/[id].delete.js');
        return mod.default({
            context: {
                user: userId ? { id: userId } : null,
                logger: { info: () => {}, warn: () => {}, error: () => {} },
            },
            _params: { id: imageId },
        });
    }

    it('rejects unauthenticated requests with 401', async () => {
        await expect(callHandler(null, '1')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('rejects invalid (non-numeric) image id with 400', async () => {
        await expect(callHandler('user-1', 'abc')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('returns 404 when image does not exist', async () => {
        await expect(callHandler('user-1', '999')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('deletes a remote image record from the database', async () => {
        const result = await callHandler('user-1', '1');
        expect(result).toEqual({ ok: true });

        const remaining = db.select().from(schema.images).all();
        expect(remaining.find((i) => i.id === 1)).toBeUndefined();
    });

    it('attempts to delete a local file from disk', async () => {
        const { existsSync, unlinkSync } = await import('node:fs');
        vi.mocked(existsSync).mockReturnValue(true);

        const result = await callHandler('user-1', '2');
        expect(result).toEqual({ ok: true });
        expect(unlinkSync).toHaveBeenCalled();
    });

    it('still deletes DB record if local file does not exist', async () => {
        const { existsSync } = await import('node:fs');
        vi.mocked(existsSync).mockReturnValue(false);

        const result = await callHandler('user-1', '2');
        expect(result).toEqual({ ok: true });

        const remaining = db.select().from(schema.images).all();
        expect(remaining.find((i) => i.id === 2)).toBeUndefined();
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run --config vitest.server.config.ts test/server/images-delete-full.spec.ts`
Expected: PASS (6 tests)

- [ ] **Step 3: Commit**

```bash
git add test/server/images-delete-full.spec.ts
git commit -m "test: add full handler tests for DELETE /api/images/[id]"
```

---

### Task 16: `buildLibraryBlob` server utility — full coverage

**Files:**

- Create: `test/server/library-blob.spec.ts`
- Tested: `server/utils/library.ts` (buildLibraryBlob, generateUniqueExternalId)

- [ ] **Step 1: Write the tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initDb, getDb } from '../../server/db.js';
import * as schema from '../../server/schema.js';

(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number };
    err.statusCode = opts.statusCode;
    return err;
};

describe('buildLibraryBlob', () => {
    let db: ReturnType<typeof getDb>;

    beforeEach(() => {
        db = initDb(':memory:');
    });

    async function importModule() {
        return import('../../server/utils/library.js');
    }

    it('returns a blank blob when user has no lists', async () => {
        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();

        const { buildLibraryBlob } = await importModule();
        const blob = await buildLibraryBlob('user-1');

        expect(blob.version).toBe('0.3');
        expect(blob.items).toEqual([]);
        expect(blob.categories).toEqual([]);
        expect(blob.lists).toEqual([]);
        expect(blob.defaultListId).toBe(0);
        expect(blob.sequence).toBe(1);
    });

    it('builds a complete blob with items, categories, and lists', async () => {
        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();
        db.insert(schema.library_settings)
            .values({ user_id: 'user-1', default_list_id: 1, total_unit: 'g', item_unit: 'g', currency_symbol: '€' })
            .run();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: 'Trip', external_id: 'abc123', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.categories)
            .values({ id: 1, user_id: 'user-1', list_id: 1, name: 'Shelter', sort_order: 0 })
            .run();
        db.insert(schema.category_items)
            .values({
                id: 1,
                category_id: 1,
                user_id: 'user-1',
                name: 'Tent',
                weight: 1000,
                author_unit: 'g',
                price: 200,
                sort_order: 0,
            })
            .run();

        const { buildLibraryBlob } = await importModule();
        const blob = await buildLibraryBlob('user-1');

        expect(blob.totalUnit).toBe('g');
        expect(blob.itemUnit).toBe('g');
        expect(blob.currencySymbol).toBe('€');
        expect(blob.defaultListId).toBe(1);
        expect(blob.items).toHaveLength(1);
        expect(blob.items[0].name).toBe('Tent');
        expect(blob.items[0].weight).toBe(1000);
        expect(blob.categories).toHaveLength(1);
        expect(blob.categories[0].name).toBe('Shelter');
        expect(blob.categories[0].categoryItems).toHaveLength(1);
        expect(blob.categories[0].categoryItems[0].itemId).toBe(1);
        expect(blob.lists).toHaveLength(1);
        expect(blob.lists[0].name).toBe('Trip');
        expect(blob.lists[0].externalId).toBe('abc123');
        expect(blob.lists[0].categoryIds).toEqual([1]);
    });

    it('sets sequence to max ID + 100', async () => {
        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();
        db.insert(schema.library_settings).values({ user_id: 'user-1', default_list_id: 1 }).run();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: '', external_id: 'aaa', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.categories).values({ id: 50, user_id: 'user-1', list_id: 1, name: '', sort_order: 0 }).run();
        db.insert(schema.category_items).values({ id: 200, category_id: 50, user_id: 'user-1', sort_order: 0 }).run();

        const { buildLibraryBlob } = await importModule();
        const blob = await buildLibraryBlob('user-1');
        expect(blob.sequence).toBe(300); // max ID 200 + 100
    });

    it('maps local images with /uploads/ prefix', async () => {
        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();
        db.insert(schema.library_settings).values({ user_id: 'user-1', default_list_id: 1 }).run();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: '', external_id: 'aaa', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.categories).values({ id: 1, user_id: 'user-1', list_id: 1, name: '', sort_order: 0 }).run();
        db.insert(schema.category_items).values({ id: 1, category_id: 1, user_id: 'user-1', sort_order: 0 }).run();
        db.insert(schema.images)
            .values({
                id: 1,
                user_id: 'user-1',
                entity_type: 'item',
                entity_id: 1,
                filename: 'abc.webp',
                is_local: true,
                sort_order: 0,
                created_at: 0,
            })
            .run();

        const { buildLibraryBlob } = await importModule();
        const blob = await buildLibraryBlob('user-1');

        expect(blob.items[0].images).toHaveLength(1);
        expect(blob.items[0].images[0].url).toBe('/uploads/abc.webp');
    });

    it('maps remote images with original URL', async () => {
        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();
        db.insert(schema.library_settings).values({ user_id: 'user-1', default_list_id: 1 }).run();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: '', external_id: 'aaa', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.categories).values({ id: 1, user_id: 'user-1', list_id: 1, name: '', sort_order: 0 }).run();
        db.insert(schema.category_items).values({ id: 1, category_id: 1, user_id: 'user-1', sort_order: 0 }).run();
        db.insert(schema.images)
            .values({
                id: 1,
                user_id: 'user-1',
                entity_type: 'item',
                entity_id: 1,
                filename: 'https://cdn.example.com/photo.jpg',
                is_local: false,
                sort_order: 0,
                created_at: 0,
            })
            .run();

        const { buildLibraryBlob } = await importModule();
        const blob = await buildLibraryBlob('user-1');

        expect(blob.items[0].images[0].url).toBe('https://cdn.example.com/photo.jpg');
    });

    it('uses default settings when no library_settings row exists', async () => {
        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: '', external_id: 'aaa', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.categories).values({ id: 1, user_id: 'user-1', list_id: 1, name: '', sort_order: 0 }).run();
        db.insert(schema.category_items).values({ id: 1, category_id: 1, user_id: 'user-1', sort_order: 0 }).run();

        const { buildLibraryBlob } = await importModule();
        const blob = await buildLibraryBlob('user-1');

        expect(blob.totalUnit).toBe('oz');
        expect(blob.itemUnit).toBe('oz');
        expect(blob.currencySymbol).toBe('$');
        expect(blob.optionalFields.worn).toBe(true);
        expect(blob.optionalFields.consumable).toBe(true);
        expect(blob.optionalFields.images).toBe(false);
    });

    it('falls back to first list ID when default_list_id is invalid', async () => {
        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'a@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();
        db.insert(schema.library_settings).values({ user_id: 'user-1', default_list_id: 999 }).run();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: '', external_id: 'aaa', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.categories).values({ id: 1, user_id: 'user-1', list_id: 1, name: '', sort_order: 0 }).run();
        db.insert(schema.category_items).values({ id: 1, category_id: 1, user_id: 'user-1', sort_order: 0 }).run();

        const { buildLibraryBlob } = await importModule();
        const blob = await buildLibraryBlob('user-1');

        expect(blob.defaultListId).toBe(1);
    });
});

describe('generateUniqueExternalId', () => {
    beforeEach(() => {
        initDb(':memory:');
    });

    it('returns a 6-character alphanumeric string', async () => {
        const { generateUniqueExternalId } = await import('../../server/utils/library.js');
        const id = generateUniqueExternalId();
        expect(id).toHaveLength(6);
        expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it('returns unique IDs on consecutive calls', async () => {
        const { generateUniqueExternalId } = await import('../../server/utils/library.js');
        const ids = new Set(Array.from({ length: 10 }, () => generateUniqueExternalId()));
        expect(ids.size).toBe(10);
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run --config vitest.server.config.ts test/server/library-blob.spec.ts`
Expected: PASS (9 tests)

- [ ] **Step 3: Commit**

```bash
git add test/server/library-blob.spec.ts
git commit -m "test: add buildLibraryBlob and generateUniqueExternalId tests"
```

---

## Summary

| Task | Target                                   | Tests Added | Coverage Impact |
| ---- | ---------------------------------------- | ----------- | --------------- |
| 1    | `csrf.ts`                                | 3           | 0% → 100%       |
| 2    | `utils.ts` (displayWeight/Price/globals) | 11          | 10% → ~50%      |
| 4    | `utils.ts` (fetchJson)                   | 7           | ~50% → ~80%     |
| 5    | `weight.ts` (edge cases)                 | 10          | 53% → ~90%      |
| 6-7  | `store.ts` (session, data, getter)       | 12          | 4% → ~15%       |
| 8    | `store.ts` (settings)                    | 5           | ~15% → ~25%     |
| 9    | `store.ts` (lists)                       | 6           | ~25% → ~35%     |
| 10   | `store.ts` (categories)                  | 4           | ~35% → ~40%     |
| 11   | `store.ts` (modal/UI)                    | 6           | ~40% → ~45%     |
| 12   | `account/delete`                         | 3           | 25% → ~90%      |
| 13   | `images/reorder`                         | 3           | 18% → ~85%      |
| 14   | `images/url`                             | 5           | 19% → ~90%      |
| 15   | `images/[id].delete`                     | 6           | 25% → ~90%      |
| 16   | `library.ts` (blob)                      | 9           | 30% → ~85%      |

**Estimated final coverage:**

- Unit tests: 56% → ~72%
- Server tests: 63% → ~82%
