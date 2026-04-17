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
(globalThis as any).getRouterParam = (_event: any, name: string) => _event._routerParams?.[name];
(globalThis as any).setResponseStatus = () => {};
(globalThis as any).getRequestURL = () => ({ pathname: '/api/test' });

let readBodyValue: unknown;
(globalThis as any).readBody = () => Promise.resolve(readBodyValue);

function setBody(val: unknown) {
    readBodyValue = val;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authedEvent(routerParams: Record<string, string> = {}) {
    return {
        context: {
            user: { id: 'user-1', email: 'a@test.com' },
            logger: { info: () => {}, warn: () => {}, error: () => {} },
        },
        _routerParams: routerParams,
    };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

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

    db.insert(schema.category_items)
        .values({
            id: 1,
            category_id: 1,
            user_id: 'user-1',
            name: 'Item A',
            weight: 100,
            author_unit: 'oz',
            price: 10,
            sort_order: 0,
        })
        .run();

    db.insert(schema.library_settings).values({ user_id: 'user-1', default_list_id: 1 }).run();
});

// ---------------------------------------------------------------------------
// Item creation — POST /api/categories/[id]/items
// ---------------------------------------------------------------------------

describe('POST /api/categories/[id]/items validation', () => {
    async function callCreateItem(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/categories/[id]/items/index.post.js');
        return mod.default(authedEvent({ id: '1' }));
    }

    it('accepts valid item with defaults', async () => {
        const item = await callCreateItem({});
        expect(item.name).toBe('');
        expect(item.weight).toBe(0);
        expect(item.author_unit).toBe('oz');
        expect(item.qty).toBe(1);
    });

    it('accepts valid item with all fields', async () => {
        const item = await callCreateItem({
            name: 'Tent',
            description: 'Ultralight tent',
            weight: 500,
            author_unit: 'g',
            price: 299.99,
            url: 'https://example.com',
            qty: 2,
            worn: true,
            consumable: false,
            star: 3,
        });
        expect(item.name).toBe('Tent');
        expect(item.weight).toBe(500);
        expect(item.author_unit).toBe('g');
        expect(item.worn).toBe(1);
        expect(item.consumable).toBe(0);
    });

    it('rejects negative weight', async () => {
        await expect(callCreateItem({ weight: -5 })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects negative price', async () => {
        await expect(callCreateItem({ price: -10 })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects invalid weight unit', async () => {
        await expect(callCreateItem({ author_unit: 'stones' })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects name exceeding 255 characters', async () => {
        await expect(callCreateItem({ name: 'x'.repeat(256) })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects description exceeding 10000 characters', async () => {
        await expect(callCreateItem({ description: 'x'.repeat(10001) })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects url exceeding 2048 characters', async () => {
        await expect(callCreateItem({ url: 'x'.repeat(2049) })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects qty of zero', async () => {
        await expect(callCreateItem({ qty: 0 })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects star rating above 3', async () => {
        await expect(callCreateItem({ star: 5 })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('coerces string numbers correctly', async () => {
        const item = await callCreateItem({ weight: '123.5', price: '9.99', qty: '3' });
        expect(item.weight).toBe(123.5);
        expect(item.price).toBe(9.99);
        expect(item.qty).toBe(3);
    });
});

// ---------------------------------------------------------------------------
// Item update — PATCH /api/categories/[id]/items/[itemId]
// ---------------------------------------------------------------------------

describe('PATCH /api/categories/[id]/items/[itemId] validation', () => {
    async function callUpdateItem(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/categories/[id]/items/[itemId].patch.js');
        return mod.default(authedEvent({ id: '1', itemId: '1' }));
    }

    it('accepts valid partial update', async () => {
        const item = await callUpdateItem({ name: 'Renamed' });
        expect(item.name).toBe('Renamed');
    });

    it('rejects empty update body', async () => {
        await expect(callUpdateItem({})).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects negative weight on update', async () => {
        await expect(callUpdateItem({ weight: -1 })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects invalid unit on update', async () => {
        await expect(callUpdateItem({ author_unit: 'invalid' })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('accepts valid unit change', async () => {
        const item = await callUpdateItem({ author_unit: 'kg' });
        expect(item.author_unit).toBe('kg');
    });
});

// ---------------------------------------------------------------------------
// List creation — POST /api/lists
// ---------------------------------------------------------------------------

describe('POST /api/lists validation', () => {
    async function callCreateList(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/lists/index.post.js');
        return mod.default(authedEvent());
    }

    it('accepts empty body with defaults', async () => {
        const list = await callCreateList({});
        expect(list.name).toBe('');
        expect(list.description).toBe('');
    });

    it('rejects name exceeding 255 characters', async () => {
        await expect(callCreateList({ name: 'x'.repeat(256) })).rejects.toMatchObject({
            statusCode: 400,
        });
    });
});

// ---------------------------------------------------------------------------
// List update — PATCH /api/lists/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/lists/[id] validation', () => {
    async function callUpdateList(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/lists/[id].patch.js');
        return mod.default(authedEvent({ id: '1' }));
    }

    it('accepts valid update', async () => {
        const list = await callUpdateList({ name: 'Renamed' });
        expect(list.name).toBe('Renamed');
    });

    it('rejects empty update body', async () => {
        await expect(callUpdateList({})).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects description exceeding 10000 characters', async () => {
        await expect(callUpdateList({ description: 'x'.repeat(10001) })).rejects.toMatchObject({
            statusCode: 400,
        });
    });
});

// ---------------------------------------------------------------------------
// Category creation — POST /api/categories
// ---------------------------------------------------------------------------

describe('POST /api/categories validation', () => {
    async function callCreateCategory(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/categories/index.post.js');
        return mod.default(authedEvent());
    }

    it('accepts valid category', async () => {
        const cat = await callCreateCategory({ list_id: 1, name: 'Shelter' });
        expect(cat.name).toBe('Shelter');
    });

    it('rejects missing list_id', async () => {
        await expect(callCreateCategory({ name: 'Shelter' })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects name exceeding 255 characters', async () => {
        await expect(callCreateCategory({ list_id: 1, name: 'x'.repeat(256) })).rejects.toMatchObject({
            statusCode: 400,
        });
    });
});

// ---------------------------------------------------------------------------
// Category update — PATCH /api/categories/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/categories/[id] validation', () => {
    async function callUpdateCategory(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/categories/[id].patch.js');
        return mod.default(authedEvent({ id: '1' }));
    }

    it('rejects empty update body', async () => {
        await expect(callUpdateCategory({})).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('accepts valid sort_order update', async () => {
        const cat = await callUpdateCategory({ sort_order: 5 });
        expect(cat.sort_order).toBe(5);
    });
});

// ---------------------------------------------------------------------------
// Library settings — PATCH /api/library
// ---------------------------------------------------------------------------

describe('PATCH /api/library validation', () => {
    async function callUpdateLibrary(body: unknown) {
        setBody(body);
        // Stub the updateLibrarySettings auto-import used by the handler
        (globalThis as any).updateLibrarySettings = (userId: string, updates: Record<string, unknown>) => {
            const dbLocal = getDb();
            dbLocal
                .update(schema.library_settings)
                .set(updates as any)
                .where(require('drizzle-orm').eq(schema.library_settings.user_id, userId))
                .run();
            return dbLocal
                .select()
                .from(schema.library_settings)
                .where(require('drizzle-orm').eq(schema.library_settings.user_id, userId))
                .all()[0];
        };
        const mod = await import('../../server/api/library/index.patch.js');
        return mod.default(authedEvent());
    }

    it('rejects empty update body', async () => {
        await expect(callUpdateLibrary({})).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects invalid total_unit', async () => {
        await expect(callUpdateLibrary({ total_unit: 'stones' })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects invalid item_unit', async () => {
        await expect(callUpdateLibrary({ item_unit: 'bushels' })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('accepts valid unit change', async () => {
        const result = await callUpdateLibrary({ total_unit: 'kg' });
        expect(result.settings.total_unit).toBe('kg');
    });

    it('rejects currency_symbol exceeding 5 characters', async () => {
        await expect(callUpdateLibrary({ currency_symbol: 'toolong' })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('accepts valid currency_symbol', async () => {
        const result = await callUpdateLibrary({ currency_symbol: '€' });
        expect(result.settings.currency_symbol).toBe('€');
    });
});

// ---------------------------------------------------------------------------
// Account delete — POST /api/account/delete
// ---------------------------------------------------------------------------

describe('POST /api/account/delete validation', () => {
    async function callDeleteAccount(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/account/delete.post.js');
        return mod.default(authedEvent());
    }

    it('rejects invalid email format', async () => {
        await expect(callDeleteAccount({ email: 'not-an-email' })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects missing email', async () => {
        await expect(callDeleteAccount({})).rejects.toMatchObject({
            statusCode: 400,
        });
    });
});

// ---------------------------------------------------------------------------
// Image reorder — POST /api/images/reorder
// ---------------------------------------------------------------------------

describe('POST /api/images/reorder validation', () => {
    async function callReorder(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/images/reorder.post.js');
        return mod.default(authedEvent());
    }

    it('rejects non-array body', async () => {
        await expect(callReorder({ id: 1, sort_order: 0 })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects empty array', async () => {
        await expect(callReorder([])).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects entries with negative sort_order', async () => {
        await expect(callReorder([{ id: 1, sort_order: -1 }])).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects entries with missing id', async () => {
        await expect(callReorder([{ sort_order: 0 }])).rejects.toMatchObject({
            statusCode: 400,
        });
    });
});

// ---------------------------------------------------------------------------
// Image URL — POST /api/images/url
// ---------------------------------------------------------------------------

describe('POST /api/images/url validation', () => {
    async function callImageUrl(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/images/url.post.js');
        return mod.default(authedEvent());
    }

    it('rejects missing url', async () => {
        await expect(callImageUrl({ entityType: 'item', entityId: 1 })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects invalid entityType', async () => {
        await expect(
            callImageUrl({ entityType: 'invalid', entityId: 1, url: 'https://example.com/img.jpg' }),
        ).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects non-integer entityId', async () => {
        await expect(
            callImageUrl({ entityType: 'item', entityId: 1.5, url: 'https://example.com/img.jpg' }),
        ).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects url exceeding 2048 characters', async () => {
        await expect(callImageUrl({ entityType: 'item', entityId: 1, url: 'x'.repeat(2049) })).rejects.toMatchObject({
            statusCode: 400,
        });
    });
});

// ---------------------------------------------------------------------------
// Copy list — POST /api/library/copy-list
// ---------------------------------------------------------------------------

describe('POST /api/library/copy-list validation', () => {
    async function callCopyList(body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/library/copy-list.post.js');
        return mod.default(authedEvent());
    }

    it('rejects missing externalId', async () => {
        await expect(callCopyList({})).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejects empty externalId', async () => {
        await expect(callCopyList({ externalId: '' })).rejects.toMatchObject({
            statusCode: 400,
        });
    });
});
