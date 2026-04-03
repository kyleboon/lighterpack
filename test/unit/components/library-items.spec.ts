import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sortablejs', () => ({ default: { create: vi.fn(() => ({ destroy: vi.fn() })) } }));
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store';
import LibraryItems from '../../../app/components/library-items.vue';

describe('LibraryItems component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    function makeItem(overrides = {}) {
        return {
            id: 1,
            name: 'Tent',
            description: 'A nice tent',
            weight: 1000,
            authorUnit: 'oz',
            url: '',
            ...overrides,
        };
    }

    function makeLibrary(items = []) {
        return {
            items,
            defaultListId: 'list1',
            getListById: () => ({ id: 'list1', categoryIds: [] }),
            getCategoryById: () => null,
            getItemsInCurrentList: () => [],
        };
    }

    it('renders the section element', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(LibraryItems);
        expect(wrapper.find('section#libraryContainer').exists()).toBe(true);
    });

    it('filteredItems returns all items when searchText is empty', () => {
        const store = useLighterpackStore();
        const items = [makeItem({ id: 1, name: 'Tent' }), makeItem({ id: 2, name: 'Sleeping bag' })];
        store.library = makeLibrary(items);
        const wrapper = mount(LibraryItems);
        expect(wrapper.vm.filteredItems).toHaveLength(2);
    });

    it('filteredItems filters by name', async () => {
        const store = useLighterpackStore();
        const items = [makeItem({ id: 1, name: 'Tent' }), makeItem({ id: 2, name: 'Sleeping bag', description: '' })];
        store.library = makeLibrary(items);
        const wrapper = mount(LibraryItems);
        await wrapper.find('#librarySearch').setValue('tent');
        expect(wrapper.vm.filteredItems).toHaveLength(1);
        expect(wrapper.vm.filteredItems[0].name).toBe('Tent');
    });

    it('filteredItems filters by description', async () => {
        const store = useLighterpackStore();
        const items = [
            makeItem({ id: 1, name: 'Tent', description: 'ultralight shelter' }),
            makeItem({ id: 2, name: 'Bag', description: 'warm sleeping bag' }),
        ];
        store.library = makeLibrary(items);
        const wrapper = mount(LibraryItems);
        await wrapper.find('#librarySearch').setValue('ultralight');
        expect(wrapper.vm.filteredItems).toHaveLength(1);
        expect(wrapper.vm.filteredItems[0].name).toBe('Tent');
    });

    it('removeItem calls store.initSpeedbump', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.initSpeedbump = vi.fn();
        const wrapper = mount(LibraryItems);
        const item = makeItem();
        wrapper.vm.removeItem(item);
        expect(store.initSpeedbump).toHaveBeenCalled();
    });
});
