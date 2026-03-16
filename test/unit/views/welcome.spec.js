import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../client/store/store.js';
import Welcome from '../../../client/views/welcome.vue';

const mockPush = vi.fn();

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({ push: mockPush }),
        useRoute: () => ({ path: '/welcome' }),
    };
});

const stubs = {
    blackoutFooter: true,
    globalAlerts: true,
    registerForm: true,
    SigninForm: true,
    RouterLink: { template: '<a><slot /></a>' },
};

describe('Welcome view', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockPush.mockClear();
    });

    it('redirects to / if library is already loaded', () => {
        const store = useLighterpackStore();
        store.library = { items: [], categories: [], lists: [] };
        mount(Welcome, { global: { stubs } });
        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('does not redirect if no library is loaded', () => {
        const store = useLighterpackStore();
        store.library = false;
        mount(Welcome, { global: { stubs } });
        expect(mockPush).not.toHaveBeenCalled();
    });
});
