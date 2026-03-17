import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import Share from '../../../app/components/share.vue';

vi.mock('../../../client/utils/utils.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, fetchJson: vi.fn() };
});

describe('Share component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { PopoverHover: { template: '<div><slot name="target" /><slot name="content" /></div>' } };

    function makeLibrary(listOverrides = {}) {
        const list = { externalId: 'abc123', ...listOverrides };
        return {
            defaultListId: 'list1',
            getListById: () => list,
        };
    }

    it('is hidden when not signed in', () => {
        const store = useLighterpackStore();
        store.loggedIn = null;
        store.library = makeLibrary();
        const wrapper = mount(Share, { global: { stubs } });
        expect(wrapper.find('span.headerItem').exists()).toBe(false);
    });

    it('is visible when signed in', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = makeLibrary();
        const wrapper = mount(Share, { global: { stubs } });
        expect(wrapper.find('span.headerItem').exists()).toBe(true);
    });

    it('shareUrl is empty when no externalId', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = makeLibrary({ externalId: '' });
        const wrapper = mount(Share, { global: { stubs } });
        expect(wrapper.vm.shareUrl).toBe('');
    });

    it('shareUrl includes externalId', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = makeLibrary({ externalId: 'xyz789' });
        const wrapper = mount(Share, { global: { stubs } });
        expect(wrapper.vm.shareUrl).toContain('/r/xyz789');
    });

    it('csvUrl includes externalId', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = makeLibrary({ externalId: 'xyz789' });
        const wrapper = mount(Share, { global: { stubs } });
        expect(wrapper.vm.csvUrl).toContain('/csv/xyz789');
    });

    it('embedCode contains script and div tags', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        store.library = makeLibrary({ externalId: 'xyz789' });
        const wrapper = mount(Share, { global: { stubs } });
        expect(wrapper.vm.embedCode).toContain('/e/xyz789');
        expect(wrapper.vm.embedCode).toContain('<div id="xyz789">');
    });
});
