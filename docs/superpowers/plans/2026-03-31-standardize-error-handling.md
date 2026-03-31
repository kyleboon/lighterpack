# Standardize Error Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all `setResponseStatus` + return patterns with `throw createError()`, and wrap unprotected DB operations, Sharp image processing, and `unlinkSync` calls in try-catch blocks that throw proper `createError` responses.

**Architecture:** Two-phase approach: (1) Convert all `setResponseStatus`/return patterns to `throw createError()` for consistency, (2) Add try-catch wrappers around DB operations, Sharp processing, and file system calls in each API handler. Nitro's built-in error handler catches thrown `createError` instances and returns the correct HTTP status + JSON body automatically — no custom middleware needed.

**Tech Stack:** Nitro/H3 (`createError`, `throw`), Drizzle ORM, Sharp, Node.js `fs`

---

## Current State

### Two error patterns in use today

**Pattern A — `setResponseStatus` + return** (used in ~15 files):

```typescript
setResponseStatus(event, 401);
return { message: 'Please log in.' };
```

**Pattern B — `throw createError`** (used in 4 files: `copy-list.post.ts`, `images/url.post.ts`, `share/[id].get.ts`, `csv/[id].get.ts`):

```typescript
throw createError({ statusCode: 401, message: 'Please log in.' });
```

Pattern B is the Nitro-idiomatic approach. Pattern A has a subtle risk: if code after the return continues executing (e.g., in middleware chains or if someone removes the `return`), the response status is set but the handler keeps running.

### Unprotected operations

- **33+ DB operations** across all API routes — no try-catch
- **1 Sharp pipeline** in `image-upload.post.ts:79-82` — no try-catch
- **1 `unlinkSync`** in `images/[id].delete.ts:38` — no try-catch
- **1 `mkdirSync`** in `image-upload.post.ts:28` — no try-catch
- **1 formidable parse** in `image-upload.post.ts:31-36` — rejects on error but no catch

### Files that need changes

| File                                                  | Changes                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `server/api/image-upload.post.ts`                     | Convert 5x `setResponseStatus` → `throw createError`; wrap Sharp pipeline, formidable parse, mkdirSync, and DB ops |
| `server/api/images/[id].delete.ts`                    | Convert 3x `setResponseStatus` → `throw createError`; wrap `unlinkSync` and DB ops                                 |
| `server/api/images/reorder.post.ts`                   | Convert 3x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/categories/[id].patch.ts`                 | Convert 4x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/categories/[id].delete.ts`                | Convert 3x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/categories/index.post.ts`                 | Convert 3x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/categories/[id]/items/index.post.ts`      | Convert 3x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/categories/[id]/items/[itemId].patch.ts`  | Convert 4x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/categories/[id]/items/[itemId].delete.ts` | Convert 3x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/lists/[id].patch.ts`                      | Convert 4x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/lists/[id].delete.ts`                     | Convert 3x `setResponseStatus` → `throw createError`; wrap DB transaction                                          |
| `server/api/lists/index.post.ts`                      | Convert 1x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/library/index.get.ts`                     | Convert 1x `setResponseStatus` → `throw createError`; wrap `buildLibraryBlob`                                      |
| `server/api/library/index.patch.ts`                   | Convert 2x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/account/delete.post.ts`                   | Convert 2x `setResponseStatus` → `throw createError`; wrap DB ops                                                  |
| `server/api/health.get.ts`                            | Convert `setResponseStatus` in catch → `throw createError`                                                         |
| `server/routes/uploads/[...path].get.ts`              | Convert 2x `setResponseStatus` → `throw createError`                                                               |
| `server/api/share/[id].get.ts`                        | Already uses `throw createError`; wrap DB ops                                                                      |
| `server/routes/csv/[id].get.ts`                       | Already uses `throw createError`; wrap DB ops                                                                      |
| `server/api/library/copy-list.post.ts`                | Already uses `throw createError`; wrap DB transaction                                                              |
| `server/api/images/url.post.ts`                       | Already uses `throw createError`; wrap DB ops                                                                      |
| `server/utils/library.ts`                             | Wrap DB ops in `buildLibraryBlob` and `initNewUserLibrary`                                                         |
| `server/utils/db.ts`                                  | Wrap DB ops in helper functions                                                                                    |

---

## Task 1: Convert `image-upload.post.ts` to `throw createError` + wrap risky operations

This is the highest-risk file — it has Sharp processing, formidable parsing, mkdirSync, and multiple DB calls.

**Files:**

- Modify: `server/api/image-upload.post.ts`
- Test: `test/server/image-upload.spec.ts` (create)

- [ ] **Step 1: Write test for auth guard using `throw createError` pattern**

