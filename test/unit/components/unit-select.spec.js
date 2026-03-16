import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UnitSelect from '../../../client/components/unit-select.vue';

describe('UnitSelect component', () => {
    it('renders the current unit', () => {
        const wrapper = mount(UnitSelect, { props: { unit: 'oz', weight: 100 } });
        expect(wrapper.find('.lpDisplay').text()).toBe('oz');
    });

    it('starts closed', () => {
        const wrapper = mount(UnitSelect, { props: { unit: 'oz', weight: 0 } });
        expect(wrapper.vm.isOpen).toBe(false);
    });

    it('open() sets isOpen to true', () => {
        const wrapper = mount(UnitSelect, { props: { unit: 'oz', weight: 0 } });
        wrapper.vm.open();
        expect(wrapper.vm.isOpen).toBe(true);
    });

    it('close() sets isOpen to false', () => {
        const wrapper = mount(UnitSelect, { props: { unit: 'oz', weight: 0 } });
        wrapper.vm.open();
        wrapper.vm.close();
        expect(wrapper.vm.isOpen).toBe(false);
    });

    it('select() calls onChange prop with selected unit', () => {
        const onChange = vi.fn();
        const wrapper = mount(UnitSelect, { props: { unit: 'oz', weight: 0, onChange } });
        wrapper.vm.select('kg');
        expect(onChange).toHaveBeenCalledWith('kg');
    });

    it('renders all four unit options', () => {
        const wrapper = mount(UnitSelect, { props: { unit: 'oz', weight: 0 } });
        const options = wrapper.findAll('option');
        expect(options).toHaveLength(4);
        const values = options.map((o) => o.element.value);
        expect(values).toEqual(['oz', 'lb', 'g', 'kg']);
    });
});
