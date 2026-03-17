import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Library } from '../../../shared/dataTypes.js';

describe('Library constructor', () => {
    it('sets default values', () => {
        const lib = new Library();

        expect(lib.version).toBe('0.3');
        expect(lib.totalUnit).toBe('oz');
        expect(lib.itemUnit).toBe('oz');
        expect(lib.showSidebar).toBe(true);
        expect(lib.showImages).toBe(false);
        expect(lib.currencySymbol).toBe('$');
        expect(lib.optionalFields.worn).toBe(true);
        expect(lib.optionalFields.consumable).toBe(true);
    });

    it('firstRun creates one list, one category, one item', () => {
        const lib = new Library();

        expect(lib.lists).toHaveLength(1);
        expect(lib.categories).toHaveLength(1);
        expect(lib.items).toHaveLength(1);
    });

    it('sequence is 3 after firstRun', () => {
        const lib = new Library();

        expect(lib.sequence).toBe(3);
    });

    it('defaultListId points to the first list', () => {
        const lib = new Library();

        expect(lib.getListById(lib.defaultListId)).not.toBeUndefined();
    });
});

describe('Library.nextSequence', () => {
    it('increments and returns the sequence', () => {
        const lib = new Library();
        const before = lib.sequence;

        expect(lib.nextSequence()).toBe(before + 1);
        expect(lib.sequence).toBe(before + 1);
    });
});

describe('Library.newItem', () => {
    it('creates an item and adds it to items and idMap', () => {
        const lib = new Library();
        const before = lib.items.length;

        const item = lib.newItem({});

        expect(lib.items).toHaveLength(before + 1);
        expect(lib.idMap[item.id]).toBe(item);
    });

    it('adds item to category when category provided', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const before = cat.categoryItems.length;

        lib.newItem({ category: cat });

        expect(cat.categoryItems).toHaveLength(before + 1);
    });

    it('uses library itemUnit for new item authorUnit', () => {
        const lib = new Library();
        lib.itemUnit = 'g';

        const item = lib.newItem({});

        expect(item.authorUnit).toBe('g');
    });
});

describe('Library.updateItem', () => {
    it('merges new properties into the existing item', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);

        lib.updateItem({ id: item.id, name: 'Updated', weight: 50000 });

        expect(item.name).toBe('Updated');
        expect(item.weight).toBe(50000);
    });

    it('returns the updated item', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.getItemById(cat.categoryItems[0].itemId);

        const result = lib.updateItem({ id: item.id, name: 'X' });

        expect(result).toBe(item);
    });
});

describe('Library.removeItem', () => {
    it('removes item from items array and idMap', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const itemId = cat.categoryItems[0].itemId;

        lib.removeItem(itemId);

        expect(lib.items.find((i) => i.id === itemId)).toBeUndefined();
        expect(lib.idMap[itemId]).toBeUndefined();
    });

    it('removes item from all categories that reference it', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const itemId = cat.categoryItems[0].itemId;

        lib.removeItem(itemId);

        expect(cat.categoryItems).toHaveLength(0);
    });

    it('returns true on success', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const itemId = cat.categoryItems[0].itemId;

        expect(lib.removeItem(itemId)).toBe(true);
    });
});

describe('Library.newCategory', () => {
    it('creates a category and adds it to categories and idMap', () => {
        const lib = new Library();
        const before = lib.categories.length;

        const cat = lib.newCategory({});

        expect(lib.categories).toHaveLength(before + 1);
        expect(lib.idMap[cat.id]).toBe(cat);
    });

    it('adds category id to list when list provided', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const before = list.categoryIds.length;

        lib.newCategory({ list });

        expect(list.categoryIds).toHaveLength(before + 1);
    });
});

describe('Library.removeCategory', () => {
    beforeEach(() => {
        vi.stubGlobal('alert', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('removes category from categories array, idMap, and its list', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.newCategory({ list });
        const catId = cat.id;

        lib.removeCategory(catId);

        expect(lib.categories.find((c) => c.id === catId)).toBeUndefined();
        expect(lib.idMap[catId]).toBeUndefined();
        expect(list.categoryIds).not.toContain(catId);
    });

    it('blocks removal of last category in a list', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        expect(list.categoryIds).toHaveLength(1);
        const catId = list.categoryIds[0];

        const result = lib.removeCategory(catId);

        expect(result).toBe(false);
        expect(global.alert).toHaveBeenCalled();
        expect(lib.categories.find((c) => c.id === catId)).not.toBeUndefined();
    });

    it('force-removes the last category when force=true', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const catId = list.categoryIds[0];

        const result = lib.removeCategory(catId, true);

        expect(result).toBe(true);
        expect(lib.idMap[catId]).toBeUndefined();
    });

    it('returns true on success', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.newCategory({ list });

        expect(lib.removeCategory(cat.id)).toBe(true);
    });
});