Create `test/server/image-upload.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Stub Nitro auto-imports
(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number };
    err.statusCode = opts.statusCode;
    return err;
};
(globalThis as any).setResponseStatus = vi.fn();

describe('image-upload auth guard', () => {
    it('throws 401 createError when user is not authenticated', async () => {
        // Dynamic import so globalThis stubs are in place
        const mod = await import('../../server/api/image-upload.post.js');
        const handler = mod.default;

        const event = {
            context: { user: null },
            node: { req: {} },
        };

        await expect(handler(event)).rejects.toThrow('Please log in.');
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:server -- --reporter verbose test/server/image-upload.spec.ts`
Expected: FAIL — current code uses `setResponseStatus` + return (doesn't throw)

- [ ] **Step 3: Convert all `setResponseStatus` patterns to `throw createError` in `image-upload.post.ts`**

Replace lines 16-20:

```typescript
// BEFORE
const user = event.context.user;
if (!user) {
    setResponseStatus(event, 401);
    return { message: 'Please log in.' };
}
// AFTER
const user = event.context.user;
if (!user) {
    throw createError({ statusCode: 401, message: 'Please log in.' });
}
```

Replace lines 38-41:

```typescript
// BEFORE
if (!files?.image?.[0]) {
    setResponseStatus(event, 400);
    return { message: 'No image file provided.' };
}
// AFTER
if (!files?.image?.[0]) {
    throw createError({ statusCode: 400, message: 'No image file provided.' });
}
```

Replace lines 45-48:

```typescript
// BEFORE
if (!ALLOWED_TYPES.has(file.mimetype)) {
    setResponseStatus(event, 400);
    return { message: 'File must be an image (PNG, JPG, GIF, or WebP).' };
}
// AFTER
if (!ALLOWED_TYPES.has(file.mimetype)) {
    throw createError({ statusCode: 400, message: 'File must be an image (PNG, JPG, GIF, or WebP).' });
}
```

Replace lines 54-57:

```typescript
// BEFORE
if (!entityType || !['item', 'category', 'list'].includes(entityType) || isNaN(entityId)) {
    setResponseStatus(event, 400);
    return { message: 'Invalid entityType or entityId.' };
}
// AFTER
if (!entityType || !['item', 'category', 'list'].includes(entityType) || isNaN(entityId)) {
    throw createError({ statusCode: 400, message: 'Invalid entityType or entityId.' });
}
```

Replace lines 70-73:

```typescript
// BEFORE
if (total >= MAX_IMAGES_PER_ENTITY) {
    setResponseStatus(event, 400);
    return { message: `Maximum of ${MAX_IMAGES_PER_ENTITY} images per item.` };
}
// AFTER
if (total >= MAX_IMAGES_PER_ENTITY) {
    throw createError({ statusCode: 400, message: `Maximum of ${MAX_IMAGES_PER_ENTITY} images per item.` });
}
```

- [ ] **Step 4: Wrap Sharp pipeline, formidable parse, and DB operations in try-catch**

Wrap the formidable parse (lines 30-36) — it already rejects on error, but wrap the await:

```typescript
let fields: any;
let files: any;
try {
    const parsed = await new Promise<any>((resolve, reject) => {
        form.parse(event.node.req, (err: any, parsedFields: any, parsedFiles: any) => {
            if (err) reject(err);
            else resolve({ fields: parsedFields, files: parsedFiles });
        });
    });
    fields = parsed.fields;
    files = parsed.files;
} catch (err) {
    throw createError({ statusCode: 400, message: 'Failed to parse upload.' });
}
```

Wrap the Sharp pipeline and DB insert (lines 79-95):

```typescript
try {
    await sharp(file.filepath)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outputPath);
} catch (err) {
    throw createError({ statusCode: 500, message: 'Image processing failed.' });
}

try {
    const [inserted] = await db
        .insert(schema.images)
        .values({
            user_id: user.id,
            entity_type: entityType,
            entity_id: entityId,
            filename,
            is_local: true,
            sort_order: sortOrder,
            created_at: Math.floor(Date.now() / 1000),
        })
        .returning();

    return {
        id: inserted.id,
        url: `/uploads/${filename}`,
    };
} catch (err) {
    throw createError({ statusCode: 500, message: 'Failed to save image record.' });
}
```

Wrap the image count DB query (lines 60-69):

```typescript
let total: number;
try {
    const [result] = await db
        .select({ total: count() })
        .from(schema.images)
        .where(
            and(
                eq(schema.images.entity_type, entityType),
                eq(schema.images.entity_id, entityId),
                eq(schema.images.user_id, user.id),
            ),
        );
    total = result.total;
} catch (err) {
    throw createError({ statusCode: 500, message: 'Failed to check image count.' });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:server -- --reporter verbose test/server/image-upload.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/api/image-upload.post.ts test/server/image-upload.spec.ts
git commit -m "feat: standardize error handling in image-upload handler

Convert setResponseStatus+return to throw createError pattern.
Wrap Sharp pipeline, formidable parse, and DB operations in try-catch."
```

---

## Task 2: Convert `images/[id].delete.ts` — wrap `unlinkSync` and DB ops

**Files:**

- Modify: `server/api/images/[id].delete.ts`
- Test: `test/server/image-delete.spec.ts` (create)

- [ ] **Step 1: Write test for auth guard and unlinkSync error handling**

Create `test/server/image-delete.spec.ts`:

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
(globalThis as any).getRouterParam = (_event: any, key: string) => _event._params?.[key];
(globalThis as any).setResponseStatus = vi.fn();

describe('image delete', () => {
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

    it('throws 401 when not authenticated', async () => {
        const mod = await import('../../server/api/images/[id].delete.js');
        const handler = mod.default;
        const event = { context: { user: null }, _params: { id: '1' } };

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 400 for invalid id', async () => {
        const mod = await import('../../server/api/images/[id].delete.js');
        const handler = mod.default;
        const event = { context: { user: { id: 'user-1' } }, _params: { id: 'abc' } };

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:server -- --reporter verbose test/server/image-delete.spec.ts`
Expected: FAIL — current code uses `setResponseStatus` + return

- [ ] **Step 3: Convert all `setResponseStatus` to `throw createError` and wrap risky operations**

Full replacement for `server/api/images/[id].delete.ts`:

```typescript
import { unlinkSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import config from 'config';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../../db.js';
import * as schema from '../../schema.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const id = parseInt(getRouterParam(event, 'id') ?? '', 10);
    if (isNaN(id)) {
        throw createError({ statusCode: 400, message: 'Invalid image id.' });
    }

    const db = getDb();

    let rows;
    try {
        rows = await db
            .select()
            .from(schema.images)
            .where(and(eq(schema.images.id, id), eq(schema.images.user_id, user.id)));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to look up image.' });
    }

    if (!rows.length) {
        throw createError({ statusCode: 404, message: 'Image not found.' });
    }

    const image = rows[0];

    if (image.is_local) {
        const uploadsBase = resolve(process.cwd(), config.get('uploadsPath') as string);
        const filePath = join(uploadsBase, image.filename);
        try {
            if (existsSync(filePath)) {
                unlinkSync(filePath);
            }
        } catch (err) {
            // Log but don't fail the request — the DB record should still be deleted
            event.context.logger?.warn({ err, filePath }, 'Failed to delete image file from disk');
        }
    }

    try {
        await db.delete(schema.images).where(eq(schema.images.id, id));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to delete image record.' });
    }

    return { ok: true };
});
```

Note: `unlinkSync` failure is logged as a warning but doesn't block the DB delete — a missing file on disk is less harmful than an orphaned DB record.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:server -- --reporter verbose test/server/image-delete.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/api/images/[id].delete.ts test/server/image-delete.spec.ts
git commit -m "feat: standardize error handling in image delete handler

Convert setResponseStatus+return to throw createError.
Wrap unlinkSync in try-catch (log warning, don't fail request).
Wrap DB operations in try-catch."
```

---

## Task 3: Convert remaining image routes (`reorder.post.ts`, `url.post.ts`)

**Files:**

- Modify: `server/api/images/reorder.post.ts`
- Modify: `server/api/images/url.post.ts` (already uses `throw createError` — just wrap DB ops)

- [ ] **Step 1: Convert `reorder.post.ts`**

Replace `server/api/images/reorder.post.ts` auth guard and validation (lines 11-14, 19-22, 33-36):

```typescript
const user = event.context.user;
if (!user) {
    throw createError({ statusCode: 401, message: 'Please log in.' });
}

const body = (await readBody(event)) as ReorderEntry[];

if (!Array.isArray(body) || body.some((e) => typeof e.id !== 'number' || typeof e.sort_order !== 'number')) {
    throw createError({ statusCode: 400, message: 'Body must be an array of { id, sort_order }.' });
}
```

Replace the ownership check (lines 33-36):

```typescript
if (owned.length !== ids.length) {
    throw createError({ statusCode: 403, message: 'One or more images not found.' });
}
```

Wrap DB operations (lines 28-31 and 39-41):

```typescript
let owned;
try {
    owned = await db
        .select({ id: schema.images.id })
        .from(schema.images)
        .where(and(inArray(schema.images.id, ids), eq(schema.images.user_id, user.id)));
} catch (err) {
    throw createError({ statusCode: 500, message: 'Failed to verify image ownership.' });
}

if (owned.length !== ids.length) {
    throw createError({ statusCode: 403, message: 'One or more images not found.' });
}

try {
    for (const entry of body) {
        await db.update(schema.images).set({ sort_order: entry.sort_order }).where(eq(schema.images.id, entry.id));
    }
} catch (err) {
    throw createError({ statusCode: 500, message: 'Failed to reorder images.' });
}
```

- [ ] **Step 2: Wrap DB ops in `url.post.ts`**

This file already uses `throw createError` for validation. Wrap the three DB operations:

Wrap the count query (lines 26-35):

```typescript
let total: number;
try {
    const [result] = await db
        .select({ total: count() })
        .from(schema.images)
        .where(
            and(
                eq(schema.images.entity_type, entityType),
                eq(schema.images.entity_id, entityId),
                eq(schema.images.user_id, user.id),
            ),
        );
    total = result.total;
} catch (err) {
    throw createError({ statusCode: 500, message: 'Failed to check image count.' });
}
```

Wrap the max sort order query (lines 40-49):

```typescript
let sortOrder: number;
try {
    const result = await db
        .select({ maxOrder: max(schema.images.sort_order) })
        .from(schema.images)
        .where(
            and(
                eq(schema.images.entity_type, entityType),
                eq(schema.images.entity_id, entityId),
                eq(schema.images.user_id, user.id),
            ),
        );
    sortOrder = (result[0]?.maxOrder ?? -1) + 1;
} catch (err) {
    throw createError({ statusCode: 500, message: 'Failed to determine sort order.' });
}
```

Wrap the insert (lines 52-63):

```typescript
try {
    const [inserted] = await db
        .insert(schema.images)
        .values({
            user_id: user.id,
            entity_type: entityType,
            entity_id: entityId,
            filename: url.trim(),
            is_local: false,
            sort_order: sortOrder,
            created_at: Math.floor(Date.now() / 1000),
        })
        .returning();

    return { id: inserted.id, url: url.trim(), sort_order: inserted.sort_order };
} catch (err) {
    throw createError({ statusCode: 500, message: 'Failed to save image record.' });
}
```

- [ ] **Step 3: Run all server tests**

Run: `npm run test:server -- --reporter verbose`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add server/api/images/reorder.post.ts server/api/images/url.post.ts
git commit -m "feat: standardize error handling in image reorder and URL handlers

Convert setResponseStatus to throw createError in reorder.
Wrap DB operations in try-catch in both handlers."
```

---

## Task 4: Convert category routes

**Files:**

- Modify: `server/api/categories/[id].patch.ts`
- Modify: `server/api/categories/[id].delete.ts`
- Modify: `server/api/categories/index.post.ts`
- Modify: `server/api/categories/[id]/items/index.post.ts`
- Modify: `server/api/categories/[id]/items/[itemId].patch.ts`
- Modify: `server/api/categories/[id]/items/[itemId].delete.ts`

- [ ] **Step 1: Convert `categories/[id].patch.ts`**

Full replacement:

```typescript
import { and, eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const id = Number(getRouterParam(event, 'id'));
    if (!id) {
        throw createError({ statusCode: 400, message: 'Invalid category id.' });
    }

    const body = await readBody(event);
    const updates: Partial<typeof schema.categories.$inferInsert> = {};
    if (body.name !== undefined) updates.name = String(body.name);
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);

    if (!Object.keys(updates).length) {
        throw createError({ statusCode: 400, message: 'No changes requested.' });
    }

    const db = getDb();
    let updated;
    try {
        [updated] = await db
            .update(schema.categories)
            .set(updates)
            .where(and(eq(schema.categories.id, id), eq(schema.categories.user_id, user.id)))
            .returning();
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to update category.' });
    }

    if (!updated) {
        throw createError({ statusCode: 404, message: 'Category not found.' });
    }

    return updated;
});
```

- [ ] **Step 2: Convert `categories/[id].delete.ts`**

Full replacement:

```typescript
import { and, eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const id = Number(getRouterParam(event, 'id'));
    if (!id) {
        throw createError({ statusCode: 400, message: 'Invalid category id.' });
    }

    const db = getDb();

    let existing;
    try {
        existing = await db
            .select({ id: schema.categories.id })
            .from(schema.categories)
            .where(and(eq(schema.categories.id, id), eq(schema.categories.user_id, user.id)));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to look up category.' });
    }

    if (!existing.length) {
        throw createError({ statusCode: 404, message: 'Category not found.' });
    }

    try {
        await db.delete(schema.categories).where(eq(schema.categories.id, id));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to delete category.' });
    }

    return { ok: true };
});
```

- [ ] **Step 3: Convert `categories/index.post.ts`**

Full replacement:

```typescript
import { and, eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const body = await readBody(event);
    const listId = Number(body.list_id);
    if (!listId) {
        throw createError({ statusCode: 400, message: 'list_id is required.' });
    }

    const db = getDb();

    let lists;
    try {
        lists = await db
            .select({ id: schema.lists.id })
            .from(schema.lists)
            .where(and(eq(schema.lists.id, listId), eq(schema.lists.user_id, user.id)));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to verify list ownership.' });
    }

    if (!lists.length) {
        throw createError({ statusCode: 404, message: 'List not found.' });
    }

    try {
        const existing = await db
            .select({ sort_order: schema.categories.sort_order })
            .from(schema.categories)
            .where(eq(schema.categories.list_id, listId))
            .orderBy(schema.categories.sort_order);

        const maxSort = existing.length ? Math.max(...existing.map((c) => c.sort_order ?? 0)) : -1;

        const [category] = await db
            .insert(schema.categories)
            .values({
                user_id: user.id,
                list_id: listId,
                name: String(body.name ?? ''),
                sort_order: maxSort + 1,
            })
            .returning();

        return category;
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to create category.' });
    }
});
```

- [ ] **Step 4: Convert `categories/[id]/items/index.post.ts`**

Full replacement:

```typescript
import { and, eq } from 'drizzle-orm';
import * as schema from '../../../../schema.js';
import { getDb } from '../../../../db.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const categoryId = Number(getRouterParam(event, 'id'));
    if (!categoryId) {
        throw createError({ statusCode: 400, message: 'Invalid category id.' });
    }

    const db = getDb();

    let cats;
    try {
        cats = await db
            .select({ id: schema.categories.id })
            .from(schema.categories)
            .where(and(eq(schema.categories.id, categoryId), eq(schema.categories.user_id, user.id)));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to verify category ownership.' });
    }

    if (!cats.length) {
        throw createError({ statusCode: 404, message: 'Category not found.' });
    }

    const body = await readBody(event);

    try {
        const existing = await db
            .select({ sort_order: schema.category_items.sort_order })
            .from(schema.category_items)
            .where(eq(schema.category_items.category_id, categoryId))
            .orderBy(schema.category_items.sort_order);

        const maxSort = existing.length ? Math.max(...existing.map((i) => i.sort_order ?? 0)) : -1;

        const [item] = await db
            .insert(schema.category_items)
            .values({
                category_id: categoryId,
                user_id: user.id,
                global_item_id: body.global_item_id ? Number(body.global_item_id) : null,
                name: String(body.name ?? ''),
                description: String(body.description ?? ''),
                weight: Number(body.weight ?? 0),
                author_unit: String(body.author_unit ?? 'oz'),
                price: Number(body.price ?? 0),
                url: String(body.url ?? ''),
                qty: Number(body.qty ?? 1),
                worn: body.worn ? 1 : 0,
                consumable: body.consumable ? 1 : 0,
                star: Number(body.star ?? 0),
                sort_order: maxSort + 1,
            })
            .returning();

        return item;
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to create item.' });
    }
});
```

- [ ] **Step 5: Convert `categories/[id]/items/[itemId].patch.ts`**

Full replacement:

```typescript
import { and, eq } from 'drizzle-orm';
import * as schema from '../../../../schema.js';
import { getDb } from '../../../../db.js';

