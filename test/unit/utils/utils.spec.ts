import { describe, it, expect } from 'vitest';
import { displayWeight, displayPrice } from '../../../app/utils/utils';

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
