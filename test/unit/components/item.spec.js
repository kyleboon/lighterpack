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

    function makeLibrary(overrides = {}) {
        return {
            optionalFields: { images: false, worn: false, consumable: false, price: false, ...overrides },
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

    describe('readonly mode', () => {
        it('renders item name as static text instead of input', () => {
            const store = useLighterpackStore();
            store.library = makeLibrary();
            const wrapper = mount(Item, {
                props: { ...makeProps({ name: 'Tent' }), readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('input.lpName').exists()).toBe(false);
            expect(wrapper.find('span.lpName').exists()).toBe(true);
            expect(wrapper.find('span.lpName').text()).toBe('Tent');
        });

        it('renders item name as a link when url is set', () => {
            const store = useLighterpackStore();
            store.library = makeLibrary();
            const wrapper = mount(Item, {
                props: { ...makeProps({ name: 'Tent', url: 'https://example.com' }), readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('a.lpHref').exists()).toBe(true);
            expect(wrapper.find('a.lpHref').attributes('href')).toBe('https://example.com');
            expect(wrapper.find('a.lpHref').text()).toBe('Tent');
        });

        it('renders description as static text instead of input', () => {
            const store = useLighterpackStore();
            store.library = makeLibrary();
            const wrapper = mount(Item, {
                props: { ...makeProps({ description: 'A tent' }), readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('input.lpDescription').exists()).toBe(false);
            expect(wrapper.find('span.lpDescription').exists()).toBe(true);
            expect(wrapper.find('span.lpDescription').text()).toBe('A tent');
        });

        it('hides drag handle', () => {
            const store = useLighterpackStore();
            store.library = makeLibrary();
            const wrapper = mount(Item, {
                props: { ...makeProps(), readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('.lpHandleCell').exists()).toBe(false);
        });

        it('hides action buttons (camera, link, remove)', () => {
            const store = useLighterpackStore();
            store.library = makeLibrary();
            const wrapper = mount(Item, {
                props: { ...makeProps(), readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('button.lpCamera').exists()).toBe(false);
            expect(wrapper.find('button.lpLink').exists()).toBe(false);
        });

        it('hides remove button', () => {
            const store = useLighterpackStore();
            store.library = makeLibrary();
            const wrapper = mount(Item, {
                props: { ...makeProps(), readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('.lpRemoveCell').exists()).toBe(false);
        });

        it('shows static weight and unit instead of input', () => {
            const store = useLighterpackStore();
            store.library = makeLibrary();
            const wrapper = mount(Item, {
                props: { ...makeProps({ weight: 28349, authorUnit: 'oz' }), readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('input.lpWeight').exists()).toBe(false);
            const weightCell = wrapper.find('.lpWeightCell');
            expect(weightCell.exists()).toBe(true);
            expect(weightCell.text()).toContain('oz');
        });

        it('shows static qty instead of input', () => {
            const store = useLighterpackStore();
            store.library = makeLibrary();
            const wrapper = mount(Item, {
                props: { ...makeProps({}, { qty: 3 }), readonly: true },
                global: { stubs },
            });
            expect(wrapper.find('input.lpQty').exists()).toBe(false);
            const qtyCell = wrapper.find('.lpQtyCell');
            expect(qtyCell.exists()).toBe(true);
            expect(qtyCell.text()).toContain('3');
        });

        it('shows static worn icon when worn is active', () => {
            const store = useLighterpackStore();
            store.library = makeLibrary({ worn: true });
            const wrapper = mount(Item, {
                props: { ...makeProps({}, { worn: true }), readonly: true },
                global: { stubs },
            });
            const wornIcon = wrapper.find('i.lpWorn');
            expect(wornIcon.exists()).toBe(true);
            expect(wornIcon.classes()).toContain('lpActive');
        });
    });
});
