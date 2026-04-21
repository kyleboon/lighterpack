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
(globalThis as any).setResponseStatus = () => {};
(globalThis as any).getRequestURL = () => ({ pathname: '/api/account/delete' });

let readBodyValue: unknown;
(globalThis as any).readBody = () => Promise.resolve(readBodyValue);

function setBody(val: unknown) {
    readBodyValue = val;
}

describe('POST /api/account/delete', () => {
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

    async function callHandler(user: { id: string; email: string } | null, body: unknown) {
        setBody(body);
        const mod = await import('../../server/api/account/delete.post.js');
        return mod.default({
            context: {
                user,
                logger: { info: () => {}, warn: () => {}, error: () => {} },
            },
        });
    }

    it('rejects unauthenticated requests with 401', async () => {
        await expect(callHandler(null, { email: 'a@test.com' })).rejects.toMatchObject({
            statusCode: 401,
        });
    });

    it('rejects when email does not match the user account', async () => {
        await expect(
            callHandler({ id: 'user-1', email: 'a@test.com' }, { email: 'wrong@test.com' }),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: 'Email does not match your account.',
        });
    });

    it('deletes the user account when email matches', async () => {
        const result = await callHandler({ id: 'user-1', email: 'a@test.com' }, { email: 'a@test.com' });
        expect(result).toEqual({ message: 'success' });

        // Verify user is deleted from DB
        const users = db.select().from(schema.user).all();
        expect(users).toHaveLength(0);
    });
});
