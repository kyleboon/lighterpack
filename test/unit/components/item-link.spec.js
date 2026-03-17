import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import ItemLink from '../../../app/components/item-link.vue';

describe('ItemLink component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true };

    it('is not shown when activeItemDialog is null', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = null;
        const wrapper = mount(ItemLink, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is not shown when activeItemDialog type is not link', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'image', item: {} };
        const wrapper = mount(ItemLink, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is shown when activeItemDialog type is link', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'link', item: { url: '' } };
        const wrapper = mount(ItemLink, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeItemDialog', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'link', item: { url: '' } };
        store.closeItemDialog = vi.fn();
        const wrapper = mount(ItemLink, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeItemDialog).toHaveBeenCalled();
    });

    it('item returns null when no active dialog', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = null;
        const wrapper = mount(ItemLink, { global: { stubs } });
        expect(wrapper.vm.item).toBe(null);
    });

    it('addLink() calls store.updateItemLink and closeItemDialog', () => {
        const store = useLighterpackStore();
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
