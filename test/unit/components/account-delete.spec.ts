import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store';
import AccountDelete from '../../../app/components/account-delete.vue';

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useRouter: () => ({ push: vi.fn() }) };
});

vi.mock('../../../app/utils/utils.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, fetchJson: vi.fn() };
});

describe('AccountDelete component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true, errors: true };

    it('is not shown when activeModal is not deleteAccount', () => {
        const store = useLighterpackStore();
        store.activeModal = null;
        const wrapper = mount(AccountDelete, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is shown when activeModal is deleteAccount', () => {
        const store = useLighterpackStore();
        store.activeModal = 'deleteAccount';
        const wrapper = mount(AccountDelete, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeModal', () => {
        const store = useLighterpackStore();
        store.activeModal = 'deleteAccount';
        store.closeModal = vi.fn();
        const wrapper = mount(AccountDelete, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeModal).toHaveBeenCalled();
    });

    it('isConfirmationComplete is false when email does not match', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'user@example.com';
        const wrapper = mount(AccountDelete, { global: { stubs } });
        wrapper.vm.confirmEmail = 'wrong@example.com';
        expect(wrapper.vm.isConfirmationComplete).toBe(false);
    });

    it('isConfirmationComplete is true when email matches', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'user@example.com';
        const wrapper = mount(AccountDelete, { global: { stubs } });
        wrapper.vm.confirmEmail = 'user@example.com';
        expect(wrapper.vm.isConfirmationComplete).toBe(true);
    });

    it('isConfirmationComplete is case-insensitive', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'user@example.com';
        const wrapper = mount(AccountDelete, { global: { stubs } });
        wrapper.vm.confirmEmail = 'USER@EXAMPLE.COM';
        expect(wrapper.vm.isConfirmationComplete).toBe(true);
    });

    it('deleteAccount() adds error when email does not match', () => {
        const store = useLighterpackStore();
        store.loggedIn = 'user@example.com';
        const wrapper = mount(AccountDelete, { global: { stubs } });
        wrapper.vm.confirmEmail = 'wrong@example.com';
        wrapper.vm.deleteAccount();
        expect(wrapper.vm.errors_).toEqual(
            expect.arrayContaining([expect.objectContaining({ field: 'confirmEmail' })]),
        );
    });
});
