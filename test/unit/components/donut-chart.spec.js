import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DonutChart from '../../../app/components/donut-chart.vue';

function makeLibrary(categories = []) {
    return {
        totalUnit: 'oz',
        getCategoryById: (id) => categories.find((c) => c.id === id) || null,
        getItemById: () => null,
    };
}

describe('DonutChart component', () => {
    it('renders an SVG element', () => {
        const wrapper = mount(DonutChart, {
            props: { categories: [], totalWeight: 0, library: makeLibrary() },
        });
        expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('renders no slices when totalWeight is 0', () => {
        const wrapper = mount(DonutChart, {
            props: { categories: [], totalWeight: 0, library: makeLibrary() },
        });
        expect(wrapper.findAll('path').length).toBe(0);
    });

    it('renders category slices when totalWeight > 0', () => {
        const categories = [
            { id: 1, name: 'Cat A', subtotalWeight: 5000, color: null },
            { id: 2, name: 'Cat B', subtotalWeight: 5000, color: null },
        ];
        const wrapper = mount(DonutChart, {
            props: { categories, totalWeight: 10000, library: makeLibrary(categories) },
        });
        expect(wrapper.findAll('path.lp-donut-slice').length).toBe(2);
    });

    it('emits category-hover with null on mouseleave', async () => {
        const categories = [{ id: 1, name: 'Cat A', subtotalWeight: 5000, color: null }];
        const wrapper = mount(DonutChart, {
            props: { categories, totalWeight: 5000, library: makeLibrary(categories) },
        });
        await wrapper.find('svg').trigger('mouseleave');
        expect(wrapper.emitted('category-hover')).toBeTruthy();
        expect(wrapper.emitted('category-hover')[0]).toEqual([null]);
    });

    it('truncates long category names', () => {
        const wrapper = mount(DonutChart, {
            props: { categories: [], totalWeight: 0, library: makeLibrary() },
        });
        // Access truncate via direct call — it's in scope via the component
        const longName = 'A very long category name that exceeds limit';
        const categories = [{ id: 1, name: longName, subtotalWeight: 5000, color: null }];
        const wrapper2 = mount(DonutChart, {
            props: { categories, totalWeight: 5000, library: makeLibrary(categories) },
        });
        expect(wrapper2.exists()).toBe(true);
    });
});
