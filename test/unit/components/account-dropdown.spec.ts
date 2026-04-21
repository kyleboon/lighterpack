import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useBaseweightStore } from '../../../app/store/store';
import AccountDropdown from '../../../app/components/account-dropdown.vue';

const mockPush = vi.fn();
vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useRouter: () => ({ push: mockPush }) };
});

describe('AccountDropdown component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockPush.mockClear();
    });

    const stubs = { PopoverHover: { template: '<div><slot name="target" /><slot name="content" /></div>' } };

    it('renders the username from the store', () => {
        const store = useBaseweightStore();
        store.loggedIn = 'testuser';
        const wrapper = mount(AccountDropdown, { global: { stubs } });
        expect(wrapper.text()).toContain('testuser');
    });

    it('showAccount() calls store.showModal with account', () => {
        const store = useBaseweightStore();
        store.showModal = vi.fn();
        const wrapper = mount(AccountDropdown, { global: { stubs } });
        wrapper.vm.showAccount();
        expect(store.showModal).toHaveBeenCalledWith('account');
    });

    it('showHelp() calls store.showModal with help', () => {
        const store = useBaseweightStore();
        store.showModal = vi.fn();
        const wrapper = mount(AccountDropdown, { global: { stubs } });
        wrapper.vm.showHelp();
        expect(store.showModal).toHaveBeenCalledWith('help');
    });

    it('signout() calls store.signout and navigates to /signin', () => {
        const store = useBaseweightStore();
        store.signout = vi.fn();
        const wrapper = mount(AccountDropdown, { global: { stubs } });
        wrapper.vm.signout();
        expect(store.signout).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/welcome');
    });
});
