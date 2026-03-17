import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import Help from '../../../app/components/help.vue';

describe('Help component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: { template: '<div><slot /></div>' } };

    it('is not shown when activeModal is not help', () => {
        const store = useLighterpackStore();
        store.activeModal = null;
        const wrapper = mount(Help, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is shown when activeModal is help', () => {
        const store = useLighterpackStore();
        store.activeModal = 'help';
        const wrapper = mount(Help, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeModal', () => {
        const store = useLighterpackStore();
        store.activeModal = 'help';
        store.closeModal = vi.fn();
        const wrapper = mount(Help, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeModal).toHaveBeenCalled();
    });

    it('renders help content', () => {
        const store = useLighterpackStore();
        store.activeModal = 'help';
        const wrapper = mount(Help, { global: { stubs } });
        expect(wrapper.text()).toContain('Getting Started');
    });
});