const ITEM_FIELDS = [
    'name',
    'description',
    'weight',
    'author_unit',
    'price',
    'url',
    'qty',
    'worn',
    'consumable',
    'star',
    'sort_order',
] as const;

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const categoryId = Number(getRouterParam(event, 'id'));
    const itemId = Number(getRouterParam(event, 'itemId'));
    if (!categoryId || !itemId) {
        throw createError({ statusCode: 400, message: 'Invalid id.' });
    }

    const body = await readBody(event);
    const updates: Partial<typeof schema.category_items.$inferInsert> = {};

    for (const field of ITEM_FIELDS) {
        if (body[field] === undefined) continue;
        if (field === 'weight' || field === 'price') {
            (updates as any)[field] = Number(body[field]);
        } else if (field === 'worn' || field === 'consumable') {
            (updates as any)[field] = body[field] ? 1 : 0;
        } else if (field === 'qty' || field === 'star' || field === 'sort_order') {
            (updates as any)[field] = Number(body[field]);
        } else {
            (updates as any)[field] = String(body[field]);
        }
    }

    if (!Object.keys(updates).length) {
        throw createError({ statusCode: 400, message: 'No changes requested.' });
    }

    const db = getDb();
    let updated;
    try {
        [updated] = await db
            .update(schema.category_items)
            .set(updates)
            .where(
                and(
                    eq(schema.category_items.id, itemId),
                    eq(schema.category_items.category_id, categoryId),
                    eq(schema.category_items.user_id, user.id),
                ),
            )
            .returning();
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to update item.' });
    }

    if (!updated) {
        throw createError({ statusCode: 404, message: 'Item not found.' });
    }

    return updated;
});
```

- [ ] **Step 6: Convert `categories/[id]/items/[itemId].delete.ts`**

Full replacement:

```typescript
import { and, eq } from 'drizzle-orm';
import * as schema from '../../../../schema.js';
import { getDb } from '../../../../db.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const categoryId = Number(getRouterParam(event, 'id'));
    const itemId = Number(getRouterParam(event, 'itemId'));
    if (!categoryId || !itemId) {
        throw createError({ statusCode: 400, message: 'Invalid id.' });
    }

    const db = getDb();

    let existing;
    try {
        existing = await db
            .select({ id: schema.category_items.id })
            .from(schema.category_items)
            .where(
                and(
                    eq(schema.category_items.id, itemId),
                    eq(schema.category_items.category_id, categoryId),
                    eq(schema.category_items.user_id, user.id),
                ),
            );
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to look up item.' });
    }

    if (!existing.length) {
        throw createError({ statusCode: 404, message: 'Item not found.' });
    }

    try {
        await db.delete(schema.category_items).where(eq(schema.category_items.id, itemId));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to delete item.' });
    }

    return { ok: true };
});
```

- [ ] **Step 7: Run all server tests**

Run: `npm run test:server -- --reporter verbose`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add server/api/categories/
git commit -m "feat: standardize error handling in category and item handlers

Convert all setResponseStatus+return to throw createError.
Wrap DB operations in try-catch across all 6 category/item handlers."
```

