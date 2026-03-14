import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ColorPicker from '../../../client/components/colorpicker.vue';

describe('ColorPicker component', () => {
    it('renders without errors', () => {
        const wrapper = mount(ColorPicker, {
            props: { color: '#ff0000' },
            global: {
                stubs: { Popover: true },
            },
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('exposes a shown data property defaulting to false', () => {
        const wrapper = mount(ColorPicker, {
            props: { color: '#ff0000' },
            global: {
                stubs: { Popover: true },
            },
        });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('emits colorChange when onColorChange is called', async () => {
        const wrapper = mount(ColorPicker, {
            props: { color: '#ff0000' },
            global: {
                stubs: { Popover: true },
            },
        });
        wrapper.vm.onColorChange({ target: { value: '#00ff00' } });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('colorChange')).toBeTruthy();
        expect(wrapper.emitted('colorChange')[0]).toEqual(['#00ff00']);
    });
});