describe('Library.newList', () => {
    it('creates a list and adds it to lists and idMap', () => {
        const lib = new Library();
        const before = lib.lists.length;

        const list = lib.newList();

        expect(lib.lists).toHaveLength(before + 1);
        expect(lib.idMap[list.id]).toBe(list);
    });

    it('does not override defaultListId when one already exists', () => {
        const lib = new Library();
        const originalDefault = lib.defaultListId;

        lib.newList();

        expect(lib.defaultListId).toBe(originalDefault);
    });
});

describe('Library.removeList', () => {
    it('removes list and all its categories from the library', () => {
        const lib = new Library();
        const newList = lib.newList();
        const cat = lib.newCategory({ list: newList });
        const catId = cat.id;
        const listId = newList.id;

        lib.removeList(listId);

        expect(lib.lists.find((l) => l.id === listId)).toBeUndefined();
        expect(lib.idMap[listId]).toBeUndefined();
        expect(lib.idMap[catId]).toBeUndefined();
    });

    it('does nothing when only one list exists', () => {
        const lib = new Library();
        const listId = lib.defaultListId;
        expect(lib.lists).toHaveLength(1);

        lib.removeList(listId);

        expect(lib.lists).toHaveLength(1);
    });

    it('updates defaultListId when the default list is removed', () => {
        const lib = new Library();
        const newList = lib.newList();
        lib.defaultListId = newList.id;

        lib.removeList(newList.id);

        expect(lib.defaultListId).not.toBe(newList.id);
    });
});

describe('Library.copyList', () => {
    it('returns undefined for a non-existent list id', () => {
        const lib = new Library();

        expect(lib.copyList(9999)).toBeUndefined();
    });

    it('creates a new list with same category names and items', () => {
        const lib = new Library();
        const origList = lib.getListById(lib.defaultListId);
        const origCat = lib.getCategoryById(origList.categoryIds[0]);
        origCat.name = 'Shelter';

        const copied = lib.copyList(origList.id);

        expect(copied).not.toBe(origList);
        expect(copied.name).toBe(`Copy of ${origList.name}`);
        expect(copied.categoryIds).toHaveLength(origList.categoryIds.length);

        const copiedCat = lib.getCategoryById(copied.categoryIds[0]);
        expect(copiedCat.name).toBe('Shelter');
        expect(copiedCat.categoryItems).toHaveLength(origCat.categoryItems.length);
    });
});

describe('Library lookup methods', () => {
    it('getItemById returns item from idMap', () => {
        const lib = new Library();
        const item = lib.items[0];

        expect(lib.getItemById(item.id)).toBe(item);
    });

    it('getCategoryById returns category from idMap', () => {
        const lib = new Library();
        const cat = lib.categories[0];

        expect(lib.getCategoryById(cat.id)).toBe(cat);
    });

    it('getListById returns list from idMap', () => {
        const lib = new Library();
        const list = lib.lists[0];

        expect(lib.getListById(list.id)).toBe(list);
    });

    it('returns undefined for unknown ids', () => {
        const lib = new Library();

        expect(lib.getItemById(9999)).toBeUndefined();
    });
});

describe('Library.getItemsInCurrentList', () => {
    it('returns item ids for the default list', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const itemId = cat.categoryItems[0].itemId;

        const ids = lib.getItemsInCurrentList();

        expect(ids).toContain(itemId);
    });

    it('includes items from all categories in the list', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat2 = lib.newCategory({ list });
        const item2 = lib.newItem({ category: cat2 });

        const ids = lib.getItemsInCurrentList();

        expect(ids).toContain(item2.id);
        expect(ids).toHaveLength(2);
    });
});

describe('Library.findCategoryWithItemById', () => {
    it('finds the category containing an item by id', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const itemId = cat.categoryItems[0].itemId;

        expect(lib.findCategoryWithItemById(itemId)).toBe(cat);
    });

    it('scopes search to a specific list when listId provided', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const itemId = cat.categoryItems[0].itemId;

        expect(lib.findCategoryWithItemById(itemId, list.id)).toBe(cat);
    });

    it('returns undefined when item is not found', () => {
        const lib = new Library();

        expect(lib.findCategoryWithItemById(9999)).toBeUndefined();
    });
});

