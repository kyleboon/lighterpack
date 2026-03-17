import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import SigninForm from '../../../app/components/signin-form.vue';

const mockPush = vi.fn();
vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useRouter: () => ({ push: mockPush }) };
});

vi.mock('../../../client/utils/utils.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, fetchJson: vi.fn() };
});

describe('SigninForm component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockPush.mockClear();
    });

    const stubs = { errors: true, spinner: true };

    it('renders the sign-in form', () => {
        const wrapper = mount(SigninForm, { global: { stubs } });
        expect(wrapper.find('form.signin').exists()).toBe(true);
    });

    it('shows the message prop when provided', () => {
        const wrapper = mount(SigninForm, {
            props: { message: 'Password reset successfully.' },
            global: { stubs },
        });
        expect(wrapper.text()).toContain('Password reset successfully.');
    });

    it('does not show message paragraph when message is null', () => {
        const wrapper = mount(SigninForm, { global: { stubs } });
        expect(wrapper.find('.lpSuccess').exists()).toBe(false);
    });

    it('adds a validation error when username is empty', async () => {
        const wrapper = mount(SigninForm, { global: { stubs } });
        wrapper.vm.password = 'secret';
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors_).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'username' })]));
    });

    it('adds a validation error when password is empty', async () => {
        const wrapper = mount(SigninForm, { global: { stubs } });
        wrapper.vm.username = 'alice';
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors_).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'password' })]));
    });
});
