import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import ItemViewImage from '../../../app/components/item-view-image.vue';

describe('ItemViewImage component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true };

    it('is not shown when activeItemDialog is null', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = null;
        const wrapper = mount(ItemViewImage, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is not shown when activeItemDialog type is not viewImage', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'other' };
        const wrapper = mount(ItemViewImage, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is shown when activeItemDialog type is viewImage', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'viewImage', imageUrl: '/img/test.jpg' };
        const wrapper = mount(ItemViewImage, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeItemDialog', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'viewImage', imageUrl: '/img/test.jpg' };
        store.closeItemDialog = vi.fn();
        const wrapper = mount(ItemViewImage, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeItemDialog).toHaveBeenCalled();
    });

    it('imageUrl returns the url from activeItemDialog', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'viewImage', imageUrl: '/img/photo.jpg' };
        const wrapper = mount(ItemViewImage, { global: { stubs } });
        expect(wrapper.vm.imageUrl).toBe('/img/photo.jpg');
    });

    it('imageUrl returns empty string when no active dialog', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = null;
        const wrapper = mount(ItemViewImage, { global: { stubs } });
        expect(wrapper.vm.imageUrl).toBe('');
    });
});
