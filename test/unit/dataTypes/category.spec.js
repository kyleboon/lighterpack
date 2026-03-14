import { describe, it, expect } from 'vitest';
import { Category, Item } from '../../../client/dataTypes.js';

function makeLibrary(items = []) {
    const idMap = {};
    items.forEach((item) => {
        idMap[item.id] = item;
    });
    return {
        getItemById: (id) => idMap[id] || null,
        optionalFields: { worn: true, consumable: true },
    };
}

describe('Category.addItem', () => {
    it('adds a category item with defaults', () => {
        const library = makeLibrary();
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 42 });
        expect(cat.categoryItems).toHaveLength(1);
        expect(cat.categoryItems[0].itemId).toBe(42);
        expect(cat.categoryItems[0].qty).toBe(1);
        expect(cat.categoryItems[0].worn).toBe(0);
    });

    it('merges provided fields over defaults', () => {
        const library = makeLibrary();
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 10, qty: 3, worn: 1 });
        expect(cat.categoryItems[0].qty).toBe(3);
        expect(cat.categoryItems[0].worn).toBe(1);
    });
});

describe('Category.getCategoryItemById', () => {
    it('finds existing item', () => {
        const library = makeLibrary();
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 7 });
        expect(cat.getCategoryItemById(7)).not.toBeNull();
    });

    it('returns null for missing item', () => {
        const library = makeLibrary();
        const cat = new Category({ id: 1, library });
        expect(cat.getCategoryItemById(99)).toBeNull();
    });
});

describe('Category.removeItem', () => {
    it('removes the item from categoryItems', () => {
        const library = makeLibrary();
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 5 });
        cat.addItem({ itemId: 6 });
        cat.removeItem(5);
        expect(cat.categoryItems).toHaveLength(1);
        expect(cat.categoryItems[0].itemId).toBe(6);
    });
});

describe('Category.updateCategoryItem', () => {
    it('merges updates into existing category item', () => {
        const library = makeLibrary();
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 3, qty: 1 });
        cat.updateCategoryItem({ itemId: 3, qty: 4 });
        expect(cat.getCategoryItemById(3).qty).toBe(4);
    });
});

describe('Category.calculateSubtotal', () => {
    it('sums weight and price across items', () => {
        const item1 = new Item({ id: 1 });
        item1.weight = 100000;
        item1.price = 10;
        const item2 = new Item({ id: 2 });
        item2.weight = 200000;
        item2.price = 20;

        const library = makeLibrary([item1, item2]);
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 1, qty: 1 });
        cat.addItem({ itemId: 2, qty: 2 });

        cat.calculateSubtotal();

        expect(cat.subtotalWeight).toBe(500000);
        expect(cat.subtotalPrice).toBe(50);
        expect(cat.subtotalQty).toBe(3);
    });

    it('counts worn weight for worn items', () => {
        const item = new Item({ id: 1 });
        item.weight = 50000;

        const library = makeLibrary([item]);
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 1, qty: 2, worn: 1 });

        cat.calculateSubtotal();

        expect(cat.subtotalWornWeight).toBe(50000);
    });

    it('counts consumable weight and price', () => {
        const item = new Item({ id: 1 });
        item.weight = 30000;
        item.price = 5;

        const library = makeLibrary([item]);
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 1, qty: 3, consumable: true });

        cat.calculateSubtotal();

        expect(cat.subtotalConsumableWeight).toBe(90000);
        expect(cat.subtotalConsumablePrice).toBe(15);
    });
});
