import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../client/store/store.js';
import List from '../../../client/components/list.vue';

describe('List component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { category: true, listSummary: true };

    function makeCategory(id, overrides = {}) {
        return { id, name: 'Category ' + id, categoryItems: [], ...overrides };
    }

    function makeList(overrides = {}) {
        return {
            id: 'list1',
            name: 'My List',
            description: '',
            categoryIds: [],
            totalWeight: 0,
            ...overrides,
        };
    }

    function makeLibrary(list, categories = []) {
        return {
            defaultListId: list.id,
            optionalFields: { listDescription: false },
            getListById: (id) => (id === list.id ? list : null),
            getCategoryById: (id) => categories.find((c) => c.id === id) || null,
        };
    }

    it('list computed returns store.activeList', () => {
        const store = useLighterpackStore();
        const list = makeList();
        const lib = makeLibrary(list);
        store.library = lib;
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.list).toEqual(list);
    });

    it('categories maps categoryIds to library categories', () => {
        const store = useLighterpackStore();
        const cat1 = makeCategory('cat1');
        const cat2 = makeCategory('cat2');
        const list = makeList({ categoryIds: ['cat1', 'cat2'] });
        const lib = makeLibrary(list, [cat1, cat2]);
        store.library = lib;
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.categories).toHaveLength(2);
        expect(wrapper.vm.categories[0]).toBe(cat1);
        expect(wrapper.vm.categories[1]).toBe(cat2);
    });

    it('isListNew is true when totalWeight is 0', () => {
        const store = useLighterpackStore();
        const list = makeList({ totalWeight: 0 });
        store.library = makeLibrary(list);
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.isListNew).toBe(true);
    });

    it('isListNew is false when totalWeight is non-zero', () => {
        const store = useLighterpackStore();
        const list = makeList({ totalWeight: 1000 });
        store.library = makeLibrary(list);
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.isListNew).toBe(false);
    });

    it('isLocalSaving reflects store.saveType', () => {
        const store = useLighterpackStore();
        const list = makeList();
        store.library = makeLibrary(list);
        store.saveType = 'local';
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.isLocalSaving).toBe(true);
    });

    it('isLocalSaving is false when saveType is not local', () => {
        const store = useLighterpackStore();
        const list = makeList();
        store.library = makeLibrary(list);
        store.saveType = 'server';
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.isLocalSaving).toBe(false);
    });

    it('newCategory calls store.newCategory with the list', () => {
        const store = useLighterpackStore();
        const list = makeList();
        store.library = makeLibrary(list);
        store.newCategory = vi.fn();
        const wrapper = mount(List, { global: { stubs } });
        wrapper.vm.newCategory();
        expect(store.newCategory).toHaveBeenCalledWith(list);
    });
});
