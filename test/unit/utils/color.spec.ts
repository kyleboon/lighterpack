import { describe, it, expect } from 'vitest';
import { getColor, rgbToString, stringToRgb, hexToRgb, rgbToHex, rgbToHsv, hsvToRgb } from '../../../shared/utils/color';

describe('getColor', () => {
    it('returns first color for index 0', () => {
        expect(getColor(0)).toEqual({ r: 27, g: 119, b: 211 });
    });

    it('wraps around the color palette', () => {
        const color0 = getColor(0);
        const color11 = getColor(11);
        expect(color11).toEqual(color0);
    });

    it('returns a derived color when baseColor is provided', () => {
        const base = { r: 100, g: 100, b: 100 };
        const derived = getColor(1, base);
        expect(derived).toHaveProperty('r');
        expect(derived).toHaveProperty('g');
        expect(derived).toHaveProperty('b');
    });
});

describe('rgbToString / stringToRgb', () => {
    it('converts rgb object to string', () => {
        expect(rgbToString({ r: 27, g: 119, b: 211 })).toBe('rgb(27,119,211)');
    });

    it('round-trips rgb string', () => {
        const rgb = { r: 27, g: 119, b: 211 };
        expect(stringToRgb(rgbToString(rgb))).toEqual(rgb);
    });
});

describe('hexToRgb / rgbToHex', () => {
    it('converts hex to rgb', () => {
        expect(hexToRgb('#1b77d3')).toEqual({ r: 27, g: 119, b: 211 });
    });

    it('returns null for invalid hex', () => {
        expect(hexToRgb('not-a-color')).toBeNull();
    });

    it('round-trips hex string', () => {
        const hex = '#1b77d3';
        expect(rgbToHex(hexToRgb(hex)!)).toBe(hex);
    });
});

describe('rgbToHsv / hsvToRgb', () => {
    it('round-trips rgb through hsv', () => {
        const rgb = { r: 27, g: 119, b: 211 };
        const hsv = rgbToHsv(rgb);
        const result = hsvToRgb(hsv);
        expect(result.r).toBeCloseTo(rgb.r, -1);
        expect(result.g).toBeCloseTo(rgb.g, -1);
        expect(result.b).toBeCloseTo(rgb.b, -1);
    });
});
