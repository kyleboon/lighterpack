import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store';
import Category from '../../../app/components/category.vue';

describe('Category component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { item: true };

    function makeCategory(overrides = {}) {
        return {
            id: 'cat1',
            name: 'Shelter',
            _isNew: false,
            subtotalWeight: 5000,
            subtotalPrice: 100,
            subtotalQty: 2,
            categoryItems: [],
            ...overrides,
        };
    }

    function makeLibrary(items = []) {
        return {
            optionalFields: { price: false },
            totalUnit: 'oz',
            currencySymbol: '$',
            getItemById: (id) => items.find((i) => i.id === id) || null,
        };
    }

    it('renders the category name input', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(Category, {
            props: { category: makeCategory() },
            global: { stubs },
        });
        expect(wrapper.find('input.lpCategoryName').exists()).toBe(true);
    });

    it('itemContainers maps categoryItems to item/categoryItem pairs', () => {
        const store = useLighterpackStore();
        const item = { id: 'item1', name: 'Tent' };
        store.library = makeLibrary([item]);
        const category = makeCategory({ categoryItems: [{ itemId: 'item1' }] });
        const wrapper = mount(Category, {
            props: { category },
            global: { stubs },
        });
        expect(wrapper.vm.itemContainers).toHaveLength(1);
        expect(wrapper.vm.itemContainers[0].item).toBe(item);
    });

    it('newItem() calls store.newItem', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.newItem = vi.fn();
        const category = makeCategory();
        const wrapper = mount(Category, { props: { category }, global: { stubs } });
        wrapper.vm.newItem();
        expect(store.newItem).toHaveBeenCalledWith({ category, _isNew: true });
    });

    it('updateCategoryName() calls store.updateCategoryName', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.updateCategoryName = vi.fn();
        const category = makeCategory();
        const wrapper = mount(Category, { props: { category }, global: { stubs } });
        wrapper.vm.updateCategoryName({ target: { value: 'Cooking' } });
        expect(store.updateCategoryName).toHaveBeenCalledWith({ id: 'cat1', name: 'Cooking' });
    });

    it('removeCategory() calls store.initSpeedbump', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.initSpeedbump = vi.fn();
        const category = makeCategory();
        const wrapper = mount(Category, { props: { category }, global: { stubs } });
        wrapper.vm.removeCategory(category);
        expect(store.initSpeedbump).toHaveBeenCalled();
    });

    it('displayWeight formats weight correctly', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(Category, {
            props: { category: makeCategory() },
            global: { stubs },
        });
        // 28349.5 mg = 1 oz
        expect(wrapper.vm.displayWeight(28349.5, 'oz')).toBe(1);
    });

    it('displayPrice formats price with symbol', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(Category, {
            props: { category: makeCategory() },
            global: { stubs },
        });
        expect(wrapper.vm.displayPrice(9.5, '$')).toBe('$9.50');
    });

    describe('readonly mode', () => {
        function mountReadonly(overrides = {}) {
            const store = useLighterpackStore();
            store.library = makeLibrary();
            return mount(Category, {
                props: { category: makeCategory(), readonly: true, ...overrides },
                global: { stubs },
            });
        }

        it('renders category name as h2 instead of input', () => {
            const wrapper = mountReadonly();
            expect(wrapper.find('input.lpCategoryName').exists()).toBe(false);
            expect(wrapper.find('h2.lpCategoryName').exists()).toBe(true);
            expect(wrapper.find('h2.lpCategoryName').text()).toBe('Shelter');
        });

        it('hides drag handle in readonly mode', () => {
            const wrapper = mountReadonly();
            expect(wrapper.find('.lpHandleCell').exists()).toBe(false);
            expect(wrapper.find('.lpCategoryHandle').exists()).toBe(false);
        });

        it('hides remove button in readonly mode', () => {
            const wrapper = mountReadonly();
            expect(wrapper.find('.lpRemoveCategory').exists()).toBe(false);
        });

        it('hides add item link in readonly mode', () => {
            const wrapper = mountReadonly();
            expect(wrapper.find('.lpAddItem').exists()).toBe(false);
        });

        it('passes readonly prop to child item components', () => {
            const store = useLighterpackStore();
            const itemObj = { id: 'item1', name: 'Tent' };
            store.library = makeLibrary([itemObj]);
            const category = makeCategory({ categoryItems: [{ itemId: 'item1' }] });
            const wrapper = mount(Category, {
                props: { category, readonly: true },
                global: { stubs },
            });
            const itemStub = wrapper.findComponent({ name: 'item' });
            expect(itemStub.props('readonly')).toBe(true);
        });
    });
});