---

## Task 5: Convert list routes

**Files:**

- Modify: `server/api/lists/[id].patch.ts`
- Modify: `server/api/lists/[id].delete.ts`
- Modify: `server/api/lists/index.post.ts`

- [ ] **Step 1: Convert `lists/[id].patch.ts`**

Full replacement:

```typescript
import { and, eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const id = Number(getRouterParam(event, 'id'));
    if (!id) {
        throw createError({ statusCode: 400, message: 'Invalid list id.' });
    }

    const body = await readBody(event);
    const db = getDb();

    const updates: Partial<typeof schema.lists.$inferInsert> = {};
    if (body.name !== undefined) updates.name = String(body.name);
    if (body.description !== undefined) updates.description = String(body.description);
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);

    if (!Object.keys(updates).length) {
        throw createError({ statusCode: 400, message: 'No changes requested.' });
    }

    let updated;
    try {
        [updated] = await db
            .update(schema.lists)
            .set(updates)
            .where(and(eq(schema.lists.id, id), eq(schema.lists.user_id, user.id)))
            .returning();
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to update list.' });
    }

    if (!updated) {
        throw createError({ statusCode: 404, message: 'List not found.' });
    }

    return updated;
});
```

- [ ] **Step 2: Convert `lists/[id].delete.ts`**

