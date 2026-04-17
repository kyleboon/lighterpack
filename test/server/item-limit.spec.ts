import { describe, it, expect, beforeEach } from 'vitest';
import { initDb, getDb } from '../../server/db.js';
import * as schema from '../../server/schema.js';
import { eq } from 'drizzle-orm';

// Stub Nitro auto-imports
(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; message: string; data?: any }) => {
    const err = new Error(opts.message) as Error & { statusCode: number; data?: any };
    err.statusCode = opts.statusCode;
    if (opts.data) err.data = opts.data;
    return err;
};
(globalThis as any).getRouterParam = (_event: any, name: string) => _event._routerParams?.[name];
(globalThis as any).setResponseStatus = () => {};
(globalThis as any).getRequestURL = () => ({ pathname: '/api/test' });

let readBodyValue: unknown;
(globalThis as any).readBody = () => Promise.resolve(readBodyValue);

function setBody(val: unknown) {
    readBodyValue = val;
}

function authedEvent(routerParams: Record<string, string> = {}) {
    return {
        context: {
            user: { id: 'user-1', email: 'a@test.com' },
            logger: { info: () => {}, warn: () => {}, error: () => {} },
        },
        _routerParams: routerParams,
    };
}

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
        .values({ id: 1, user_id: 'user-1', name: 'List A', external_id: 'aaa111', sort_order: 0, created_at: 0 })
        .run();

    db.insert(schema.categories).values({ id: 1, user_id: 'user-1', list_id: 1, name: 'Cat A', sort_order: 0 }).run();

    db.insert(schema.library_settings).values({ user_id: 'user-1', default_list_id: 1 }).run();
});

// ---------------------------------------------------------------------------
// POST /api/categories/[id]/items — per-user item limit
// ---------------------------------------------------------------------------

describe('POST /api/categories/[id]/items per-user item limit', () => {
    async function callCreateItem(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/categories/[id]/items/index.post.js');
        return mod.default(authedEvent({ id: '1' }));
    }

    it('allows creating an item when under the limit', async () => {
        const item = await callCreateItem({ name: 'Tent' });
        expect(item.name).toBe('Tent');
    });

    it('rejects creating an item when at the limit', async () => {
        // Insert 1000 items to hit the limit
        const values = [];
        for (let i = 0; i < 1000; i++) {
            values.push({ category_id: 1, user_id: 'user-1', name: `Item ${i}`, sort_order: i });
        }
        // Insert in batches (SQLite has a variable limit)
        for (let i = 0; i < values.length; i += 100) {
            db.insert(schema.category_items)
                .values(values.slice(i, i + 100))
                .run();
        }

        await expect(callCreateItem({ name: 'One too many' })).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('maximum of 1000 items'),
        });
    });
});

// ---------------------------------------------------------------------------
// POST /api/library/copy-list — per-user item limit on copy
// ---------------------------------------------------------------------------

describe('POST /api/library/copy-list per-user item limit', () => {
    async function callCopyList(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/library/copy-list.post.js');
        return mod.default(authedEvent());
    }

    it('rejects copying a list when it would exceed the limit', async () => {
        // Insert 990 items — 10 below the limit
        const values = [];
        for (let i = 0; i < 990; i++) {
            values.push({ category_id: 1, user_id: 'user-1', name: `Item ${i}`, sort_order: i });
        }
        for (let i = 0; i < values.length; i += 100) {
            db.insert(schema.category_items)
                .values(values.slice(i, i + 100))
                .run();
        }

        // The source list (id=1) has category with those 990 items plus we'll add 20 more to a second category
        db.insert(schema.categories)
            .values({ id: 2, user_id: 'user-1', list_id: 1, name: 'Cat B', sort_order: 1 })
            .run();
        const moreItems = [];
        for (let i = 0; i < 20; i++) {
            moreItems.push({ category_id: 2, user_id: 'user-1', name: `Extra ${i}`, sort_order: i });
        }
        db.insert(schema.category_items).values(moreItems).run();

        // Total is 1010 items already; copying the list (which has 1010 items) would add 1010 more → 2020 > 1000
        await expect(callCopyList({ externalId: 'aaa111' })).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('exceed the maximum'),
        });
    });

    it('allows copying a list when under the limit', async () => {
        // Just 1 item in the source list via category 1 (from beforeEach, no items yet)
        db.insert(schema.category_items)
            .values({ category_id: 1, user_id: 'user-1', name: 'Only item', sort_order: 0 })
            .run();

        const result = await callCopyList({ externalId: 'aaa111' });
        expect(result.listId).toBeDefined();

        // Verify items were copied
        const allItems = db
            .select()
            .from(schema.category_items)
            .where(eq(schema.category_items.user_id, 'user-1'))
            .all();
        expect(allItems.length).toBe(2); // original + copy
    });
});