describe('Library.findListWithCategoryById', () => {
    it('returns the list that contains the given category id', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const catId = list.categoryIds[0];

        expect(lib.findListWithCategoryById(catId)).toBe(list);
    });

    it('returns undefined when no list contains the category', () => {
        const lib = new Library();

        expect(lib.findListWithCategoryById(9999)).toBeUndefined();
    });
});

describe('Library.save', () => {
    it('returns a plain object with version, sequence, and units', () => {
        const lib = new Library();

        const saved = lib.save();

        expect(saved.version).toBe('0.3');
        expect(saved.sequence).toBe(lib.sequence);
        expect(saved.totalUnit).toBe('oz');
        expect(saved.itemUnit).toBe('oz');
        expect(saved.currencySymbol).toBe('$');
    });

    it('serializes items, categories, and lists as arrays', () => {
        const lib = new Library();

        const saved = lib.save();

        expect(Array.isArray(saved.items)).toBe(true);
        expect(Array.isArray(saved.categories)).toBe(true);
        expect(Array.isArray(saved.lists)).toBe(true);
        expect(saved.items).toHaveLength(lib.items.length);
        expect(saved.categories).toHaveLength(lib.categories.length);
        expect(saved.lists).toHaveLength(lib.lists.length);
    });

    it('saved categories do not include library reference', () => {
        const lib = new Library();

        const saved = lib.save();

        expect(saved.categories[0].library).toBeUndefined();
    });

    it('saved lists do not include library reference or chart', () => {
        const lib = new Library();

        const saved = lib.save();

        expect(saved.lists[0].library).toBeUndefined();
        expect(saved.lists[0].chart).toBeUndefined();
    });
});

describe('Library.load', () => {
    it('round-trips save/load and preserves structure', () => {
        const lib = new Library();
        const list = lib.getListById(lib.defaultListId);
        const cat = lib.getCategoryById(list.categoryIds[0]);
        const item = lib.items[0];
        item.name = 'Sleeping Bag';
        item.weight = 500000;
        cat.name = 'Sleep System';
        list.name = 'Summer Trip';

        const serialized = lib.save();

        const lib2 = new Library();
        lib2.load(serialized);

        expect(lib2.items).toHaveLength(1);
        expect(lib2.items[0].name).toBe('Sleeping Bag');
        expect(lib2.items[0].weight).toBe(500000);
        expect(lib2.categories).toHaveLength(1);
        expect(lib2.categories[0].name).toBe('Sleep System');
        expect(lib2.lists).toHaveLength(1);
        expect(lib2.lists[0].name).toBe('Summer Trip');
    });

    it('restores totalUnit, itemUnit, and currencySymbol', () => {
        const lib = new Library();
        lib.totalUnit = 'g';
        lib.itemUnit = 'g';
        lib.currencySymbol = '€';

        const lib2 = new Library();
        lib2.load(lib.save());

        expect(lib2.totalUnit).toBe('g');
        expect(lib2.itemUnit).toBe('g');
        expect(lib2.currencySymbol).toBe('€');
    });

    it('rebuilds idMap so items, categories, lists are all reachable by id', () => {
        const lib = new Library();
        const serialized = lib.save();

        const lib2 = new Library();
        lib2.load(serialized);

        const item = lib2.items[0];
        const cat = lib2.categories[0];
        const list = lib2.lists[0];
        expect(lib2.getItemById(item.id)).toBe(item);
        expect(lib2.getCategoryById(cat.id)).toBe(cat);
        expect(lib2.getListById(list.id)).toBe(list);
    });

    it('applies upgrade from version 0.1 to 0.3', () => {
        const lib = new Library();
        const serialized = lib.save();
        serialized.version = '0.1';
        delete serialized.optionalFields;

        const lib2 = new Library();
        lib2.load(serialized);

        expect(lib2.version).toBe('0.3');
        expect(lib2.optionalFields).toBeDefined();
    });

    it('applies upgrade from version 0.2 to 0.3', () => {
        const lib = new Library();
        const serialized = lib.save();
        serialized.version = '0.2';

        const lib2 = new Library();
        lib2.load(serialized);

        expect(lib2.version).toBe('0.3');
    });
});