Full replacement:

```typescript
import { and, eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';

export default defineEventHandler((event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const id = Number(getRouterParam(event, 'id'));
    if (!id) {
        throw createError({ statusCode: 400, message: 'Invalid list id.' });
    }

    const db = getDb();

    let existing;
    try {
        existing = db
            .select({ id: schema.lists.id })
            .from(schema.lists)
            .where(and(eq(schema.lists.id, id), eq(schema.lists.user_id, user.id)))
            .all();
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to look up list.' });
    }

    if (!existing.length) {
        throw createError({ statusCode: 404, message: 'List not found.' });
    }

    try {
        db.transaction((tx) => {
            tx.delete(schema.lists).where(eq(schema.lists.id, id)).run();

            const settings = tx
                .select({ default_list_id: schema.library_settings.default_list_id })
                .from(schema.library_settings)
                .where(eq(schema.library_settings.user_id, user.id))
                .all();

            if (settings.length && settings[0].default_list_id === id) {
                const remaining = tx
                    .select({ id: schema.lists.id })
                    .from(schema.lists)
                    .where(eq(schema.lists.user_id, user.id))
                    .orderBy(schema.lists.sort_order)
                    .limit(1)
                    .all();

                tx.update(schema.library_settings)
                    .set({ default_list_id: remaining.length ? remaining[0].id : null })
                    .where(eq(schema.library_settings.user_id, user.id))
                    .run();
            }
        });
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to delete list.' });
    }

    return { ok: true };
});
```

