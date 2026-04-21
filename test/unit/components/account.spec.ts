import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useBaseweightStore } from '../../../app/store/store';
import Account from '../../../app/components/account.vue';

describe('Account component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true };

    it('shown is false when activeModal is not account', () => {
        const store = useBaseweightStore();
        store.activeModal = null;
        const wrapper = mount(Account, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('shown is true when activeModal is account', () => {
        const store = useBaseweightStore();
        store.activeModal = 'account';
        const wrapper = mount(Account, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeModal', () => {
        const store = useBaseweightStore();
        store.activeModal = 'account';
        store.closeModal = vi.fn();
        const wrapper = mount(Account, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeModal).toHaveBeenCalled();
    });

    it('currentEmail reflects store.loggedIn', () => {
        const store = useBaseweightStore();
        store.loggedIn = 'alice@example.com';
        const wrapper = mount(Account, { global: { stubs } });
        expect(wrapper.vm.currentEmail).toBe('alice@example.com');
    });

    it('showDeleteAccount calls store.showModal with deleteAccount', () => {
        const store = useBaseweightStore();
        store.showModal = vi.fn();
        const wrapper = mount(Account, { global: { stubs } });
        wrapper.vm.showDeleteAccount();
        expect(store.showModal).toHaveBeenCalledWith('deleteAccount');
    });
});
