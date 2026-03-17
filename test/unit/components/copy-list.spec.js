import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import CopyList from '../../../app/components/copy-list.vue';

describe('CopyList component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true };

    it('is not shown when activeModal is not copyList', () => {
        const store = useLighterpackStore();
        store.activeModal = null;
        const wrapper = mount(CopyList, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is shown when activeModal is copyList', () => {
        const store = useLighterpackStore();
        store.activeModal = 'copyList';
        const wrapper = mount(CopyList, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeModal', () => {
        const store = useLighterpackStore();
        store.activeModal = 'copyList';
        store.closeModal = vi.fn();
        const wrapper = mount(CopyList, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeModal).toHaveBeenCalled();
    });

    it('copyList() does nothing if no listId selected', () => {
        const store = useLighterpackStore();
        store.copyList = vi.fn();
        const wrapper = mount(CopyList, { global: { stubs } });
        wrapper.vm.copyList();
        expect(store.copyList).not.toHaveBeenCalled();
    });

    it('copyList() calls store.copyList and closes modal when listId is set', () => {
        const store = useLighterpackStore();
        store.activeModal = 'copyList';
        store.copyList = vi.fn();
        store.closeModal = vi.fn();
        const wrapper = mount(CopyList, { global: { stubs } });
        wrapper.vm.listId = 'abc123';
        wrapper.vm.copyList();
        expect(store.copyList).toHaveBeenCalledWith('abc123');
        expect(store.closeModal).toHaveBeenCalled();
    });
});
