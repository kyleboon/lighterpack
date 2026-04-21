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

    function seedUser(id = 'user-1') {
        db.insert(schema.user)
            .values({
                id,
                email: `${id}@test.com`,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .run();
    }

    it('returns a blank blob when user has no lists', async () => {
        seedUser();

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
        seedUser();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: 'Trip', external_id: 'abc123', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.library_settings)
            .values({
                user_id: 'user-1',
                default_list_id: 1,
                total_unit: 'g',
                item_unit: 'g',
                currency_symbol: '€',
            })
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
        seedUser();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: '', external_id: 'aaa', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.library_settings).values({ user_id: 'user-1', default_list_id: 1 }).run();
        db.insert(schema.categories).values({ id: 50, user_id: 'user-1', list_id: 1, name: '', sort_order: 0 }).run();
        db.insert(schema.category_items).values({ id: 200, category_id: 50, user_id: 'user-1', sort_order: 0 }).run();

        const { buildLibraryBlob } = await importModule();
        const blob = await buildLibraryBlob('user-1');
        expect(blob.sequence).toBe(300); // max ID 200 + 100
    });

    it('maps local images with /uploads/ prefix', async () => {
        seedUser();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: '', external_id: 'aaa', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.library_settings).values({ user_id: 'user-1', default_list_id: 1 }).run();
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
        seedUser();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: '', external_id: 'aaa', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.library_settings).values({ user_id: 'user-1', default_list_id: 1 }).run();
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
        seedUser();
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

    it('falls back to first list ID when default_list_id is null', async () => {
        seedUser();
        db.insert(schema.lists)
            .values({ id: 1, user_id: 'user-1', name: '', external_id: 'aaa', sort_order: 0, created_at: 0 })
            .run();
        db.insert(schema.library_settings).values({ user_id: 'user-1' }).run();
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
