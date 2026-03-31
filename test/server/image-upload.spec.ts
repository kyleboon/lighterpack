import { describe, it, expect, vi } from 'vitest';

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
        const mod = await import('../../server/api/image-upload.post.js');
        const handler = mod.default;
        const event = { context: { user: null }, node: { req: {} } };
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 });
    });
});