- [ ] **Step 3: Convert `lists/index.post.ts`**

Full replacement:

```typescript
import { eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';
import { generateUniqueExternalId } from '../../utils/library.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const body = await readBody(event);
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const externalId = await generateUniqueExternalId();

    try {
        const existingLists = await db
            .select({ sort_order: schema.lists.sort_order })
            .from(schema.lists)
            .where(eq(schema.lists.user_id, user.id))
            .orderBy(schema.lists.sort_order);

        const maxSort = existingLists.length ? Math.max(...existingLists.map((l) => l.sort_order ?? 0)) : -1;

        const [list] = await db
            .insert(schema.lists)
            .values({
                user_id: user.id,
                name: String(body.name ?? ''),
                description: String(body.description ?? ''),
                external_id: externalId,
                sort_order: maxSort + 1,
                created_at: now,
            })
            .returning();

        return list;
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to create list.' });
    }
});
```

- [ ] **Step 4: Run all server tests**

Run: `npm run test:server -- --reporter verbose`
Expected: All PASS (existing `list-delete.spec.ts` should still pass)

- [ ] **Step 5: Commit**

```bash
git add server/api/lists/
git commit -m "feat: standardize error handling in list handlers

Convert setResponseStatus+return to throw createError.
Wrap DB operations and transactions in try-catch."
```

---

## Task 6: Convert library and account routes

**Files:**

- Modify: `server/api/library/index.get.ts`
- Modify: `server/api/library/index.patch.ts`
- Modify: `server/api/library/copy-list.post.ts` (already uses `throw createError` — wrap DB transaction)
- Modify: `server/api/account/delete.post.ts`

- [ ] **Step 1: Convert `library/index.get.ts`**

Full replacement:

```typescript
export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    let library;
    try {
        library = await buildLibraryBlob(user.id);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load library.' });
    }

    return { username: user.email, library: JSON.stringify(library) };
});
```

- [ ] **Step 2: Convert `library/index.patch.ts`**

Full replacement:

```typescript
const ALLOWED_FIELDS = [
    'total_unit',
    'item_unit',
    'show_sidebar',
    'currency_symbol',
    'default_list_id',
    'opt_images',
    'opt_price',
    'opt_worn',
    'opt_consumable',
    'opt_list_description',
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const body = await readBody(event);
    const updates: Partial<Record<AllowedField, unknown>> = {};
    for (const field of ALLOWED_FIELDS) {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    }

    if (!Object.keys(updates).length) {
        throw createError({ statusCode: 400, message: 'No changes requested.' });
    }

    let result;
    try {
        result = await updateLibrarySettings(user.id, updates as any);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to update library settings.' });
    }

    return { settings: result };
});
```

- [ ] **Step 3: Wrap DB transaction in `copy-list.post.ts`**

This file already uses `throw createError` for all validation. Wrap the transaction (lines 35-99):

```typescript
let newList;
try {
    newList = db.transaction((tx) => {
        // ... existing transaction body unchanged ...
    });
} catch (err) {
    if ((err as any)?.statusCode) throw err; // re-throw createError instances
    throw createError({ statusCode: 500, message: 'Failed to copy list.' });
}

return { listId: newList.id };
```

