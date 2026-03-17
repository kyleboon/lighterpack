import { describe, it, expect } from 'vitest';
import { Category, Item, Library } from '../../../shared/dataTypes.js';

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

    it('skips missing items gracefully', () => {
        const library = makeLibrary();
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 999, qty: 1 }); // item not in library

        cat.calculateSubtotal();

        expect(cat.subtotalWeight).toBe(0);
        expect(cat.subtotalQty).toBe(0);
    });

    it('does not add worn weight when worn flag is disabled in library', () => {
        const item = new Item({ id: 1 });
        item.weight = 50000;

        const lib = makeLibrary([item]);
        lib.optionalFields.worn = false;
        const cat = new Category({ id: 1, library: lib });
        cat.addItem({ itemId: 1, qty: 1, worn: 1 });

        cat.calculateSubtotal();

        expect(cat.subtotalWornWeight).toBe(0);
    });

    it('does not add consumable weight when consumable flag is disabled in library', () => {
        const item = new Item({ id: 1 });
        item.weight = 30000;
        item.price = 5;

        const lib = makeLibrary([item]);
        lib.optionalFields.consumable = false;
        const cat = new Category({ id: 1, library: lib });
        cat.addItem({ itemId: 1, qty: 2, consumable: true });

        cat.calculateSubtotal();

        expect(cat.subtotalConsumableWeight).toBe(0);
        expect(cat.subtotalConsumablePrice).toBe(0);
    });

    it('worn weight counts 1 per item regardless of qty', () => {
        const item = new Item({ id: 1 });
        item.weight = 50000;

        const library = makeLibrary([item]);
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 1, qty: 3, worn: 1 });

        cat.calculateSubtotal();

        // worn weight uses qty > 0 ? 1 : 0 multiplier
        expect(cat.subtotalWornWeight).toBe(50000);
    });
});

describe('Category.getExtendedItemByIndex', () => {
    it('merges item and categoryItem properties', () => {
        const item = new Item({ id: 1 });
        item.name = 'Tent';
        item.weight = 100000;

        const library = makeLibrary([item]);
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 1, qty: 2, worn: 1 });

        const extended = cat.getExtendedItemByIndex(0);

        expect(extended.name).toBe('Tent');
        expect(extended.weight).toBe(100000);
        expect(extended.qty).toBe(2);
        expect(extended.worn).toBe(1);
    });

    it('categoryItem fields override item fields', () => {
        const item = new Item({ id: 1 });
        item.id = 1;

        const library = makeLibrary([item]);
        const cat = new Category({ id: 1, library });
        cat.addItem({ itemId: 1, qty: 5 });

        const extended = cat.getExtendedItemByIndex(0);

        expect(extended.qty).toBe(5);
    });
});

describe('Category.save', () => {
    it('returns a plain object without library or _isNew', () => {
        const library = makeLibrary();
        const cat = new Category({ id: 1, library, _isNew: true });
        cat.name = 'Shelter';

        const saved = cat.save();

        expect(saved.library).toBeUndefined();
        expect(saved._isNew).toBeUndefined();
        expect(saved.name).toBe('Shelter');
        expect(saved.id).toBe(1);
    });

    it('does not mutate the original category', () => {
        const library = makeLibrary();
        const cat = new Category({ id: 1, library });

        cat.save();

        expect(cat.library).toBe(library);
    });
});

describe('Category.load', () => {
    it('assigns properties from input and removes _isNew', () => {
        const library = makeLibrary();
        const cat = new Category({ id: 1, library });

        cat.load({ name: 'Kitchen', categoryItems: [], _isNew: true });

        expect(cat.name).toBe('Kitchen');
        expect(cat._isNew).toBeUndefined();
    });

    it('removes price field from categoryItems', () => {
        const item = new Item({ id: 10 });
        const library = makeLibrary([item]);
        const cat = new Category({ id: 1, library });

        cat.load({
            categoryItems: [{ itemId: 10, qty: 1, star: 1, price: 9.99 }],
        });

        expect(cat.categoryItems[0].price).toBeUndefined();
    });

    it('sets star to 0 if missing', () => {
        const item = new Item({ id: 10 });
        const library = makeLibrary([item]);
        const cat = new Category({ id: 1, library });

        cat.load({ categoryItems: [{ itemId: 10, qty: 1 }] });

        expect(cat.categoryItems[0].star).toBe(0);
    });

    it('removes categoryItems whose item does not exist in library', () => {
        const library = makeLibrary(); // empty library
        const cat = new Category({ id: 1, library });

        cat.load({ categoryItems: [{ itemId: 999, qty: 1, star: 0 }] });

        expect(cat.categoryItems).toHaveLength(0);
    });
});
