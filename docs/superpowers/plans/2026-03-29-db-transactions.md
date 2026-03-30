# DB Transactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap three multi-step DB operations (list deletion, list copying, new user initialization) in Drizzle transactions so they are atomic.

**Architecture:** Use Drizzle's `db.transaction((tx) => { ... })` to wrap each multi-write operation. The `tx` object has the same API as `db` so changes are minimal — replace `db` with `tx` inside the transaction callback. `generateUniqueExternalId` gains an optional `tx` parameter so it can query within an existing transaction.

**Tech Stack:** TypeScript, Drizzle ORM (better-sqlite3), Vitest

---

## File Structure

| File                                        | Responsibility                                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `server/utils/library.ts`                   | Modify — wrap `initNewUserLibrary` in transaction, add `tx` param to `generateUniqueExternalId` |
| `server/api/lists/[id].delete.ts`           | Modify — wrap delete + default reset in transaction                                             |
| `server/api/library/copy-list.post.ts`      | Modify — wrap copy operations in transaction                                                    |
| `test/server/init-user-library.spec.ts`     | Create — test atomic user initialization                                                        |
| `test/server/list-delete.spec.ts`           | Create — test list deletion with default reset                                                  |
| `test/server/copy-list-transaction.spec.ts` | Create — test copy-list atomicity (separate from existing auth tests)                           |

---

### Task 1: Wrap `initNewUserLibrary` in a transaction

**Files:**

- Modify: `server/utils/library.ts:19-26,32-60`
- Create: `test/server/init-user-library.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `test/server/init-user-library.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initDb, getDb } from '../../server/db.js';
import * as schema from '../../server/schema.js';