describe('Library.upgrade01to02', () => {
    it('adds optionalFields when missing', () => {
        const lib = new Library();
        const data = { version: '0.1', showImages: false };

        lib.upgrade01to02(data);

        expect(data.optionalFields).toBeDefined();
        expect(data.version).toBe('0.2');
    });

    it('sets images true when showImages was true', () => {
        const lib = new Library();
        const data = { version: '0.1', showImages: true };

        lib.upgrade01to02(data);

        expect(data.optionalFields.images).toBe(true);
    });

    it('sets images false when showImages was false', () => {
        const lib = new Library();
        const data = { version: '0.1', showImages: false };

        lib.upgrade01to02(data);

        expect(data.optionalFields.images).toBe(false);
    });
});

describe('Library.sequenceShouldBeCorrect', () => {
    it('sets sequence to max id + 1', () => {
        const lib = new Library();
        const data = {
            lists: [{ id: 5 }],
            categories: [{ id: 3 }],
            items: [{ id: 8 }],
        };

        lib.sequenceShouldBeCorrect(data);

        expect(data.sequence).toBe(9);
    });

    it('handles an empty dataset', () => {
        const lib = new Library();
        const data = { lists: [], categories: [], items: [] };

        lib.sequenceShouldBeCorrect(data);

        expect(data.sequence).toBe(1);
    });
});

describe('Library.idsShouldBeInts', () => {
    it('converts string categoryIds to integers', () => {
        const lib = new Library();
        const data = {
            lists: [{ categoryIds: ['1', '2', '3'] }],
        };

        lib.idsShouldBeInts(data);

        expect(data.lists[0].categoryIds).toEqual([1, 2, 3]);
    });
});

describe('Library.renameCategoryIds', () => {
    it('renames itemIds to categoryItems when categoryItems is empty', () => {
        const lib = new Library();
        const data = {
            categories: [{ itemIds: [{ itemId: 1, qty: 1 }], categoryItems: [] }],
        };

        lib.renameCategoryIds(data);

        expect(data.categories[0].categoryItems).toHaveLength(1);
        expect(data.categories[0].itemIds).toBeUndefined();
    });

    it('drops itemIds when categoryItems already has entries', () => {
        const lib = new Library();
        const data = {
            categories: [
                {
                    itemIds: [{ itemId: 1, qty: 1 }],
                    categoryItems: [{ itemId: 2, qty: 1 }],
                },
            ],
        };

        lib.renameCategoryIds(data);

        expect(data.categories[0].itemIds).toBeUndefined();
        expect(data.categories[0].categoryItems).toHaveLength(1);
        expect(data.categories[0].categoryItems[0].itemId).toBe(2);
    });

    it('initializes categoryItems to empty array when undefined', () => {
        const lib = new Library();
        const data = { categories: [{ id: 1 }] };

        lib.renameCategoryIds(data);

        expect(data.categories[0].categoryItems).toEqual([]);
    });
});

describe('Library.fixDuplicateIds', () => {
    it('reassigns duplicate item ids', () => {
        const lib = new Library();
        const data = {
            sequence: 10,
            items: [
                { id: 5 },
                { id: 5 }, // duplicate
            ],
            categories: [],
            lists: [],
        };

        lib.fixDuplicateIds(data);

        const ids = data.items.map((i) => i.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('reassigns duplicate category ids and updates list references', () => {
        const lib = new Library();
        const data = {
            sequence: 10,
            items: [],
            categories: [
                { id: 3, categoryItems: [] },
                { id: 3, categoryItems: [] }, // duplicate
            ],
            lists: [{ id: 1, categoryIds: [3, 3] }],
        };

        lib.fixDuplicateIds(data);

        const catIds = data.categories.map((c) => c.id);
        expect(new Set(catIds).size).toBe(catIds.length);
    });

    it('updates categoryItem itemIds when item id is reassigned', () => {
        const lib = new Library();
        const data = {
            sequence: 10,
            items: [
                { id: 2 },
                { id: 2 }, // duplicate
            ],
            categories: [{ id: 1, categoryItems: [{ itemId: 2 }] }],
            lists: [],
        };

        lib.fixDuplicateIds(data);

        // item[1] got a new id; the categoryItem should be updated to that new id
        const newItemId = data.items[1].id;
        expect(newItemId).not.toBe(2);
        expect(data.categories[0].categoryItems[0].itemId).toBe(newItemId);
    });
});
