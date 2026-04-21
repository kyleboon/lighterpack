import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sortablejs', () => ({ default: { create: vi.fn(() => ({ destroy: vi.fn() })) } }));
vi.mock('../../../app/composables/useItemDrag.js', () => ({
    useItemDrag: () => ({ setup: vi.fn(), destroy: vi.fn() }),
}));
vi.mock('isomorphic-dompurify', () => ({
    default: { sanitize: (html) => html },
}));
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useBaseweightStore } from '../../../app/store/store';
import List from '../../../app/components/list.vue';

describe('List component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { category: true, listSummary: true, listActions: true };

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
        const store = useBaseweightStore();
        const list = makeList();
        const lib = makeLibrary(list);
        store.library = lib;
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.list).toEqual(list);
    });

    it('categories maps categoryIds to library categories', () => {
        const store = useBaseweightStore();
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
        const store = useBaseweightStore();
        const list = makeList({ totalWeight: 0 });
        store.library = makeLibrary(list);
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.isListNew).toBe(true);
    });

    it('isListNew is false when totalWeight is non-zero', () => {
        const store = useBaseweightStore();
        const list = makeList({ totalWeight: 1000 });
        store.library = makeLibrary(list);
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.isListNew).toBe(false);
    });

    it('isLocalSaving reflects store.saveType', () => {
        const store = useBaseweightStore();
        const list = makeList();
        store.library = makeLibrary(list);
        store.saveType = 'local';
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.isLocalSaving).toBe(true);
    });

    it('isLocalSaving is false when saveType is not local', () => {
        const store = useBaseweightStore();
        const list = makeList();
        store.library = makeLibrary(list);
        store.saveType = 'server';
        const wrapper = mount(List, { global: { stubs } });
        expect(wrapper.vm.isLocalSaving).toBe(false);
    });

    it('newCategory calls store.newCategory with the list', () => {
        const store = useBaseweightStore();
        const list = makeList();
        store.library = makeLibrary(list);
        store.newCategory = vi.fn();
        const wrapper = mount(List, { global: { stubs } });
        wrapper.vm.newCategory();
        expect(store.newCategory).toHaveBeenCalledWith(list);
    });

    describe('readonly mode', () => {
        it('renders list name as h1 instead of input', () => {
            const store = useBaseweightStore();
            const list = makeList({ name: 'Test List', totalWeight: 100 });
            store.library = makeLibrary(list);
            const wrapper = mount(List, {
                props: { readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('h1.bw-list-title').exists()).toBe(true);
            expect(wrapper.find('h1.bw-list-title').text()).toBe('Test List');
            expect(wrapper.find('input.bw-list-title').exists()).toBe(false);
        });

        it('hides header actions in readonly mode', () => {
            const store = useBaseweightStore();
            const list = makeList({ totalWeight: 100 });
            store.library = makeLibrary(list);
            const wrapper = mount(List, {
                props: { readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('.bw-list-header-actions').exists()).toBe(false);
        });

        it('hides add category link in readonly mode', () => {
            const store = useBaseweightStore();
            const list = makeList({ totalWeight: 100 });
            store.library = makeLibrary(list);
            const wrapper = mount(List, {
                props: { readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('.addCategory').exists()).toBe(false);
        });

        it('renders markdown description in readonly mode when description exists', () => {
            const store = useBaseweightStore();
            const list = makeList({ totalWeight: 100, description: '**bold text**' });
            store.library = makeLibrary(list);
            const wrapper = mount(List, {
                props: { readonly: true },
                global: { stubs },
            });
            const descEl = wrapper.find('#bwListDescription');
            expect(descEl.exists()).toBe(true);
            expect(descEl.html()).toContain('<strong>bold text</strong>');
        });

        it('passes readonly to list-summary and category components', () => {
            const store = useBaseweightStore();
            const cat1 = makeCategory('cat1');
            const list = makeList({ totalWeight: 100, categoryIds: ['cat1'] });
            store.library = makeLibrary(list, [cat1]);
            const wrapper = mount(List, {
                props: { readonly: true },
                global: { stubs },
            });
            const summary =
                wrapper.findComponent({ name: 'listSummary' }) || wrapper.findComponent({ name: 'list-summary' });
            expect(summary.exists()).toBe(true);
            expect(summary.props('readonly')).toBe(true);

            const categoryComp = wrapper.findComponent({ name: 'category' });
            expect(categoryComp.exists()).toBe(true);
            expect(categoryComp.props('readonly')).toBe(true);
        });
    });
});
