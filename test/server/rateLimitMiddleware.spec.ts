import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Stub Nitro auto-imports before importing the middleware
(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).createError = (opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number; statusMessage: string };
    err.statusCode = opts.statusCode;
    err.statusMessage = opts.statusMessage;
    return err;
};
(globalThis as any).useRuntimeConfig = () => ({ disableRateLimiting: false });
(globalThis as any).getRequestURL = (event: any) => new URL(event._url);
(globalThis as any).getRequestHeader = (event: any, name: string) => event._headers?.[name];
(globalThis as any).setResponseHeader = (event: any, name: string, value: string) => {
    event._responseHeaders = event._responseHeaders || {};
    event._responseHeaders[name] = value;
};
(globalThis as any).setResponseStatus = (event: any, code: number) => {
    event._statusCode = code;
};

function createMockEvent(path: string, options: { ip?: string; forwardedFor?: string; userId?: string | null } = {}) {
    return {
        _url: `http://localhost:3000${path}`,
        _headers: options.forwardedFor ? { 'x-forwarded-for': options.forwardedFor } : {},
        _responseHeaders: {} as Record<string, string>,
        _statusCode: 200,
        context: { user: options.userId ? { id: options.userId } : null },
        node: { req: { socket: { remoteAddress: options.ip || '127.0.0.1' } } },
    };
}

describe('rate limit middleware', () => {
    let handler: Function;

    beforeEach(async () => {
        vi.useFakeTimers();
        // Re-import to get fresh limiter instances each test
        vi.resetModules();
        const mod = await import('../../server/middleware/rateLimit.js');
        handler = mod.default;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('allows magic link requests up to the limit', async () => {
        const path = '/api/auth/sign-in/magic-link';
        for (let i = 0; i < 5; i++) {
            const event = createMockEvent(path, { ip: '1.2.3.4' });
            const result = await handler(event);
            expect(result).toBeUndefined();
        }
    });

    it('returns 429 for magic link requests exceeding the limit', async () => {
        const path = '/api/auth/sign-in/magic-link';
        for (let i = 0; i < 5; i++) {
            await handler(createMockEvent(path, { ip: '1.2.3.4' }));
        }
        const event = createMockEvent(path, { ip: '1.2.3.4' });
        const result = await handler(event);
        expect(event._statusCode).toBe(429);
        expect(event._responseHeaders['Retry-After']).toBeDefined();
        expect(result).toHaveProperty('message', 'Too many requests. Please try again later.');
        expect(result).toHaveProperty('retryAfter');
    });

    it('uses X-Forwarded-For for IP detection', async () => {
        const path = '/api/auth/sign-in/magic-link';
        // Exhaust limit for forwarded IP
        for (let i = 0; i < 5; i++) {
            await handler(createMockEvent(path, { ip: '127.0.0.1', forwardedFor: '5.6.7.8' }));
        }
        // Same remoteAddress but different forwarded IP — should be allowed
        const event = createMockEvent(path, { ip: '127.0.0.1', forwardedFor: '9.10.11.12' });
        const result = await handler(event);
        expect(result).toBeUndefined();
    });

    it('allows image upload requests up to the limit', async () => {
        const path = '/api/image-upload';
        for (let i = 0; i < 10; i++) {
            const event = createMockEvent(path, { userId: 'user-1' });
            const result = await handler(event);
            expect(result).toBeUndefined();
        }
    });

    it('returns 429 for image upload requests exceeding the limit', async () => {
        const path = '/api/image-upload';
        for (let i = 0; i < 10; i++) {
            await handler(createMockEvent(path, { userId: 'user-1' }));
        }
        const event = createMockEvent(path, { userId: 'user-1' });
        const result = await handler(event);
        expect(event._statusCode).toBe(429);
        expect(event._responseHeaders['Retry-After']).toBeDefined();
        expect(result).toHaveProperty('message');
    });

    it('tracks different users independently for image uploads', async () => {
        const path = '/api/image-upload';
        for (let i = 0; i < 10; i++) {
            await handler(createMockEvent(path, { userId: 'user-1' }));
        }
        // Different user — should be allowed
        const event = createMockEvent(path, { userId: 'user-2' });
        const result = await handler(event);
        expect(result).toBeUndefined();
    });

    it('skips rate limiting for unauthenticated image upload requests', async () => {
        const path = '/api/image-upload';
        const event = createMockEvent(path, { userId: null });
        const result = await handler(event);
        expect(result).toBeUndefined();
    });

    it('skips all rate limiting when disableRateLimiting is true', async () => {
        const originalUseRuntimeConfig = (globalThis as any).useRuntimeConfig;
        (globalThis as any).useRuntimeConfig = () => ({ disableRateLimiting: true });
        vi.resetModules();
        const mod = await import('../../server/middleware/rateLimit.js');
        const disabledHandler = mod.default;

        const path = '/api/auth/sign-in/magic-link';
        // Send more than the limit
        for (let i = 0; i < 10; i++) {
            const event = createMockEvent(path, { ip: '1.2.3.4' });
            const result = await disabledHandler(event);
            expect(result).toBeUndefined();
        }

        (globalThis as any).useRuntimeConfig = originalUseRuntimeConfig;
    });

    it('does not rate limit unrelated paths', async () => {
        for (let i = 0; i < 20; i++) {
            const event = createMockEvent('/api/library', { ip: '1.2.3.4' });
            const result = await handler(event);
            expect(result).toBeUndefined();
        }
    });
});