- [ ] **Step 4: Convert `account/delete.post.ts`**

Full replacement:

```typescript
import { eq } from 'drizzle-orm';
import { getDb } from '../../db.js';
import * as schema from '../../schema.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const body = await readBody(event);

    if (body.email !== user.email) {
        throw createError({ statusCode: 400, message: 'Email does not match your account.' });
    }

    const db = getDb();
    try {
        await db.delete(schema.user).where(eq(schema.user.id, user.id));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to delete account.' });
    }

    event.context.logger.info({ email: user.email }, 'account deleted');
    return { message: 'success' };
});
```

- [ ] **Step 5: Run all server tests**

Run: `npm run test:server -- --reporter verbose`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add server/api/library/ server/api/account/
git commit -m "feat: standardize error handling in library and account handlers

Convert setResponseStatus+return to throw createError.
Wrap DB operations, buildLibraryBlob, and copy-list transaction in try-catch."
```

---

## Task 7: Convert remaining routes (health, uploads, share, CSV)

**Files:**

- Modify: `server/api/health.get.ts`
- Modify: `server/routes/uploads/[...path].get.ts`
- Modify: `server/api/share/[id].get.ts` (already uses `throw createError` — wrap DB ops)
- Modify: `server/routes/csv/[id].get.ts` (already uses `throw createError` — wrap DB ops)

- [ ] **Step 1: Convert `health.get.ts`**

Full replacement:

```typescript
import { sql } from 'drizzle-orm';
import { getDb } from '../db.js';

export default defineEventHandler(() => {
    try {
        const db = getDb();
        db.run(sql`SELECT 1`);
        return { status: 'ok' };
    } catch {
        throw createError({ statusCode: 503, message: 'Database unavailable' });
    }
});
```

- [ ] **Step 2: Convert `uploads/[...path].get.ts`**

Full replacement:

```typescript
import { createReadStream, existsSync } from 'node:fs';
import { resolve, join, normalize } from 'node:path';
import config from 'config';

export default defineEventHandler(async (event) => {
    const rawPath = getRouterParam(event, 'path') ?? '';

    const uploadsBase = resolve(process.cwd(), config.get('uploadsPath') as string);
    const normalized = normalize(rawPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = join(uploadsBase, normalized);

    if (!filePath.startsWith(uploadsBase + '/') && filePath !== uploadsBase) {
        throw createError({ statusCode: 400, message: 'Invalid path.' });
    }

    if (!existsSync(filePath)) {
        throw createError({ statusCode: 404, message: 'Not found.' });
    }

    setHeader(event, 'Content-Type', 'image/webp');
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');

    return sendStream(event, createReadStream(filePath));
});
```

- [ ] **Step 3: Wrap DB ops in `share/[id].get.ts`**

Full replacement:

```typescript
import { eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';
import { buildLibraryBlob } from '../../utils/library.js';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({ statusCode: 400, message: 'No list specified' });
    }

    const db = getDb();

    let lists;
    try {
        lists = await db.select().from(schema.lists).where(eq(schema.lists.external_id, id));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to look up list.' });
    }

    if (!lists.length) {
        throw createError({ statusCode: 404, message: 'List not found' });
    }

    const list = lists[0]!;

    let libraryBlob;
    try {
        libraryBlob = await buildLibraryBlob(list.user_id);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load library data.' });
    }

    libraryBlob.defaultListId = list.id;

    return {
        library: libraryBlob,
        externalId: id,
    };
});
```

- [ ] **Step 4: Wrap DB ops in `csv/[id].get.ts`**

Wrap the DB query at lines 24-25:

```typescript
let lists;
try {
    lists = await db.select().from(schema.lists).where(eq(schema.lists.external_id, id));
} catch (err) {
    throw createError({ statusCode: 500, message: 'Failed to look up list.' });
}
```

Wrap the `buildLibraryBlob` call at line 32:

```typescript
let libraryBlob;
try {
    libraryBlob = await buildLibraryBlob(dbList.user_id);
} catch (err) {
    throw createError({ statusCode: 500, message: 'Failed to load library data.' });
}
```

- [ ] **Step 5: Run all server tests**

Run: `npm run test:server -- --reporter verbose`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add server/api/health.get.ts server/routes/uploads/ server/api/share/ server/routes/csv/
git commit -m "feat: standardize error handling in health, uploads, share, and CSV routes

Convert setResponseStatus to throw createError in health and uploads.
Wrap DB operations and buildLibraryBlob calls in try-catch."
```

---

## Task 8: Wrap DB operations in utility files

**Files:**

- Modify: `server/utils/db.ts`
- Modify: `server/utils/library.ts`

- [ ] **Step 1: Wrap DB ops in `server/utils/db.ts`**

Full replacement:

