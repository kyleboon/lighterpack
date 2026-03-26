import { describe, it, expect } from 'vitest';
import { CSVToArray, fullUnitToUnit } from '../../../app/utils/csvParser.js';

describe('CSVToArray', () => {
    it('parses a simple CSV string into a 2D array', () => {
        const result = CSVToArray('a,b,c\n1,2,3');
        expect(result).toEqual([
            ['a', 'b', 'c'],
            ['1', '2', '3'],
        ]);
    });

    it('handles quoted fields containing commas', () => {
        const result = CSVToArray('a,"b,c",d');
        expect(result).toEqual([['a', 'b,c', 'd']]);
    });

    it('handles escaped double quotes inside quoted fields', () => {
        const result = CSVToArray('a,"b""c",d');
        expect(result).toEqual([['a', 'b"c', 'd']]);
    });
});

describe('fullUnitToUnit', () => {
    it('maps full unit names to abbreviations', () => {
        expect(fullUnitToUnit.ounce).toBe('oz');
        expect(fullUnitToUnit.pound).toBe('lb');
        expect(fullUnitToUnit.gram).toBe('g');
        expect(fullUnitToUnit.kilogram).toBe('kg');
    });

    it('maps abbreviation aliases', () => {
        expect(fullUnitToUnit.oz).toBe('oz');
        expect(fullUnitToUnit.lbs).toBe('lb');
        expect(fullUnitToUnit.kgs).toBe('kg');
    });
});
