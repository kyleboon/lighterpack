import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useBaseweightStore } from '../../../app/store/store';
import ItemLink from '../../../app/components/item-link.vue';

describe('ItemLink component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true };

    it('is not shown when activeItemDialog is null', () => {
        const store = useBaseweightStore();
        store.activeItemDialog = null;
        const wrapper = mount(ItemLink, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is not shown when activeItemDialog type is not link', () => {
        const store = useBaseweightStore();
        store.activeItemDialog = { type: 'image', item: {} };
        const wrapper = mount(ItemLink, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is shown when activeItemDialog type is link', () => {
        const store = useBaseweightStore();
        store.activeItemDialog = { type: 'link', item: { url: '' } };
        const wrapper = mount(ItemLink, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeItemDialog', () => {
        const store = useBaseweightStore();
        store.activeItemDialog = { type: 'link', item: { url: '' } };
        store.closeItemDialog = vi.fn();
        const wrapper = mount(ItemLink, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeItemDialog).toHaveBeenCalled();
    });

    it('item returns null when no active dialog', () => {
        const store = useBaseweightStore();
        store.activeItemDialog = null;
        const wrapper = mount(ItemLink, { global: { stubs } });
        expect(wrapper.vm.item).toBe(null);
    });

    it('addLink() calls store.updateItemLink and closeItemDialog', () => {
        const store = useBaseweightStore();
        const item = { url: '' };
        store.activeItemDialog = { type: 'link', item };
        store.updateItemLink = vi.fn();
        store.closeItemDialog = vi.fn();
        const wrapper = mount(ItemLink, { global: { stubs } });
        wrapper.vm.url = 'https://example.com';
        wrapper.vm.addLink();
        expect(store.updateItemLink).toHaveBeenCalledWith({ url: 'https://example.com', item });
        expect(store.closeItemDialog).toHaveBeenCalled();
    });
});
