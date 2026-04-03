import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store';
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

    it('activeUrl returns the url from a single-url dialog', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = { type: 'viewImage', imageUrl: '/img/photo.jpg', images: null };
        const wrapper = mount(ItemViewImage, { global: { stubs } });
        expect(wrapper.vm.activeUrl).toBe('/img/photo.jpg');
    });

    it('activeUrl returns empty string when no active dialog', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = null;
        const wrapper = mount(ItemViewImage, { global: { stubs } });
        expect(wrapper.vm.activeUrl).toBe('');
    });

    it('activeUrl returns first image url from images array', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = {
            type: 'viewImage',
            imageUrl: null,
            images: [
                { id: 1, url: '/uploads/a.webp', sort_order: 0 },
                { id: 2, url: '/uploads/b.webp', sort_order: 1 },
            ],
        };
        const wrapper = mount(ItemViewImage, { global: { stubs } });
        expect(wrapper.vm.activeUrl).toBe('/uploads/a.webp');
    });

    it('images array has two entries when dialog has two images', () => {
        const store = useLighterpackStore();
        store.activeItemDialog = {
            type: 'viewImage',
            imageUrl: null,
            images: [
                { id: 1, url: '/uploads/a.webp', sort_order: 0 },
                { id: 2, url: '/uploads/b.webp', sort_order: 1 },
            ],
        };
        const wrapper = mount(ItemViewImage, { global: { stubs } });
        expect(wrapper.vm.images).toHaveLength(2);
    });
});