describe('initNewUserLibrary', () => {
    let db: ReturnType<typeof getDb>;

    beforeEach(async () => {
        db = initDb(':memory:');

        db.insert(schema.user)
            .values({
                id: 'user-1',
                email: 'test@test.com',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();
    });

    it('creates settings, list, default, category, and item for a new user', async () => {
        const { initNewUserLibrary } = await import('../../server/utils/library.js');
        await initNewUserLibrary('user-1');

        const settings = db.select().from(schema.library_settings).all();
        expect(settings).toHaveLength(1);
        expect(settings[0].user_id).toBe('user-1');

        const lists = db.select().from(schema.lists).all();
        expect(lists).toHaveLength(1);
        expect(lists[0].user_id).toBe('user-1');

        // Default list should be set
        expect(settings[0].default_list_id).toBe(lists[0].id);

        const categories = db.select().from(schema.categories).all();
        expect(categories).toHaveLength(1);
        expect(categories[0].list_id).toBe(lists[0].id);

        const items = db.select().from(schema.category_items).all();
        expect(items).toHaveLength(1);
        expect(items[0].category_id).toBe(categories[0].id);
    });

    it('generates a 6-character external ID for the initial list', async () => {
        const { initNewUserLibrary } = await import('../../server/utils/library.js');
        await initNewUserLibrary('user-1');

        const lists = db.select().from(schema.lists).all();
        expect(lists[0].external_id).toMatch(/^[a-z0-9]{6}$/);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:server`
Expected: FAIL — `initNewUserLibrary` exists but the tests should pass since they test current behavior. If they pass, that's fine — we're establishing a baseline before the refactor.

- [ ] **Step 3: Update `generateUniqueExternalId` to accept an optional transaction parameter**

In `server/utils/library.ts`, change `generateUniqueExternalId` from:

```typescript
export async function generateUniqueExternalId(): Promise<string> {
    const db = getDb();
    while (true) {
        const id = generateExternalId();
        const existing = await db.select().from(schema.lists).where(eq(schema.lists.external_id, id));
        if (!existing.length) return id;
    }
}
```

to:

```typescript
export async function generateUniqueExternalId(tx?: ReturnType<typeof getDb>): Promise<string> {
    const conn = tx ?? getDb();
    while (true) {
        const id = generateExternalId();
        const existing = await conn.select().from(schema.lists).where(eq(schema.lists.external_id, id));
        if (!existing.length) return id;
    }
}
```

- [ ] **Step 4: Wrap `initNewUserLibrary` in a transaction**

In `server/utils/library.ts`, change `initNewUserLibrary` from:

```typescript
export async function initNewUserLibrary(userId: string) {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    // Create library settings with defaults
    await db.insert(schema.library_settings).values({ user_id: userId });

    // Create the initial list
    const externalId = await generateUniqueExternalId();
    const [list] = await db
        .insert(schema.lists)
        .values({ user_id: userId, name: '', external_id: externalId, sort_order: 0, created_at: now })
        .returning();

    // Set as default list
    await db
        .update(schema.library_settings)
        .set({ default_list_id: list.id })
        .where(eq(schema.library_settings.user_id, userId));

    // Create the initial category
    const [category] = await db
        .insert(schema.categories)
        .values({ user_id: userId, list_id: list.id, name: '', sort_order: 0 })
        .returning();

    // Create the initial item
    await db.insert(schema.category_items).values({ category_id: category.id, user_id: userId, sort_order: 0 });
}
```

to:

```typescript
export async function initNewUserLibrary(userId: string) {
    const db = getDb();

    await db.transaction(async (tx) => {
        const now = Math.floor(Date.now() / 1000);

        // Create library settings with defaults
        await tx.insert(schema.library_settings).values({ user_id: userId });

        // Create the initial list
        const externalId = await generateUniqueExternalId(tx);
        const [list] = await tx
            .insert(schema.lists)
            .values({ user_id: userId, name: '', external_id: externalId, sort_order: 0, created_at: now })
            .returning();

        // Set as default list
        await tx
            .update(schema.library_settings)
            .set({ default_list_id: list.id })
            .where(eq(schema.library_settings.user_id, userId));

        // Create the initial category
        const [category] = await tx
            .insert(schema.categories)
            .values({ user_id: userId, list_id: list.id, name: '', sort_order: 0 })
            .returning();

        // Create the initial item
        await tx.insert(schema.category_items).values({ category_id: category.id, user_id: userId, sort_order: 0 });
    });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:server`
Expected: All tests PASS (both existing copy-list tests and new init tests)

- [ ] **Step 6: Commit**

```bash
git add server/utils/library.ts test/server/init-user-library.spec.ts
git commit -m "feat: wrap initNewUserLibrary in a database transaction"
```

---

### Task 2: Wrap list deletion in a transaction

**Files:**

- Modify: `server/api/lists/[id].delete.ts:29-48`
- Create: `test/server/list-delete.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `test/server/list-delete.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDb, getDb } from '../../server/db.js';
import * as schema from '../../server/schema.js';
import { eq } from 'drizzle-orm';

// Stub Nitro auto-imports
(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number };
    err.statusCode = opts.statusCode;
    return err;
};
(globalThis as any).getRouterParam = (event: any, _name: string) => event._routerParams?.id;
(globalThis as any).setResponseStatus = (event: any, code: number) => {
    event._statusCode = code;
};

describe('list deletion with transaction', () => {
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

        // Create two lists
        db.insert(schema.lists)
            .values([
                { id: 1, user_id: 'user-1', name: 'List A', external_id: 'aaa111', sort_order: 0, created_at: 0 },
                { id: 2, user_id: 'user-1', name: 'List B', external_id: 'bbb222', sort_order: 1, created_at: 0 },
            ])
            .run();

        // Set list 1 as the default
        db.insert(schema.library_settings).values({ user_id: 'user-1', default_list_id: 1 }).run();
    });

    async function callHandler(userId: string | null, listId: number) {
        vi.resetModules();
        const mod = await import('../../server/api/lists/[id].delete.js');
        const handler = mod.default;
        const event = {
            context: { user: userId ? { id: userId } : null },
            _routerParams: { id: String(listId) },
            _statusCode: 200,
        };
        return handler(event);
    }

    it('deletes a list and resets default to the next remaining list', async () => {
        await callHandler('user-1', 1);

        const remaining = db.select().from(schema.lists).all();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].id).toBe(2);

        const settings = db
            .select()
            .from(schema.library_settings)
            .where(eq(schema.library_settings.user_id, 'user-1'))
            .all();
        expect(settings[0].default_list_id).toBe(2);
    });

    it('deletes a non-default list without changing the default', async () => {
        await callHandler('user-1', 2);

        const remaining = db.select().from(schema.lists).all();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].id).toBe(1);

        const settings = db
            .select()
            .from(schema.library_settings)
            .where(eq(schema.library_settings.user_id, 'user-1'))
            .all();
        expect(settings[0].default_list_id).toBe(1);
    });

    it('sets default to null when the last list is deleted', async () => {
        await callHandler('user-1', 1);
        await callHandler('user-1', 2);

        const remaining = db.select().from(schema.lists).all();
        expect(remaining).toHaveLength(0);

        const settings = db
            .select()
            .from(schema.library_settings)
            .where(eq(schema.library_settings.user_id, 'user-1'))
            .all();
        expect(settings[0].default_list_id).toBeNull();
    });
});
```

- [ ] **Step 2: Run tests to verify they pass as a baseline**

Run: `npm run test:server`
Expected: Tests should PASS — they test existing behavior before we wrap in a transaction.

- [ ] **Step 3: Wrap the delete + default reset in a transaction**

In `server/api/lists/[id].delete.ts`, change the handler from line 29 onward:

Replace:

```typescript
await db.delete(schema.lists).where(eq(schema.lists.id, id));

// If the deleted list was the default, reset to the first remaining list
const settings = await db
    .select({ default_list_id: schema.library_settings.default_list_id })
    .from(schema.library_settings)
    .where(eq(schema.library_settings.user_id, user.id));

if (settings.length && settings[0].default_list_id === id) {
    const remaining = await db
        .select({ id: schema.lists.id })
        .from(schema.lists)
        .where(eq(schema.lists.user_id, user.id))
        .orderBy(schema.lists.sort_order)
        .limit(1);

    await db
        .update(schema.library_settings)
        .set({ default_list_id: remaining.length ? remaining[0].id : null })
        .where(eq(schema.library_settings.user_id, user.id));
}

return { ok: true };
```

With:

```typescript
await db.transaction(async (tx) => {
    await tx.delete(schema.lists).where(eq(schema.lists.id, id));

    // If the deleted list was the default, reset to the first remaining list
    const settings = await tx
        .select({ default_list_id: schema.library_settings.default_list_id })
        .from(schema.library_settings)
        .where(eq(schema.library_settings.user_id, user.id));

    if (settings.length && settings[0].default_list_id === id) {
        const remaining = await tx
            .select({ id: schema.lists.id })
            .from(schema.lists)
            .where(eq(schema.lists.user_id, user.id))
            .orderBy(schema.lists.sort_order)
            .limit(1);

        await tx
            .update(schema.library_settings)
            .set({ default_list_id: remaining.length ? remaining[0].id : null })
            .where(eq(schema.library_settings.user_id, user.id));
    }
});

return { ok: true };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:server`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/api/lists/[id].delete.ts test/server/list-delete.spec.ts
git commit -m "feat: wrap list deletion + default reset in a database transaction"
```

---

### Task 3: Wrap list copying in a transaction

**Files:**

- Modify: `server/api/library/copy-list.post.ts:36-89`
- Create: `test/server/copy-list-transaction.spec.ts`

- [ ] **Step 1: Write tests for copy-list transaction behavior**

Create `test/server/copy-list-transaction.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDb, getDb } from '../../server/db.js';
import * as schema from '../../server/schema.js';
import { eq } from 'drizzle-orm';

// Stub Nitro auto-imports
(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number };
    err.statusCode = opts.statusCode;
    return err;
};
(globalThis as any).readBody = (_event: any) => _event._body;

describe('copy-list transaction', () => {
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

        db.insert(schema.lists)
            .values({
                id: 1,
                user_id: 'user-1',
                name: 'Original',
                description: 'A list',
                external_id: 'abc123',
                sort_order: 0,
                created_at: 0,
            })
            .run();

        db.insert(schema.categories)
            .values([
                { id: 1, user_id: 'user-1', list_id: 1, name: 'Shelter', sort_order: 0 },
                { id: 2, user_id: 'user-1', list_id: 1, name: 'Cooking', sort_order: 1 },
            ])
            .run();

        db.insert(schema.category_items)
            .values([
                {
                    id: 1,
                    category_id: 1,
                    user_id: 'user-1',
                    name: 'Tent',
                    weight: 1000,
                    author_unit: 'g',
                    sort_order: 0,
                },
                {
                    id: 2,
                    category_id: 1,
                    user_id: 'user-1',
                    name: 'Tarp',
                    weight: 500,
                    author_unit: 'g',
                    sort_order: 1,
                },
                {
                    id: 3,
                    category_id: 2,
                    user_id: 'user-1',
                    name: 'Stove',
                    weight: 200,
                    author_unit: 'g',
                    sort_order: 0,
                },
            ])
            .run();
    });

    async function callHandler(userId: string, externalId: string) {
        vi.resetModules();
        const mod = await import('../../server/api/library/copy-list.post.js');
        const handler = mod.default;
        const event = {
            context: { user: { id: userId } },
            _body: { externalId },
        };
        return handler(event);
    }

    it('copies all categories and items to the new list', async () => {
        const result = await callHandler('user-1', 'abc123');
        expect(result).toHaveProperty('listId');

        const newListId = result.listId;

        // Verify new list exists with copied name
        const newLists = db.select().from(schema.lists).where(eq(schema.lists.id, newListId)).all();
        expect(newLists).toHaveLength(1);
        expect(newLists[0].name).toBe('Original');
        expect(newLists[0].external_id).not.toBe('abc123');

        // Verify categories were copied
        const newCategories = db.select().from(schema.categories).where(eq(schema.categories.list_id, newListId)).all();
        expect(newCategories).toHaveLength(2);
        expect(newCategories.map((c) => c.name).sort()).toEqual(['Cooking', 'Shelter']);

        // Verify items were copied
        const shelterCat = newCategories.find((c) => c.name === 'Shelter')!;
        const shelterItems = db
            .select()
            .from(schema.category_items)
            .where(eq(schema.category_items.category_id, shelterCat.id))
            .all();
        expect(shelterItems).toHaveLength(2);
        expect(shelterItems.map((i) => i.name).sort()).toEqual(['Tarp', 'Tent']);

        const cookingCat = newCategories.find((c) => c.name === 'Cooking')!;
        const cookingItems = db
            .select()
            .from(schema.category_items)
            .where(eq(schema.category_items.category_id, cookingCat.id))
            .all();
        expect(cookingItems).toHaveLength(1);
        expect(cookingItems[0].name).toBe('Stove');
    });

    it('does not modify the original list', async () => {
        await callHandler('user-1', 'abc123');

        const originalCategories = db.select().from(schema.categories).where(eq(schema.categories.list_id, 1)).all();
        expect(originalCategories).toHaveLength(2);

        const originalItems = db.select().from(schema.category_items).all();
        // 3 original + 3 copied = 6 total
        expect(originalItems).toHaveLength(6);
    });
});
```

- [ ] **Step 2: Run tests to verify they pass as a baseline**

Run: `npm run test:server`
Expected: Tests should PASS — establishing baseline before wrapping in transaction.

- [ ] **Step 3: Wrap the copy operations in a transaction**

In `server/api/library/copy-list.post.ts`, replace lines 33-91 (from `const now` to `return { listId }`) with:

```typescript
const now = Math.floor(Date.now() / 1000);

const newList = await db.transaction(async (tx) => {
    // Create new list for the authenticated user
    const newExternalId = await generateUniqueExternalId(tx);
    const [created] = await tx
        .insert(schema.lists)
        .values({
            user_id: user.id,
            name: sourceList.name || '',
            description: sourceList.description || '',
            external_id: newExternalId,
            sort_order: 0,
            created_at: now,
        })
        .returning();

    // Copy categories and their items
    const sourceCategories = await tx
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.list_id, sourceList.id));

    for (const sourceCat of sourceCategories) {
        const [newCat] = await tx
            .insert(schema.categories)
            .values({
                user_id: user.id,
                list_id: created.id,
                name: sourceCat.name || '',
                sort_order: sourceCat.sort_order ?? 0,
            })
            .returning();

        // Copy items in this category
        const sourceItems = await tx
            .select()
            .from(schema.category_items)
            .where(eq(schema.category_items.category_id, sourceCat.id));

        for (const sourceItem of sourceItems) {
            await tx.insert(schema.category_items).values({
                category_id: newCat.id,
                user_id: user.id,
                name: sourceItem.name || '',
                description: sourceItem.description || '',
                weight: sourceItem.weight ?? 0,
                author_unit: sourceItem.author_unit || 'oz',
                price: sourceItem.price ?? 0,
                url: sourceItem.url || '',
                qty: sourceItem.qty ?? 1,
                worn: sourceItem.worn ?? 0,
                consumable: sourceItem.consumable ?? 0,
                star: sourceItem.star ?? 0,
                sort_order: sourceItem.sort_order ?? 0,
            });
        }
    }

    return created;
});

return { listId: newList.id };
```

Also update the `generateUniqueExternalId` import — since we already updated the signature in Task 1 to accept an optional `tx` parameter, this just requires passing `tx` in the call.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:server`
Expected: All tests PASS (existing copy-list auth tests + new transaction tests)

- [ ] **Step 5: Commit**

```bash
git add server/api/library/copy-list.post.ts test/server/copy-list-transaction.spec.ts
git commit -m "feat: wrap list copying in a database transaction"
```

---

### Task 4: Run full verification

- [ ] **Step 1: Run the TypeScript type checker**

Run: `npm run typecheck`
Expected: No type errors (the existing vue-router warning is pre-existing and unrelated)

- [ ] **Step 2: Run ESLint**

Run: `npm run lint:js`
Expected: No errors

- [ ] **Step 3: Run all server tests**

Run: `npm run test:server`
Expected: All tests PASS

- [ ] **Step 4: Run all unit tests**

Run: `npm run test:unit`
Expected: All tests PASS
