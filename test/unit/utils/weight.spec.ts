import { describe, it, expect } from 'vitest';
import { WeightToMg, MgToWeight } from '../../../shared/utils/weight';

describe('WeightToMg', () => {
    it('converts grams to milligrams', () => {
        expect(WeightToMg(1, 'g')).toBe(1000);
        expect(WeightToMg(0.5, 'g')).toBe(500);
    });

    it('converts kilograms to milligrams', () => {
        expect(WeightToMg(1, 'kg')).toBe(1000000);
        expect(WeightToMg(0.001, 'kg')).toBe(1000);
    });

    it('converts ounces to milligrams', () => {
        expect(WeightToMg(1, 'oz')).toBe(28349.5);
    });

    it('converts pounds to milligrams', () => {
        expect(WeightToMg(1, 'lb')).toBe(453592);
    });

    it('returns 0 for an unknown unit', () => {
        expect(WeightToMg(1, 'invalid' as any)).toBe(0);
    });

    it('handles zero value', () => {
        expect(WeightToMg(0, 'g')).toBe(0);
        expect(WeightToMg(0, 'kg')).toBe(0);
        expect(WeightToMg(0, 'oz')).toBe(0);
        expect(WeightToMg(0, 'lb')).toBe(0);
    });
});

describe('MgToWeight', () => {
    it('converts milligrams to grams', () => {
        expect(MgToWeight(1000, 'g')).toBe(1);
        expect(MgToWeight(500, 'g')).toBe(0.5);
    });

    it('converts milligrams to kilograms', () => {
        expect(MgToWeight(1000000, 'kg')).toBe(1);
    });

    it('converts milligrams to ounces', () => {
        expect(MgToWeight(28349.5, 'oz')).toBe(1);
    });

    it('converts milligrams to pounds (numeric)', () => {
        expect(MgToWeight(453592, 'lb')).toBe(1);
    });

    it('rounds to two decimal places', () => {
        expect(MgToWeight(1500, 'g')).toBe(1.5);
        expect(MgToWeight(1234, 'g')).toBe(1.23);
    });

    it('returns 0 for an unknown unit', () => {
        expect(MgToWeight(1000, 'invalid' as any)).toBe(0);
    });

    it('returns 0 for zero milligrams', () => {
        expect(MgToWeight(0, 'g')).toBe(0);
    });

    it('formats pounds display with lbs and oz', () => {
        // 2.5 lb = 1,133,980 mg → "2lbs 8oz"
        expect(MgToWeight(1133980, 'lb', true)).toBe('2lbs 8oz');
    });

    it('formats pounds display with only oz when less than 1 lb', () => {
        // 0.5 lb = 226,796 mg → "8oz"
        expect(MgToWeight(226796, 'lb', true)).toBe('8oz');
    });

    it('formats pounds display with only lbs when oz is 0', () => {
        // Exactly 1 lb = 453,592 mg → "1lb"
        expect(MgToWeight(453592, 'lb', true)).toBe('1lb');
    });

    it('formats pounds display singular lb', () => {
        expect(MgToWeight(453592, 'lb', true)).toBe('1lb');
    });

    it('formats pounds display plural lbs', () => {
        // 2 lb = 907,184 mg → "2lbs"
        expect(MgToWeight(907184, 'lb', true)).toBe('2lbs');
    });

    it('formats 0 mg in display mode as 0oz', () => {
        expect(MgToWeight(0, 'lb', true)).toBe('0oz');
    });
});
