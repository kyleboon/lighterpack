import { describe, it, expect, beforeEach } from 'vitest';
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
