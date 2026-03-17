import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import ListSettings from '../../../app/components/list-settings.vue';

describe('ListSettings component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { PopoverHover: { template: '<div><slot name="target" /><slot name="content" /></div>' } };

    function makeLibrary(overrides = {}) {
        return {
            optionalFields: { images: false, price: false, worn: false, consumable: false, listDescription: false },
            currencySymbol: '$',
            ...overrides,
        };
    }

    it('is hidden when not signed in', () => {
        const store = useLighterpackStore();
        store.loggedIn = null;
        store.library = makeLibrary();
        const wrapper = mount(ListSettings, { global: { stubs } });
        expect(wrapper.find('#settings').exists()).toBe(false);
    });

    it('is visible when signed in', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = makeLibrary();
        const wrapper = mount(ListSettings, { global: { stubs } });
        expect(wrapper.find('#settings').exists()).toBe(true);
    });

    it('optionalFieldsLookup returns 5 fields', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = makeLibrary();
        const wrapper = mount(ListSettings, { global: { stubs } });
        expect(wrapper.vm.optionalFieldsLookup).toHaveLength(5);
    });

    it('optionalFieldsLookup reflects store values', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = makeLibrary({
            optionalFields: { images: true, price: false, worn: false, consumable: false, listDescription: false },
        });
        const wrapper = mount(ListSettings, { global: { stubs } });
        const images = wrapper.vm.optionalFieldsLookup.find((f) => f.name === 'images');
        expect(images.value).toBe(true);
    });

    it('toggleOptionalField calls store.toggleOptionalField', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = makeLibrary();
        store.toggleOptionalField = vi.fn();
        const wrapper = mount(ListSettings, { global: { stubs } });
        wrapper.vm.toggleOptionalField({}, 'worn');
        expect(store.toggleOptionalField).toHaveBeenCalledWith('worn');
    });

    it('updateCurrencySymbol calls store.updateCurrencySymbol with input value', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = makeLibrary();
        store.updateCurrencySymbol = vi.fn();
        const wrapper = mount(ListSettings, { global: { stubs } });
        wrapper.vm.updateCurrencySymbol({ target: { value: '€' } });
        expect(store.updateCurrencySymbol).toHaveBeenCalledWith('€');
    });
});
