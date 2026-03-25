import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import Dashboard from '../../../app/pages/index.vue';

const mockPush = vi.fn();

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({ push: mockPush }),
        useRoute: () => ({ path: '/' }),
    };
});

vi.stubGlobal('useHead', vi.fn());

const stubs = {
    sidebar: true,
    share: true,
    account: true,
    accountDelete: true,
    help: true,
    list: true,
    itemLink: true,
    ImportCsv: true,
    itemImage: true,
    itemViewImage: true,
    speedbump: true,
    globalAlerts: true,
    RouterLink: { template: '<a><slot /></a>' },
};

function makeLibrary(defaultListId = 'list1') {
    return {
        showSidebar: false,
        defaultListId,
        getListById: (id) => ({ id, name: 'My List' }),
    };
}

describe('Dashboard view', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockPush.mockClear();
    });

    it('redirects to /welcome if no library is loaded', () => {
        const store = useLighterpackStore();
        store.library = false;
        mount(Dashboard, { global: { stubs } });
        expect(mockPush).toHaveBeenCalledWith('/welcome');
    });

    it('isLoaded is true when library exists', () => {
        const store = useLighterpackStore();
        store.library = makeLibrary();
        const wrapper = mount(Dashboard, { global: { stubs } });
        expect(wrapper.find('#main').exists()).toBe(true);
    });
});
