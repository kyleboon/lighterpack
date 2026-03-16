import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../client/store/store.js';
import Account from '../../../client/components/account.vue';

vi.mock('../../../client/utils/utils.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, fetchJson: vi.fn() };
});

describe('Account component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true, errors: true, spinner: true };

    it('shown is false when activeModal is not account', () => {
        const store = useLighterpackStore();
        store.activeModal = null;
        const wrapper = mount(Account, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('shown is true when activeModal is account', () => {
        const store = useLighterpackStore();
        store.activeModal = 'account';
        const wrapper = mount(Account, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeModal', () => {
        const store = useLighterpackStore();
        store.activeModal = 'account';
        store.closeModal = vi.fn();
        const wrapper = mount(Account, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeModal).toHaveBeenCalled();
    });

    it('username reflects store.loggedIn', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'alice';
        const wrapper = mount(Account, { global: { stubs } });
        expect(wrapper.vm.username).toBe('alice');
    });

    it('updateAccount adds error when currentPassword is empty', () => {
        const wrapper = mount(Account, { global: { stubs } });
        wrapper.vm.updateAccount();
        expect(wrapper.vm.errors_).toEqual(
            expect.arrayContaining([expect.objectContaining({ field: 'currentPassword' })]),
        );
    });

    it('updateAccount adds error when new passwords do not match', () => {
        const wrapper = mount(Account, { global: { stubs } });
        wrapper.vm.currentPassword = 'oldpass';
        wrapper.vm.newPassword = 'newpass1';
        wrapper.vm.confirmNewPassword = 'newpass2';
        wrapper.vm.updateAccount();
        expect(wrapper.vm.errors_).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'newPassword' })]));
    });

    it('showDeleteAccount calls store.showModal with deleteAccount', () => {
        const store = useLighterpackStore();
        store.showModal = vi.fn();
        const wrapper = mount(Account, { global: { stubs } });
        wrapper.vm.showDeleteAccount();
        expect(store.showModal).toHaveBeenCalledWith('deleteAccount');
    });
});
