import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import Item from '../../../app/components/item.vue';

describe('Item component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { unitSelect: true };

    function makeItem(overrides = {}) {
        return {
            id: 'item1',
            name: 'Tent',
            description: 'A tent',
            weight: 28349,
            authorUnit: 'oz',
            price: 100,
            image: '',
            imageUrl: '',
            url: '',
            classes: '',
            ...overrides,
        };
    }

    function makeCategoryItem(overrides = {}) {
        return {
            itemId: 'item1',
            qty: 1,
            worn: false,
            consumable: false,
            star: 0,
            _isNew: false,
            ...overrides,
        };
    }

    function makeLibrary() {
        return {
            optionalFields: { images: false, worn: false, consumable: false, price: false },
        };
    }

    function makeProps(itemOverrides = {}, categoryItemOverrides = {}) {
        return {
            category: { id: 'cat1', name: 'Shelter', categoryItems: [] },
            itemContainer: {
                item: makeItem(itemOverrides),
                categoryItem: makeCategoryItem(categoryItemOverrides),
            },
        };
    }

    it('thumbnailImage returns imgur URL when item.image is set', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(Item, {
            props: makeProps({ image: 'abc123' }),
            global: { stubs },
        });
        expect(wrapper.vm.thumbnailImage).toBe('https://i.imgur.com/abc123s.jpg');
    });

    it('thumbnailImage returns imageUrl when item.imageUrl is set', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(Item, {
            props: makeProps({ image: '', imageUrl: 'https://example.com/img.jpg' }),
            global: { stubs },
        });
        expect(wrapper.vm.thumbnailImage).toBe('https://example.com/img.jpg');
    });

    it('thumbnailImage returns empty string when no image', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(Item, {
            props: makeProps({ image: '', imageUrl: '' }),
            global: { stubs },
        });
        expect(wrapper.vm.thumbnailImage).toBe('');
    });

    it('saveWeight sets weightError when input is NaN', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(Item, {
            props: makeProps(),
            global: { stubs },
        });
        wrapper.vm.displayWeight = 'not-a-number';
        wrapper.vm.saveWeight();
        expect(wrapper.vm.weightError).toBe(true);
    });

    it('saveQty sets qtyError when input is NaN', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(Item, {
            props: makeProps(),
            global: { stubs },
        });
        wrapper.vm.displayQty = 'not-a-number';
        wrapper.vm.saveQty();
        expect(wrapper.vm.qtyError).toBe(true);
    });

    it('cycleStar increments star value mod numStars', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.updateCategoryItem = vi.fn();
        const wrapper = mount(Item, {
            props: makeProps({}, { star: 2 }),
            global: { stubs },
        });
        // star starts at 2, numStars is 4, so (2+1)%4 = 3
        wrapper.vm.cycleStar();
        expect(store.updateCategoryItem).toHaveBeenCalled();
        const callArg = store.updateCategoryItem.mock.calls[0][0];
        expect(callArg.categoryItem.star).toBe(3);
    });

    it('toggleWorn does nothing when consumable is true', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.updateCategoryItem = vi.fn();
        const wrapper = mount(Item, {
            props: makeProps({}, { consumable: true, worn: false }),
            global: { stubs },
        });
        wrapper.vm.toggleWorn();
        expect(store.updateCategoryItem).not.toHaveBeenCalled();
    });

    it('removeItem calls store.removeItemFromCategory', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        store.removeItemFromCategory = vi.fn();
        const wrapper = mount(Item, {
            props: makeProps({ id: 'item1' }),
            global: { stubs },
        });
        wrapper.vm.removeItem();
        expect(store.removeItemFromCategory).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'item1' }));
    });
});
