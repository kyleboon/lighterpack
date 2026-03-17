import { describe, it, expect } from 'vitest';
import weightUtils from '../../../shared/utils/weight.js';

const { WeightToMg, MgToWeight } = weightUtils;

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
});
