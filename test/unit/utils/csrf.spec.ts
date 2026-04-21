import { describe, it, expect, afterEach } from 'vitest';
import { getCsrfToken } from '../../../app/utils/csrf';

describe('getCsrfToken', () => {
    afterEach(() => {
        // Clear all cookies
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        });
    });

    it('returns the csrf_token cookie value', () => {
        document.cookie = 'csrf_token=abc123; path=/';
        expect(getCsrfToken()).toBe('abc123');
    });

    it('returns null when csrf_token cookie is not set', () => {
        expect(getCsrfToken()).toBeNull();
    });

    it('returns the correct token when multiple cookies exist', () => {
        document.cookie = 'other=value; path=/';
        document.cookie = 'csrf_token=xyz789; path=/';
        document.cookie = 'another=thing; path=/';
        expect(getCsrfToken()).toBe('xyz789');
    });
});
