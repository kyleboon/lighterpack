import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import ItemImage from '../../../app/components/item-image.vue';

describe('ItemImage component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true };

    it('is not shown when activeItemDialog is null', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = null;
        const wrapper = mount(ItemImage, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is not shown when type is not image', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'link', item: {} };
        const wrapper = mount(ItemImage, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is shown when activeItemDialog type is image', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'image', item: { image: null, imageUrl: null } };
        const wrapper = mount(ItemImage, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeItemDialog', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'image', item: { image: null, imageUrl: null } };
        store.closeItemDialog = vi.fn();
        const wrapper = mount(ItemImage, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeItemDialog).toHaveBeenCalled();
    });

    it('item returns the dialog item when type is image', () => {
        const store = useLighterpackStore();
        const itemObj = { id: 1, image: null, imageUrl: 'http://img.com/a.jpg' };
        store.activeItemDialog = { type: 'image', item: itemObj };
        const wrapper = mount(ItemImage, { global: { stubs } });
        expect(wrapper.vm.item).toEqual(itemObj);
    });

    it('item returns default when dialog is null', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = null;
        const wrapper = mount(ItemImage, { global: { stubs } });
        expect(wrapper.vm.item).toEqual({ image: null, imageUrl: null });
    });

    it('saveImageUrl calls store.updateItemImageUrl and closes', () => {
        const store = useLighterpackStore();
        const itemObj = { image: null, imageUrl: null };
        store.activeItemDialog = { type: 'image', item: itemObj };
        store.updateItemImageUrl = vi.fn();
        store.closeItemDialog = vi.fn();
        const wrapper = mount(ItemImage, { global: { stubs } });
        wrapper.vm.imageUrl = 'http://img.com/new.jpg';
        wrapper.vm.saveImageUrl();
        expect(store.updateItemImageUrl).toHaveBeenCalledWith({ imageUrl: 'http://img.com/new.jpg', item: itemObj });
        expect(store.closeItemDialog).toHaveBeenCalled();
    });
});
