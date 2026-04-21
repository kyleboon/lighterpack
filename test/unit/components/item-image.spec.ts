import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useBaseweightStore } from '../../../app/store/store';
import ItemImage from '../../../app/components/item-image.vue';

describe('ItemImage component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true };

    it('is not shown when activeItemDialog is null', () => {
        const store = useBaseweightStore();
        store.activeItemDialog = null;
        const wrapper = mount(ItemImage, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is not shown when type is not image', () => {
        const store = useBaseweightStore();
        store.activeItemDialog = { type: 'link', entityType: 'item', entity: {} };
        const wrapper = mount(ItemImage, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is shown when activeItemDialog type is image', () => {
        const store = useBaseweightStore();
        store.activeItemDialog = { type: 'image', entityType: 'item', entity: { id: 1, images: [] } };
        const wrapper = mount(ItemImage, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeItemDialog', () => {
        const store = useBaseweightStore();
        store.activeItemDialog = { type: 'image', entityType: 'item', entity: { id: 1, images: [] } };
        store.closeItemDialog = vi.fn();
        const wrapper = mount(ItemImage, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeItemDialog).toHaveBeenCalled();
    });

    it('saveUrl calls store.addImageUrl with the entered url for an item', async () => {
        const store = useBaseweightStore();
        const itemObj = { id: 42, images: [] };
        store.activeItemDialog = { type: 'image', entityType: 'item', entity: itemObj };
        store.library = { getItemById: vi.fn(() => itemObj) };
        store.addImageUrl = vi.fn().mockResolvedValue(undefined);
        const wrapper = mount(ItemImage, { global: { stubs } });
        wrapper.vm.urlInput = 'http://img.com/new.jpg';
        await wrapper.vm.saveUrl();
        expect(store.addImageUrl).toHaveBeenCalledWith({
            entityType: 'item',
            entityId: 42,
            url: 'http://img.com/new.jpg',
        });
    });

    it('saveUrl calls store.addImageUrl with entityType category', async () => {
        const store = useBaseweightStore();
        const catObj = { id: 7, images: [] };
        store.activeItemDialog = { type: 'image', entityType: 'category', entity: catObj };
        store.library = { getCategoryById: vi.fn(() => catObj) };
        store.addImageUrl = vi.fn().mockResolvedValue(undefined);
        const wrapper = mount(ItemImage, { global: { stubs } });
        wrapper.vm.urlInput = 'http://img.com/cat.jpg';
        await wrapper.vm.saveUrl();
        expect(store.addImageUrl).toHaveBeenCalledWith({
            entityType: 'category',
            entityId: 7,
            url: 'http://img.com/cat.jpg',
        });
    });
});
