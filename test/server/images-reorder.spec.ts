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

    async function callHandler(userId: string | null, body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/images/reorder.post.js');
        return mod.default({
            context: {
                user: userId ? { id: userId } : null,
                logger: { info: () => {}, warn: () => {}, error: () => {} },
            },
        });
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
                { id: 3, sort_order: 1 },
            ]),
        ).rejects.toMatchObject({
            statusCode: 403,
        });
    });
});
