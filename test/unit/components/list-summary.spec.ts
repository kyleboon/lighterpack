import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useBaseweightStore } from '../../../app/store/store';
import ListSummary from '../../../app/components/list-summary.vue';

describe('ListSummary component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = {
        donutChart: true,
        colorPicker: true,
        unitSelect: true,
    };

    function makeList(overrides = {}) {
        return {
            categoryIds: [],
            totalWeight: 0,
            totalPrice: 0,
            totalQty: 0,
            totalConsumableWeight: 0,
            totalConsumablePrice: 0,
            totalWornWeight: 0,
            totalBaseWeight: 0,
            totalPackWeight: 0,
            ...overrides,
        };
    }

    function makeLibrary(categories = []) {
        return {
            optionalFields: { price: false },
            currencySymbol: '$',
            totalUnit: 'oz',
            getCategoryById: (id) => categories.find((c) => c.id === id),
        };
    }

    it('renders the list summary container', () => {
        const store = useBaseweightStore();
        store.library = makeLibrary();
        const wrapper = mount(ListSummary, {
            props: { list: makeList() },
            global: { stubs },
        });
        expect(wrapper.find('.bwListSummary').exists()).toBe(true);
    });

    it('displayWeight returns formatted weight', () => {
        const store = useBaseweightStore();
        store.library = makeLibrary();
        const wrapper = mount(ListSummary, {
            props: { list: makeList() },
            global: { stubs },
        });
        const result = wrapper.vm.displayWeight(28349, 'oz');
        expect(result).toBeGreaterThan(0);
    });

    it('displayPrice formats price with symbol', () => {
        const store = useBaseweightStore();
        store.library = makeLibrary();
        const wrapper = mount(ListSummary, {
            props: { list: makeList() },
            global: { stubs },
        });
        expect(wrapper.vm.displayPrice(9.99, '$')).toBe('$9.99');
    });

    it('displayPrice shows 0.00 for non-numeric price', () => {
        const store = useBaseweightStore();
        store.library = makeLibrary();
        const wrapper = mount(ListSummary, {
            props: { list: makeList() },
            global: { stubs },
        });
        expect(wrapper.vm.displayPrice(null, '€')).toBe('€0.00');
    });

    it('setTotalUnit calls store.setTotalUnit', () => {
        const store = useBaseweightStore();
        store.library = makeLibrary();
        store.setTotalUnit = vi.fn();
        const wrapper = mount(ListSummary, {
            props: { list: makeList() },
            global: { stubs },
        });
        wrapper.vm.setTotalUnit('kg');
        expect(store.setTotalUnit).toHaveBeenCalledWith('kg');
    });

    it('categories computed maps categoryIds to library categories', () => {
        const store = useBaseweightStore();
        const category = { id: 1, name: 'Shelter', color: null };
        store.library = makeLibrary([category]);
        const list = makeList({ categoryIds: [1] });
        const wrapper = mount(ListSummary, {
            props: { list },
            global: { stubs },
        });
        expect(wrapper.vm.categories).toHaveLength(1);
        expect(wrapper.vm.categories[0].name).toBe('Shelter');
    });

    it('renders a static color swatch instead of colorPicker when readonly', () => {
        const store = useBaseweightStore();
        const category = { id: 1, name: 'Shelter', color: null };
        store.library = makeLibrary([category]);
        const list = makeList({ categoryIds: [1] });
        const wrapper = mount(ListSummary, {
            props: { list, readonly: true },
            global: { stubs },
        });
        expect(wrapper.findComponent({ name: 'colorPicker' }).exists()).toBe(false);
        expect(wrapper.find('.bwLegend').exists()).toBe(true);
    });

    it('renders static unit text instead of unitSelect when readonly', () => {
        const store = useBaseweightStore();
        store.library = makeLibrary();
        const wrapper = mount(ListSummary, {
            props: { list: makeList(), readonly: true },
            global: { stubs },
        });
        expect(wrapper.findComponent({ name: 'unitSelect' }).exists()).toBe(false);
        expect(wrapper.find('.bw-s-unit').text()).toBe('oz');
    });
});
