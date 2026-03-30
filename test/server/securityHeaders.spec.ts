import { describe, it, expect, beforeEach, vi } from 'vitest';

(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).setResponseHeader = (event: any, name: string, value: string) => {
    event._responseHeaders = event._responseHeaders || {};
    event._responseHeaders[name] = value;
};

describe('security headers middleware', () => {
    let handler: Function;

    beforeEach(async () => {
        vi.resetModules();
        const mod = await import('../../server/middleware/securityHeaders.js');
        handler = mod.default;
    });

    function createEvent() {
        return { _responseHeaders: {} as Record<string, string> };
    }

    it('sets X-Content-Type-Options to nosniff', () => {
        const event = createEvent();
        handler(event);
        expect(event._responseHeaders['X-Content-Type-Options']).toBe('nosniff');
    });

    it('sets X-Frame-Options to DENY', () => {
        const event = createEvent();
        handler(event);
        expect(event._responseHeaders['X-Frame-Options']).toBe('DENY');
    });

    it('sets Referrer-Policy', () => {
        const event = createEvent();
        handler(event);
        expect(event._responseHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });

    it('sets HSTS with one year max-age', () => {
        const event = createEvent();
        handler(event);
        expect(event._responseHeaders['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
    });

    it('sets Content-Security-Policy with expected directives', () => {
        const event = createEvent();
        handler(event);
        const csp = event._responseHeaders['Content-Security-Policy'];
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src 'self' 'unsafe-inline'");
        expect(csp).toContain('https://fonts.googleapis.com');
        expect(csp).toContain('https://fonts.gstatic.com');
        expect(csp).toContain('https://i.imgur.com');
        expect(csp).toContain("frame-ancestors 'none'");
    });
});
