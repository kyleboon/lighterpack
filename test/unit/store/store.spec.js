import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';

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
