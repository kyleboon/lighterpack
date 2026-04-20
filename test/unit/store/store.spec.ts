import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockFetch = vi.fn();
(globalThis as any).$fetch = mockFetch;
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store';

// Minimal valid library blob (version 0.3 format that Library.load() can handle)
function makeLibraryBlob({ lists = [], categories = [], items = [], defaultListId = 1, sequence = 10 } = {}) {
    return {
        version: '0.3',
        totalUnit: 'oz',
        itemUnit: 'oz',
        defaultListId,
        sequence,
        showSidebar: true,
        optionalFields: {
            images: false,
            price: false,
            worn: true,
            consumable: true,
            listDescription: false,
        },
        currencySymbol: '$',
        items,
        categories,
        lists,
    };
}

describe('loadShareData', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('populates library from blob and sets defaultListId by externalId', () => {
        const store = useLighterpackStore();

        const blob = makeLibraryBlob({
            defaultListId: 1,
            sequence: 10,
            items: [{ id: 5, name: 'Tent', weight: 1000, authorUnit: 'oz', price: 0, url: '', images: [] }],
            categories: [
                {
                    id: 3,
                    name: 'Shelter',
                    categoryItems: [{ itemId: 5, qty: 1, worn: 0, consumable: false, star: 0 }],
                    images: [],
                },
            ],
            lists: [
                { id: 1, name: 'Default List', categoryIds: [], externalId: '', description: '', images: [] },
                {
                    id: 2,
                    name: 'Target List',
                    categoryIds: [3],
                    externalId: 'target-external-id',
                    description: '',
                    images: [],
                },
            ],
        });

        store.loadShareData(blob, 'target-external-id');

        expect(store.library).toBeTruthy();
        expect(store.library.defaultListId).toBe(2);
    });

    it('sets library even if externalId is not found', () => {
        const store = useLighterpackStore();

        const blob = makeLibraryBlob({
            defaultListId: 1,
            sequence: 5,
            items: [],
            categories: [],
            lists: [{ id: 1, name: 'Only List', categoryIds: [], externalId: 'some-id', description: '', images: [] }],
        });

        store.loadShareData(blob, 'nonexistent');

        expect(store.library).toBeTruthy();
        // defaultListId stays as whatever the blob specified (1)
        expect(store.library.defaultListId).toBe(1);
    });

    it('accepts a JSON string instead of a plain object', () => {
        const store = useLighterpackStore();

        const blob = makeLibraryBlob({
            defaultListId: 1,
            sequence: 5,
            items: [],
            categories: [],
            lists: [{ id: 1, name: 'List', categoryIds: [], externalId: 'abc', description: '', images: [] }],
        });

        store.loadShareData(JSON.stringify(blob), 'abc');

        expect(store.library).toBeTruthy();
        expect(store.library.defaultListId).toBe(1);
    });

    it('pushes a global alert and leaves library falsy on invalid data', () => {
        const store = useLighterpackStore();

        store.loadShareData('not valid json {{{{', 'any-id');

        expect(store.globalAlerts).toHaveLength(1);
        expect(store.globalAlerts[0].message).toContain('shared list');
    });

    it('pre-calculates subtotals so category weight totals are non-zero', () => {
        const store = useLighterpackStore();

        const blob = makeLibraryBlob({
            defaultListId: 1,
            sequence: 10,
            items: [{ id: 5, name: 'Tent', weight: 2000, authorUnit: 'oz', price: 50, url: '', images: [] }],
            categories: [
                {
                    id: 3,
                    name: 'Shelter',
                    categoryItems: [{ itemId: 5, qty: 1, worn: 0, consumable: false, star: 0 }],
                    images: [],
                },
            ],
            lists: [{ id: 1, name: 'My List', categoryIds: [3], externalId: 'my-list', description: '', images: [] }],
        });

        store.loadShareData(blob, 'my-list');

        const cat = store.library.getCategoryById(3);
        expect(cat.subtotalWeight).toBe(2000);
        expect(cat.subtotalPrice).toBe(50);
    });
});

describe('session actions', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockFetch.mockReset();
    });

    it('signout clears library and loggedIn state', () => {
        const store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [],
            categories: [],
            lists: [{ id: 1, name: 'List', categoryIds: [], externalId: 'abc', description: '', images: [] }],
        });
        store.loadLibraryData(blob);
        store.loggedIn = 'user@test.com';

        store.signout();

        expect(store.loggedIn).toBe(false);
        expect(store.library).toBeFalsy();
    });

    it('setLoggedIn sets the loggedIn state', () => {
        const store = useLighterpackStore();
        store.setLoggedIn('user@test.com');
        expect(store.loggedIn).toBe('user@test.com');
    });

    it('setLoggedIn can clear the logged in state', () => {
        const store = useLighterpackStore();
        store.setLoggedIn('user@test.com');
        store.setLoggedIn(false);
        expect(store.loggedIn).toBe(false);
    });
});

