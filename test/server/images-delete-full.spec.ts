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
    default: { get: () => './uploads', has: () => false },
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
