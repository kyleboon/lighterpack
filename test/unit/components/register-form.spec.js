import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import RegisterForm from '../../../app/components/register-form.vue';

const mockPush = vi.fn();
vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useRouter: () => ({ push: mockPush }) };
});

vi.mock('../../../client/utils/utils.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, fetchJson: vi.fn() };
});

describe('RegisterForm component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockPush.mockClear();
    });

    const stubs = { errors: true, spinner: true };

    it('renders the register form', () => {
        const wrapper = mount(RegisterForm, { global: { stubs } });
        expect(wrapper.find('form.lpRegister').exists()).toBe(true);
    });

    it('adds a validation error when username is empty', async () => {
        const wrapper = mount(RegisterForm, { global: { stubs } });
        wrapper.vm.password = 'secret123';
        wrapper.vm.email = 'test@test.com';
        wrapper.vm.passwordConfirm = 'secret123';
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors_).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'username' })]));
    });

    it('adds a validation error when email is empty', async () => {
        const wrapper = mount(RegisterForm, { global: { stubs } });
        wrapper.vm.username = 'alice';
        wrapper.vm.password = 'secret123';
        wrapper.vm.passwordConfirm = 'secret123';
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors_).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'email' })]));
    });

    it('adds a validation error when password is empty', async () => {
        const wrapper = mount(RegisterForm, { global: { stubs } });
        wrapper.vm.username = 'alice';
        wrapper.vm.email = 'alice@example.com';
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors_).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'password' })]));
    });

    it('adds a validation error when passwords do not match', async () => {
        const wrapper = mount(RegisterForm, { global: { stubs } });
        wrapper.vm.username = 'alice';
        wrapper.vm.email = 'alice@example.com';
        wrapper.vm.password = 'secret123';
        wrapper.vm.passwordConfirm = 'different';
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors_).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'password' })]));
    });

    it('adds a validation error when username is too short', async () => {
        const wrapper = mount(RegisterForm, { global: { stubs } });
        wrapper.vm.username = 'ab';
        wrapper.vm.email = 'alice@example.com';
        wrapper.vm.password = 'secret123';
        wrapper.vm.passwordConfirm = 'secret123';
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors_).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'username' })]));
    });

    it('loadLocal pushes to / if already local saving', () => {
        const store = useLighterpackStore();
        store.saveType = 'local';
        const wrapper = mount(RegisterForm, { global: { stubs } });
        wrapper.vm.loadLocal();
        expect(mockPush).toHaveBeenCalledWith('/');
    });
});