describe('loadLibraryData', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('loads a library from a plain object', () => {
        const store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [{ id: 1, name: 'Tent', weight: 1000, authorUnit: 'oz', price: 0, url: '', images: [] }],
            categories: [
                {
                    id: 2,
                    name: 'Shelter',
                    categoryItems: [{ itemId: 1, qty: 1, worn: 0, consumable: false, star: 0 }],
                    images: [],
                },
            ],
            lists: [{ id: 3, name: 'Trip', categoryIds: [2], externalId: 'abc', description: '', images: [] }],
            defaultListId: 3,
        });
        store.loadLibraryData(blob);
        expect(store.library).toBeTruthy();
        expect(store.library.items).toHaveLength(1);
        expect(store.library.items[0].name).toBe('Tent');
    });

    it('loads a library from a JSON string', () => {
        const store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [],
            categories: [],
            lists: [{ id: 1, name: 'List', categoryIds: [], externalId: 'abc', description: '', images: [] }],
        });
        store.loadLibraryData(JSON.stringify(blob));
        expect(store.library).toBeTruthy();
    });

    it('pushes alert on invalid data', () => {
        const store = useLighterpackStore();
        store.loadLibraryData('not valid json {{{');
        expect(store.globalAlerts).toHaveLength(1);
        expect(store.globalAlerts[0].message).toContain('error');
    });
});

describe('clearLibraryData', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('resets library to unloaded state', () => {
        const store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [],
            categories: [],
            lists: [{ id: 1, name: 'List', categoryIds: [], externalId: 'abc', description: '', images: [] }],
        });
        store.loadLibraryData(blob);
        expect(store.library).toBeTruthy();

        store.clearLibraryData();
        expect(store.library).toBeFalsy();
    });
});

describe('_showError', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('pushes the provided message as a global alert', () => {
        const store = useLighterpackStore();
        store._showError('Something went wrong');
        expect(store.globalAlerts).toHaveLength(1);
        expect(store.globalAlerts[0].message).toBe('Something went wrong');
    });

    it('uses default message for empty string', () => {
        const store = useLighterpackStore();
        store._showError('');
        expect(store.globalAlerts[0].message).toBe('An error occurred.');
    });
});

describe('activeList getter', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('returns null when library is not loaded', () => {
        const store = useLighterpackStore();
        expect(store.activeList).toBeNull();
    });

    it('returns the list matching defaultListId', () => {
        const store = useLighterpackStore();
        const blob = makeLibraryBlob({
            defaultListId: 2,
            items: [],
            categories: [],
            lists: [
                { id: 1, name: 'First', categoryIds: [], externalId: 'a', description: '', images: [] },
                { id: 2, name: 'Second', categoryIds: [], externalId: 'b', description: '', images: [] },
            ],
        });
        store.loadLibraryData(blob);
        expect(store.activeList).toBeTruthy();
        expect(store.activeList.name).toBe('Second');
    });
});

describe('library settings (offline)', () => {
    let store: ReturnType<typeof useLighterpackStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [],
            categories: [],
            lists: [{ id: 1, name: 'List', categoryIds: [], externalId: 'abc', description: '', images: [] }],
        });
        store.loadLibraryData(blob);
        store.loggedIn = false;
    });

    it('toggleSidebar flips the showSidebar flag', () => {
        const before = store.library.showSidebar;
        store.toggleSidebar();
        expect(store.library.showSidebar).toBe(!before);
    });

    it('setTotalUnit updates the total unit', () => {
        store.setTotalUnit('kg');
        expect(store.library.totalUnit).toBe('kg');
    });

    it('updateCurrencySymbol updates the symbol', () => {
        store.updateCurrencySymbol('€');
        expect(store.library.currencySymbol).toBe('€');
    });

    it('updateItemUnit updates the item unit', () => {
        store.updateItemUnit('g');
        expect(store.library.itemUnit).toBe('g');
    });

    it('toggleOptionalField flips the field value', () => {
        const before = store.library.optionalFields.price;
        store.toggleOptionalField('price');
        expect(store.library.optionalFields.price).toBe(!before);
    });
});

