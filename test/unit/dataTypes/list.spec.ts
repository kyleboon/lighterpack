import { describe, it, expect } from 'vitest';
import { Library } from '../../../shared/dataTypes';

// Use a real Library so List has a proper wired-up context.
// After new Library(), sequence=3, defaultListId=1, one list/category/item exist.
function makeLib() {
    return new Library();
}

describe('List constructor', () => {
    it('sets default values', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);

        expect(list.name).toBe('');
        expect(list.description).toBe('');
        expect(list.externalId).toBe('');
        expect(list.categoryIds).toBeInstanceOf(Array);
        expect(list.totalWeight).toBe(0);
        expect(list.totalPrice).toBe(0);
        expect(list.totalQty).toBe(0);
    });
});

describe('List.addCategory', () => {
    it('appends the category id', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const before = list.categoryIds.length;

        list.addCategory(99);

        expect(list.categoryIds).toHaveLength(before + 1);
        expect(list.categoryIds.at(-1)).toBe(99);
    });
});

describe('List.removeCategory', () => {
    it('removes an existing category id', () => {
        const lib = makeLib();
        const list = lib.newList();
        const cat = lib.newCategory({ list });
        const catId = cat.id;

        const result = list.removeCategory(catId);

        expect(result).toBe(true);
        expect(list.categoryIds).not.toContain(catId);
    });

    it('removes by string-coerced id when integer lookup fails', () => {
        const lib = makeLib();
        const list = lib.newList();
        const cat = lib.newCategory({ list });
        // Manually insert as string to simulate legacy data
        list.categoryIds = [`${cat.id}`];

        const result = list.removeCategory(cat.id);

        expect(result).toBe(true);
        expect(list.categoryIds).toHaveLength(0);
    });

    it('returns false if category id not found', () => {
        const lib = makeLib();
        const list = lib.newList();

        const result = list.removeCategory(9999);

        expect(result).toBe(false);
    });
});

describe('List.calculateTotals', () => {
    it('sums weight, price, and qty from all categories', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);

        item.weight = 200000;
        item.price = 25;
        cat.categoryItems[0].qty = 3;

        list.calculateTotals();

        expect(list.totalWeight).toBe(600000);
        expect(list.totalPrice).toBe(75);
        expect(list.totalQty).toBe(3);
    });

    it('computes base weight as total minus worn and consumable', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);

        item.weight = 100000;
        cat.categoryItems[0].qty = 1;
        cat.categoryItems[0].consumable = true;

        list.calculateTotals();

        expect(list.totalConsumableWeight).toBe(100000);
        expect(list.totalBaseWeight).toBe(0);
        expect(list.totalPackWeight).toBe(100000);
    });

    it('computes pack weight as total minus worn', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);

        item.weight = 100000;
        cat.categoryItems[0].qty = 1;
        cat.categoryItems[0].worn = 1;

        list.calculateTotals();

        expect(list.totalWornWeight).toBe(100000);
        expect(list.totalPackWeight).toBe(0);
        expect(list.totalBaseWeight).toBe(0);
    });

    it('returns zero totals when categories have no items with weight', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);

        list.calculateTotals();

        expect(list.totalWeight).toBe(0);
        expect(list.totalPrice).toBe(0);
    });
});

describe('List.renderChart', () => {
    it('returns false when total weight is zero', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);

        const result = list.renderChart('total');

        expect(result).toBe(false);
    });

    it('returns chart data with correct total for "total" type', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);
        item.weight = 100000;
        cat.categoryItems[0].qty = 1;

        const chart = list.renderChart('total');

        expect(chart).not.toBe(false);
        expect(chart.total).toBe(100000);
    });

    it('uses consumable weight for "consumable" type', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);
        item.weight = 50000;
        cat.categoryItems[0].qty = 1;
        cat.categoryItems[0].consumable = true;

        const chart = list.renderChart('consumable');

        expect(chart).not.toBe(false);
        expect(chart.total).toBe(50000);
    });

    it('uses worn weight for "worn" type', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);
        item.weight = 40000;
        cat.categoryItems[0].qty = 1;
        cat.categoryItems[0].worn = 1;

        const chart = list.renderChart('worn');

        expect(chart).not.toBe(false);
        expect(chart.total).toBe(40000);
    });

    it('uses base weight (total minus consumable and worn) for "base" type', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);
        item.weight = 60000;
        cat.categoryItems[0].qty = 1;
        // not consumable, not worn — all weight is base weight

        const chart = list.renderChart('base');

        expect(chart).not.toBe(false);
        expect(chart.total).toBe(60000);
    });

    it('chart points include category id and percent', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);
        item.weight = 100000;
        cat.categoryItems[0].qty = 1;

        const chart = list.renderChart('total');

        const firstCategory = Object.values(chart.points)[0];
        expect(firstCategory.id).toBe(cat.id);
        expect(firstCategory.percent).toBeCloseTo(1.0);
    });

    it('omits parent references when linkParent is false', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);
        item.weight = 100000;
        cat.categoryItems[0].qty = 1;

        const chart = list.renderChart('total', false);

        const firstCategory = Object.values(chart.points)[0];
        expect(firstCategory.parent).toBeUndefined();
    });
});

describe('List.save', () => {
    it('excludes library and chart from output', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        list.chart = { some: 'data' };

        const saved = list.save();

        expect(saved.library).toBeUndefined();
        expect(saved.chart).toBeUndefined();
        expect(saved.id).toBe(list.id);
    });

    it('does not mutate the original list', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);

        list.save();

        expect(list.library).toBe(lib);
    });
});

describe('List.load', () => {
    it('assigns input and recalculates totals', () => {
        const lib = makeLib();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);
        item.weight = 100000;
        cat.categoryItems[0].qty = 1;

        list.load({ name: 'Loaded', categoryIds: list.categoryIds });

        expect(list.name).toBe('Loaded');
        expect(list.totalWeight).toBe(100000);
    });
});