```typescript
import { getDb } from '../db.js';
export { getDb };

import { eq } from 'drizzle-orm';
import * as schema from '../schema.js';

export async function getLibrarySettings(userId: string) {
    const db = getDb();
    try {
        const rows = await db.select().from(schema.library_settings).where(eq(schema.library_settings.user_id, userId));
        return rows[0] ?? null;
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load library settings.' });
    }
}

export async function createLibrarySettings(userId: string) {
    const db = getDb();
    try {
        const result = await db.insert(schema.library_settings).values({ user_id: userId }).returning();
        return result[0]!;
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to create library settings.' });
    }
}

export async function updateLibrarySettings(
    userId: string,
    data: Partial<typeof schema.library_settings.$inferInsert>,
) {
    const db = getDb();
    try {
        const result = await db
            .update(schema.library_settings)
            .set(data)
            .where(eq(schema.library_settings.user_id, userId))
            .returning();
        return result[0] ?? null;
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to update library settings.' });
    }
}
```

- [ ] **Step 2: Wrap transaction in `initNewUserLibrary` in `server/utils/library.ts`**

Wrap lines 39-68:

```typescript
export function initNewUserLibrary(userId: string) {
    const db = getDb();

    try {
        db.transaction((tx) => {
            const now = Math.floor(Date.now() / 1000);

            tx.insert(schema.library_settings).values({ user_id: userId }).run();

            const externalId = generateUniqueExternalId(tx);
            const [list] = tx
                .insert(schema.lists)
                .values({ user_id: userId, name: '', external_id: externalId, sort_order: 0, created_at: now })
                .returning()
                .all();

            tx.update(schema.library_settings)
                .set({ default_list_id: list.id })
                .where(eq(schema.library_settings.user_id, userId))
                .run();

            const [category] = tx
                .insert(schema.categories)
                .values({ user_id: userId, list_id: list.id, name: '', sort_order: 0 })
                .returning()
                .all();

            tx.insert(schema.category_items).values({ category_id: category.id, user_id: userId, sort_order: 0 }).run();
        });
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to initialize user library.' });
    }
}
```

- [ ] **Step 3: Wrap DB queries in `buildLibraryBlob`**

Wrap the four DB queries (settings, lists, categories, items) at lines 79-133:

```typescript
export async function buildLibraryBlob(userId: string) {
    const db = getDb();

    let settingsRows, dbLists, dbCategories, dbItems, dbImages;
    try {
        settingsRows = await db
            .select()
            .from(schema.library_settings)
            .where(eq(schema.library_settings.user_id, userId));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load library settings.' });
    }

    const settings = settingsRows[0] ?? {
        total_unit: 'oz',
        item_unit: 'oz',
        show_sidebar: 0,
        currency_symbol: '$',
        default_list_id: null,
        opt_images: 0,
        opt_price: 0,
        opt_worn: 1,
        opt_consumable: 1,
        opt_list_description: 0,
    };

    try {
        dbLists = await db
            .select()
            .from(schema.lists)
            .where(eq(schema.lists.user_id, userId))
            .orderBy(schema.lists.sort_order);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load lists.' });
    }

    if (!dbLists.length) {
        return buildBlankBlob();
    }

    const listIds = dbLists.map((l) => l.id);

    try {
        dbCategories = await db
            .select()
            .from(schema.categories)
            .where(inArray(schema.categories.list_id, listIds))
            .orderBy(schema.categories.sort_order);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load categories.' });
    }

    const categoryIds = dbCategories.map((c) => c.id);

    try {
        dbItems = categoryIds.length
            ? await db
                  .select()
                  .from(schema.category_items)
                  .where(inArray(schema.category_items.category_id, categoryIds))
                  .orderBy(schema.category_items.sort_order)
            : [];
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load items.' });
    }

    try {
        dbImages = await db
            .select()
            .from(schema.images)
            .where(eq(schema.images.user_id, userId))
            .orderBy(schema.images.sort_order);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load images.' });
    }

    // ... rest of the function unchanged (pure data transformation, no DB calls) ...
```

- [ ] **Step 4: Run all server tests**

Run: `npm run test:server -- --reporter verbose`
Expected: All PASS (existing `init-user-library.spec.ts` should still pass)

- [ ] **Step 5: Commit**

```bash
git add server/utils/db.ts server/utils/library.ts
git commit -m "feat: standardize error handling in server utility files

Wrap DB operations in try-catch in db.ts helpers.
Wrap transaction in initNewUserLibrary and DB queries in buildLibraryBlob."
```

---

## Task 9: Run lint and typecheck, fix any issues

- [ ] **Step 1: Run ESLint**

Run: `npm run lint:js`
Expected: No new errors. Fix any that appear (likely: unused `setResponseStatus` imports if auto-imported, or unused `event` parameter in health handler).

- [ ] **Step 2: Run TypeScript type check**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 3: Run all tests**

Run: `npm run test:unit && npm run test:server`
Expected: All PASS.

- [ ] **Step 4: Commit any lint/type fixes**

```bash
git add -u
git commit -m "chore: fix lint and type errors from error handling standardization"
```

---

## Task 10: Update README roadmap

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Mark the roadmap item as done**

Change line 90 from:

```markdown
- [ ] Standardize error handling on `createError` + throw pattern — only 4 try-catch blocks across 56+ error paths; wrap DB operations, Sharp image processing, and `unlinkSync` calls
```

to:

```markdown
- [x] Standardize error handling on `createError` + throw pattern — only 4 try-catch blocks across 56+ error paths; wrap DB operations, Sharp image processing, and `unlinkSync` calls
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: mark error handling standardization as complete in roadmap"
```
