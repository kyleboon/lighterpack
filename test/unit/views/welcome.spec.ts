import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useBaseweightStore } from '../../../app/store/store';
import Welcome from '../../../app/pages/welcome.vue';

const mockPush = vi.fn();

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({ push: mockPush }),
        useRoute: () => ({ path: '/welcome' }),
    };
});

vi.stubGlobal('useHead', vi.fn());
vi.stubGlobal('useSeoMeta', vi.fn());
vi.stubGlobal('useSchemaOrg', vi.fn());
vi.stubGlobal('defineSoftwareApp', vi.fn());
vi.stubGlobal('defineOgImage', vi.fn());

const stubs = {
    globalAlerts: true,
    SigninForm: true,
    RouterLink: { template: '<a><slot /></a>' },
};

describe('Welcome view', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockPush.mockClear();
    });

    it('redirects to / if library is already loaded', () => {
        const store = useBaseweightStore();
        store.library = { items: [], categories: [], lists: [] };
        mount(Welcome, { global: { stubs } });
        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('does not redirect if no library is loaded', () => {
        const store = useBaseweightStore();
        store.library = false;
        mount(Welcome, { global: { stubs } });
        expect(mockPush).not.toHaveBeenCalled();
    });
});
