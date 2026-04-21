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