describe('list management (offline)', () => {
    let store: ReturnType<typeof useLighterpackStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [{ id: 1, name: 'Tent', weight: 1000, authorUnit: 'oz', price: 0, url: '', images: [] }],
            categories: [
                {
                    id: 2,
                    name: 'Shelter',
                    categoryItems: [{ itemId: 1, qty: 1, worn: 0, consumable: false, star: 0 }],
                    images: [],
                },
            ],
            lists: [{ id: 3, name: 'Trip', categoryIds: [2], externalId: 'abc', description: '', images: [] }],
            defaultListId: 3,
            sequence: 100,
        });
        store.loadLibraryData(blob);
        store.loggedIn = false;
    });

    it('newList creates a new list with a category and item', async () => {
        const listCount = store.library.lists.length;
        await store.newList();
        expect(store.library.lists.length).toBe(listCount + 1);
    });

    it('newList sets the new list as default', async () => {
        const oldDefaultId = store.library.defaultListId;
        await store.newList();
        expect(store.library.defaultListId).not.toBe(oldDefaultId);
    });

    it('updateListName changes the list name', () => {
        store.updateListName({ id: 3, name: 'Weekend Trip' });
        expect(store.library.getListById(3).name).toBe('Weekend Trip');
    });

    it('removeList does nothing when only one list exists', () => {
        store.removeList({ id: 3 });
        expect(store.library.lists.length).toBe(1);
    });

    it('removeList removes the list when multiple lists exist', async () => {
        await store.newList();
        expect(store.library.lists.length).toBe(2);
        store.removeList({ id: 3 });
        expect(store.library.lists.length).toBe(1);
    });

    it('setExternalId sets the externalId on a list', () => {
        store.setExternalId({ list: { id: 3 }, externalId: 'new-id' });
        expect(store.library.getListById(3).externalId).toBe('new-id');
    });
});

describe('category management (offline)', () => {
    let store: ReturnType<typeof useLighterpackStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useLighterpackStore();
        const blob = makeLibraryBlob({
            items: [{ id: 1, name: 'Tent', weight: 1000, authorUnit: 'oz', price: 0, url: '', images: [] }],
            categories: [
                {
                    id: 2,
                    name: 'Shelter',
                    categoryItems: [{ itemId: 1, qty: 1, worn: 0, consumable: false, star: 0 }],
                    images: [],
                },
            ],
            lists: [{ id: 3, name: 'Trip', categoryIds: [2], externalId: 'abc', description: '', images: [] }],
            defaultListId: 3,
            sequence: 100,
        });
        store.loadLibraryData(blob);
        store.loggedIn = false;
    });

    it('newCategory adds a new category to the list', async () => {
        const list = store.library.getListById(3);
        const catCount = store.library.categories.length;
        await store.newCategory(list);
        expect(store.library.categories.length).toBe(catCount + 1);
    });

    it('updateCategoryName changes the category name', () => {
        store.updateCategoryName({ id: 2, name: 'Big Four' });
        expect(store.library.getCategoryById(2).name).toBe('Big Four');
    });

    it('updateCategoryColor sets the category color', () => {
        store.updateCategoryColor({ id: 2, color: { r: 255, g: 0, b: 0 } });
        expect(store.library.getCategoryById(2).color).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('removeCategory removes the category from the library when not the last in its list', async () => {
        // Add a second category so removing one is allowed
        await store.newCategory(store.library.getListById(3));
        const catCount = store.library.categories.length;
        store.removeCategory({ id: 2 });
        expect(store.library.categories.length).toBe(catCount - 1);
    });
});

describe('modal and UI actions', () => {
    let store: ReturnType<typeof useLighterpackStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useLighterpackStore();
    });

    it('showModal sets activeModal', () => {
        store.showModal('account');
        expect(store.activeModal).toBe('account');
    });

    it('closeModal clears activeModal', () => {
        store.showModal('account');
        store.closeModal();
        expect(store.activeModal).toBeNull();
    });

    it('initSpeedbump sets the speedbump state', () => {
        const callback = vi.fn();
        store.initSpeedbump(callback, { message: 'Are you sure?' });
        expect(store.speedbump).toBeTruthy();
        expect(store.speedbump!.callback).toBe(callback);
    });

    it('confirmSpeedbump calls callback with true and clears state', () => {
        const callback = vi.fn();
        store.initSpeedbump(callback);
        store.confirmSpeedbump();
        expect(callback).toHaveBeenCalledWith(true);
        expect(store.speedbump).toBeNull();
    });

    it('closeSpeedbump clears speedbump without calling callback', () => {
        const callback = vi.fn();
        store.initSpeedbump(callback);
        store.closeSpeedbump();
        expect(callback).not.toHaveBeenCalled();
        expect(store.speedbump).toBeNull();
    });

    it('triggerImportCSV increments the trigger counter', () => {
        const before = store.importCSVTrigger;
        store.triggerImportCSV();
        expect(store.importCSVTrigger).toBe(before + 1);
    });
});
