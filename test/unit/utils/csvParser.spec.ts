import { describe, it, expect } from 'vitest';
import { CSVToArray, fullUnitToUnit, parseCSV } from '../../../app/utils/csvParser';

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

describe('parseCSV', () => {
    it('parses a standard 10-column baseweight CSV', () => {
        const csv = [
            'Item Name,Category,desc,qty,weight,unit,url,price,worn,consumable',
            'Tent,Shelter,3-season,1,32,ounce,https://example.com,350,Worn,',
        ].join('\n');
        const result = parseCSV(csv);
        expect(result).toEqual([
            {
                name: 'Tent',
                category: 'Shelter',
                description: '3-season',
                qty: 1,
                weight: 32,
                unit: 'oz',
                url: 'https://example.com',
                price: 350,
                worn: 1,
                consumable: false,
            },
        ]);
    });

    it('parses a legacy 6-column CSV with headers', () => {
        const csv = ['Item Name,Category,Description,Qty,Weight,Unit', 'Tent,Shelter,My tent,1,500,g'].join('\n');
        const result = parseCSV(csv);
        expect(result).toEqual([
            {
                name: 'Tent',
                category: 'Shelter',
                description: 'My tent',
                qty: 1,
                weight: 500,
                unit: 'g',
                url: '',
                price: 0,
                worn: 0,
                consumable: false,
            },
        ]);
    });

    it('handles columns in a different order', () => {
        const csv = ['unit,weight,qty,Item Name,Category,desc', 'kg,5,2,Pack,Packs,Big pack'].join('\n');
        const result = parseCSV(csv);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Pack');
        expect(result[0].weight).toBe(5);
        expect(result[0].unit).toBe('kg');
    });

    it('falls back to index-based parsing for headerless CSVs', () => {
        const csv = 'Tent,Shelter,3-season tent,1,32,ounce';
        const result = parseCSV(csv);
        expect(result).toEqual([
            {
                name: 'Tent',
                category: 'Shelter',
                description: '3-season tent',
                qty: 1,
                weight: 32,
                unit: 'oz',
                url: '',
                price: 0,
                worn: 0,
                consumable: false,
            },
        ]);
    });

    it('skips rows missing required fields', () => {
        const csv = [
            'Item Name,Category,desc,qty,weight,unit',
            'Tent,Shelter,desc,,32,oz',
            'Stove,Kitchen,desc,1,,oz',
        ].join('\n');
        const result = parseCSV(csv);
        expect(result).toHaveLength(0);
    });

    it('skips rows with unrecognized units', () => {
        const csv = ['Item Name,Category,desc,qty,weight,unit', 'Tent,Shelter,desc,1,32,stone'].join('\n');
        const result = parseCSV(csv);
        expect(result).toHaveLength(0);
    });

    it('defaults optional fields when columns are missing', () => {
        const csv = ['Item Name,qty,weight,unit', 'Tent,1,32,oz'].join('\n');
        const result = parseCSV(csv);
        expect(result[0].category).toBe('');
        expect(result[0].description).toBe('');
        expect(result[0].url).toBe('');
        expect(result[0].price).toBe(0);
        expect(result[0].worn).toBe(0);
        expect(result[0].consumable).toBe(false);
    });

    it('parses worn/consumable truthy values', () => {
        const csv = [
            'Item Name,Category,desc,qty,weight,unit,url,price,worn,consumable',
            'A,Cat,d,1,10,oz,,,Worn,Consumable',
            'B,Cat,d,1,10,oz,,,true,true',
            'C,Cat,d,1,10,oz,,,yes,yes',
            'D,Cat,d,1,10,oz,,,1,1',
            'E,Cat,d,1,10,oz,,,false,false',
            'F,Cat,d,1,10,oz,,,,',
        ].join('\n');
        const result = parseCSV(csv);
        expect(result[0].worn).toBe(1);
        expect(result[0].consumable).toBe(true);
        expect(result[1].worn).toBe(1);
        expect(result[1].consumable).toBe(true);
        expect(result[2].worn).toBe(1);
        expect(result[2].consumable).toBe(true);
        expect(result[3].worn).toBe(1);
        expect(result[3].consumable).toBe(true);
        expect(result[4].worn).toBe(0);
        expect(result[4].consumable).toBe(false);
        expect(result[5].worn).toBe(0);
        expect(result[5].consumable).toBe(false);
    });

    it('parses price and strips currency symbols', () => {
        const csv = [
            'Item Name,Category,desc,qty,weight,unit,url,price,worn,consumable',
            'Tent,Shelter,d,1,32,oz,,$350,,',
            'Stove,Kitchen,d,1,10,oz,,29.99,,',
            'Bag,Shelter,d,1,24,oz,,invalid,,',
        ].join('\n');
        const result = parseCSV(csv);
        expect(result[0].price).toBe(350);
        expect(result[1].price).toBe(29.99);
        expect(result[2].price).toBe(0);
    });
});
