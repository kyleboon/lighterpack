import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDb, getDb } from '../../server/db.js';
import * as schema from '../../server/schema.js';

// Stub Nitro auto-imports that the handler uses at module level
(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number };
    err.statusCode = opts.statusCode;
    return err;
};
(globalThis as any).readBody = (_event: any) => _event._body;

describe('copy-list authorization', () => {
    let db: ReturnType<typeof getDb>;

    beforeEach(() => {
        db = initDb(':memory:');

        // Seed two users
        db.insert(schema.user)
            .values([
                {
                    id: 'user-1',
                    email: 'a@test.com',
                    emailVerified: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'user-2',
                    email: 'b@test.com',
                    emailVerified: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ])
            .run();

        // Seed a list owned by user-1
        db.insert(schema.lists)
            .values({
                id: 1,
                user_id: 'user-1',
                name: 'Test List',
                description: '',
                external_id: 'abc123',
                sort_order: 0,
                created_at: Math.floor(Date.now() / 1000),
            })
            .run();

        // Seed a category + item so the full copy path is exercised
        db.insert(schema.categories)
            .values({
                id: 1,
                user_id: 'user-1',
                list_id: 1,
                name: 'Shelter',
                sort_order: 0,
            })
            .run();

        db.insert(schema.category_items)
            .values({
                id: 1,
                category_id: 1,
                user_id: 'user-1',
                name: 'Tent',
                description: '',
                weight: 1000,
                author_unit: 'g',
                price: 0,
                url: '',
                qty: 1,
                worn: 0,
                consumable: 0,
                star: 0,
                sort_order: 0,
            })
            .run();
    });

    async function callHandler(userId: string | null, externalId: string) {
        // Fresh import each time so the handler picks up the current db
        const mod = await import('../../server/api/library/copy-list.post.js');
        const handler = mod.default;
        const event = {
            context: { user: userId ? { id: userId } : null },
            _body: { externalId },
        };
        return handler(event);
    }

    it('allows the owner to copy their own list', async () => {
        const result = await callHandler('user-1', 'abc123');
        expect(result).toHaveProperty('listId');
    });

    it('rejects unauthenticated requests with 401', async () => {
        await expect(callHandler(null, 'abc123')).rejects.toMatchObject({
            statusCode: 401,
        });
    });

    it("rejects copying another user's list with 403", async () => {
        await expect(callHandler('user-2', 'abc123')).rejects.toMatchObject({
            statusCode: 403,
        });
    });

    it('returns 404 for non-existent list', async () => {
        await expect(callHandler('user-1', 'nonexistent')).rejects.toMatchObject({
            statusCode: 404,
        });
    });
});
