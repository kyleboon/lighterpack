import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sortablejs', () => ({ default: { create: vi.fn(() => ({ destroy: vi.fn() })) } }));
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store';
import LibraryLists from '../../../app/components/library-lists.vue';

const PopoverHoverStub = { template: '<div><slot name="target" /><slot name="content" /></div>' };

describe('LibraryLists component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { PopoverHover: PopoverHoverStub };

    function makeLibrary(lists = []) {
        return {
            lists,
            defaultListId: lists.length ? lists[0].id : null,
        };
    }

    it('library computed reflects store.library', () => {
        const store = useLighterpackStore();
        const lib = makeLibrary([{ id: 'list1', name: 'My List' }]);
        store.library = lib;
        const wrapper = mount(LibraryLists, { global: { stubs } });
        expect(wrapper.vm.library).toStrictEqual(lib);
    });

    it('listName returns list name when set', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(LibraryLists, { global: { stubs } });
        expect(wrapper.vm.listName({ name: 'Hiking' })).toBe('Hiking');
    });

    it('listName returns "New list" for unnamed list', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(LibraryLists, { global: { stubs } });
        expect(wrapper.vm.listName({ name: '' })).toBe('New list');
        expect(wrapper.vm.listName({})).toBe('New list');
    });

    it('setDefaultList calls store.setDefaultList', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.setDefaultList = vi.fn();
        const wrapper = mount(LibraryLists, { global: { stubs } });
        const list = { id: 'list1', name: 'Test' };
        wrapper.vm.setDefaultList(list);
        expect(store.setDefaultList).toHaveBeenCalledWith(list);
    });

    it('newList calls store.newList', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.newList = vi.fn();
        const wrapper = mount(LibraryLists, { global: { stubs } });
        wrapper.vm.newList();
        expect(store.newList).toHaveBeenCalled();
    });

    it('importCSV calls store.triggerImportCSV', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.triggerImportCSV = vi.fn();
        const wrapper = mount(LibraryLists, { global: { stubs } });
        wrapper.vm.importCSV();
        expect(store.triggerImportCSV).toHaveBeenCalled();
    });
});
