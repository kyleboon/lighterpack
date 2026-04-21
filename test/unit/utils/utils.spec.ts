import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { displayWeight, displayPrice, fetchJson } from '../../../app/utils/utils';

vi.mock('../../../app/utils/csrf', () => ({
    getCsrfToken: vi.fn(() => null),
}));

describe('displayWeight', () => {
    it('converts milligrams to the specified unit', () => {
        expect(displayWeight(28349.5, 'oz')).toBe(1);
    });

    it('returns 0 for zero milligrams', () => {
        expect(displayWeight(0, 'oz')).toBe(0);
    });

    it('returns 0 for an invalid unit', () => {
        expect(displayWeight(1000, 'invalid' as any)).toBe(0);
    });
});

describe('displayPrice', () => {
    it('formats price with symbol and two decimals', () => {
        expect(displayPrice(9.9, '$')).toBe('$9.90');
    });

    it('formats zero price', () => {
        expect(displayPrice(0, '$')).toBe('$0.00');
    });

    it('returns symbol + 0.00 for undefined price', () => {
        expect(displayPrice(undefined, '€')).toBe('€0.00');
    });

    it('uses the provided currency symbol', () => {
        expect(displayPrice(5, '£')).toBe('£5.00');
    });
});

describe('window globals', () => {
    it('exposes arrayMove on window', () => {
        expect(window.arrayMove).toBeTypeOf('function');
    });

    it('arrayMove reorders elements correctly', () => {
        const result = window.arrayMove(['a', 'b', 'c', 'd'], 0, 2);
        expect(result).toEqual(['b', 'c', 'a', 'd']);
    });

    it('arrayMove does not mutate the original array', () => {
        const original = [1, 2, 3];
        window.arrayMove(original, 0, 2);
        expect(original).toEqual([1, 2, 3]);
    });

    it('exposes getElementIndex on window', () => {
        expect(window.getElementIndex).toBeTypeOf('function');
    });

    it('exposes readCookie on window', () => {
        expect(window.readCookie).toBeTypeOf('function');
    });

    it('readCookie returns null for missing cookie', () => {
        expect(window.readCookie('nonexistent')).toBeNull();
    });

    it('exposes createCookie on window', () => {
        expect(window.createCookie).toBeTypeOf('function');
    });
});

describe('fetchJson', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchSpy = vi.fn();
        globalThis.fetch = fetchSpy;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('resolves with parsed JSON on success', async () => {
        fetchSpy.mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({ data: 'test' })),
        });
        const result = await fetchJson('/api/test');
        expect(result).toEqual({ data: 'test' });
    });

    it('sets Content-Type to application/json when no body', async () => {
        fetchSpy.mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve('{}'),
        });
        await fetchJson('/api/test');
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/test',
            expect.objectContaining({
                headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
            }),
        );
    });

    it('defaults to GET method', async () => {
        fetchSpy.mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve('{}'),
        });
        await fetchJson('/api/test');
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/test',
            expect.objectContaining({
                method: 'GET',
            }),
        );
    });

    it('rejects with lpError on non-ok response', async () => {
        fetchSpy.mockResolvedValue({
            ok: false,
            status: 500,
            text: () => Promise.resolve(JSON.stringify({ message: 'Server error' })),
        });
        await expect(fetchJson('/api/test')).rejects.toThrow('Server error');
    });

    it('navigates to /welcome on 401 response', async () => {
        fetchSpy.mockResolvedValue({
            ok: false,
            status: 401,
            text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
        });
        // The Promise never resolves on 401 (navigateTo is called and the chain returns undefined
        // without resolving the outer Promise). Race against a short timeout to verify the side effect.
        await Promise.race([
            fetchJson('/api/test'),
            new Promise<void>((resolve) => {
                setTimeout(resolve, 100);
            }),
        ]);
        expect((globalThis as any).navigateTo).toHaveBeenCalledWith('/welcome');
    });

    it('rejects with default message on network failure', async () => {
        fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(fetchJson('/api/test')).rejects.toThrow('An error occurred, please try again later.');
    });

    it('injects CSRF token header when token exists', async () => {
        const { getCsrfToken } = await import('../../../app/utils/csrf');
        vi.mocked(getCsrfToken).mockReturnValue('test-token');

        fetchSpy.mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve('{}'),
        });
        await fetchJson('/api/test');
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/test',
            expect.objectContaining({
                headers: expect.objectContaining({ 'X-CSRF-Token': 'test-token' }),
            }),
        );
    });
});
