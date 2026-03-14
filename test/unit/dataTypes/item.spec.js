import { describe, it, expect } from 'vitest';
import { Item } from '../../../client/dataTypes.js';

describe('Item constructor', () => {
    it('sets default values', () => {
        const item = new Item({ id: 1 });
        expect(item.id).toBe(1);
        expect(item.name).toBe('');
        expect(item.weight).toBe(0);
        expect(item.price).toBe(0.0);
        expect(item.authorUnit).toBe('oz');
    });

    it('uses provided unit', () => {
        const item = new Item({ id: 2, unit: 'g' });
        expect(item.authorUnit).toBe('g');
    });
});

describe('Item.load', () => {
    it('assigns properties from input', () => {
        const item = new Item({ id: 1 });
        item.load({ id: 1, name: 'Tent', weight: 500000, price: 299.99 });
        expect(item.name).toBe('Tent');
        expect(item.weight).toBe(500000);
    });

    it('converts string price to float', () => {
        const item = new Item({ id: 1 });
        item.load({ price: '19.99' });
        expect(item.price).toBe(19.99);
        expect(typeof item.price).toBe('number');
    });

    it('keeps numeric price unchanged', () => {
        const item = new Item({ id: 1 });
        item.load({ price: 29.95 });
        expect(item.price).toBe(29.95);
    });
});

describe('Item.save', () => {
    it('returns the item itself', () => {
        const item = new Item({ id: 1 });
        expect(item.save()).toBe(item);
    });
});
