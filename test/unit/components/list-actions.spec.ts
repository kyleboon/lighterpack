import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useBaseweightStore } from '../../../app/store/store';
import ListActions from '../../../app/components/list-actions.vue';

vi.mock('../../../app/utils/utils.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, fetchJson: vi.fn() };
});

const PopoverStub = {
    template: '<div><slot name="target" /><slot name="content" /></div>',
};

describe('ListActions component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { Popover: PopoverStub };

    function makeStore(overrides = {}) {
        const store = useBaseweightStore();
        store.loggedIn = 'alice';
        store.library = {
            defaultListId: 'list1',
            getListById: () => ({ id: 'list1', externalId: 'abc123' }),
        };
        Object.assign(store, overrides);
        return store;
    }

    it('renders nothing when not signed in', () => {
        const store = useBaseweightStore();
        store.loggedIn = null;
        store.library = {
            defaultListId: 'list1',
            getListById: () => ({ id: 'list1', externalId: '' }),
        };
        const wrapper = mount(ListActions, { global: { stubs } });
        expect(wrapper.find('button').exists()).toBe(false);
    });

    it('renders the ellipsis button when signed in', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        const btn = wrapper.find('button.bw-btn');
        expect(btn.exists()).toBe(true);
        expect(btn.attributes('aria-label')).toBe('List actions');
    });

    it('menu is closed by default', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        expect(wrapper.vm.menuOpen).toBe(false);
    });

    it('clicking the button opens the menu', async () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.find('button.bw-btn').trigger('click');
        expect(wrapper.vm.menuOpen).toBe(true);
    });

    it('clicking the button again closes the menu', async () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.find('button.bw-btn').trigger('click');
        await wrapper.find('button.bw-btn').trigger('click');
        expect(wrapper.vm.menuOpen).toBe(false);
    });

    it('closeMenu sets menuOpen to false', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        wrapper.vm.menuOpen = true;
        wrapper.vm.closeMenu();
        expect(wrapper.vm.menuOpen).toBe(false);
    });

    it('renders Copy this list menu item', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        expect(wrapper.text()).toContain('Copy this list');
    });

    it('renders Copy share link menu item', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        expect(wrapper.text()).toContain('Copy share link');
    });

    it('renders Export to CSV menu item', () => {
        makeStore();
        const wrapper = mount(ListActions, { global: { stubs } });
        expect(wrapper.text()).toContain('Export to CSV');
    });

    it('copyList calls store.copyList with the current list id', async () => {
        const store = makeStore();
        store.copyList = vi.fn();
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.vm.copyList();
        expect(store.copyList).toHaveBeenCalledWith('list1');
    });

    it('copyList closes the menu', async () => {
        const store = makeStore();
        store.copyList = vi.fn();
        const wrapper = mount(ListActions, { global: { stubs } });
        wrapper.vm.menuOpen = true;
        await wrapper.vm.copyList();
        expect(wrapper.vm.menuOpen).toBe(false);
    });

    it('copyShareLink sets copied=true on success', async () => {
        makeStore();
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.vm.copyShareLink();
        expect(wrapper.vm.copied).toBe(true);
    });

    it('copyShareLink calls fetchJson when no externalId', async () => {
        const { fetchJson } = await import('../../../app/utils/utils.js');
        fetchJson.mockResolvedValueOnce({ externalId: 'newid' });
        const store = useBaseweightStore();
        store.loggedIn = 'alice';
        store.library = {
            defaultListId: 'list1',
            getListById: () => ({ id: 'list1', externalId: '' }),
        };
        store.setExternalId = vi.fn();
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.vm.copyShareLink();
        expect(fetchJson).toHaveBeenCalledWith('/api/external-id', expect.any(Object));
        expect(store.setExternalId).toHaveBeenCalledWith({ externalId: 'newid', list: expect.any(Object) });
    });

    it('exportCSV opens a new tab', async () => {
        makeStore();
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
        const wrapper = mount(ListActions, { global: { stubs } });
        await wrapper.vm.exportCSV();
        expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('/csv/abc123'), '_blank');
        openSpy.mockRestore();
    });

    it('loading state prevents re-entry', async () => {
        const { fetchJson } = await import('../../../app/utils/utils.js');
        fetchJson.mockClear();
        // fetchJson never resolves — simulates an in-flight request
        fetchJson.mockImplementation(() => new Promise(() => {}));
        const store = useBaseweightStore();
        store.loggedIn = 'alice';
        store.library = {
            defaultListId: 'list1',
            getListById: () => ({ id: 'list1', externalId: '' }),
        };
        const wrapper = mount(ListActions, { global: { stubs } });
        wrapper.vm.copyShareLink(); // starts the fetch, sets loading = true
        expect(wrapper.vm.loading).toBe(true);
        // second call while loading should be a no-op
        const secondCall = wrapper.vm.copyShareLink();
        await secondCall;
        expect(fetchJson).toHaveBeenCalledTimes(1);
    });
});
