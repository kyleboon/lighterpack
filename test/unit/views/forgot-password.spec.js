import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ForgotPassword from '../../../app/pages/forgot-password.vue';

const mockPush = vi.fn();

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({ push: mockPush }),
        useRoute: () => ({ path: '/forgot-password' }),
    };
});

vi.mock('../../../app/utils/utils.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, fetchJson: vi.fn() };
});

const stubs = {
    modal: { template: '<div><slot /></div>' },
    blackoutFooter: true,
    errors: true,
    RouterLink: { template: '<a><slot /></a>' },
};

describe('ForgotPassword view', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockPush.mockClear();
    });

    it('renders the forgot-password form', () => {
        const wrapper = mount(ForgotPassword, { global: { stubs } });
        expect(wrapper.find('form.forgotPassword').exists()).toBe(true);
        expect(wrapper.find('form.forgotUsername').exists()).toBe(true);
    });

    it('resetPassword clears forgotPasswordErrors before submitting', async () => {
        const { fetchJson } = await import('../../../app/utils/utils.js');
        fetchJson.mockResolvedValue({});

        const wrapper = mount(ForgotPassword, { global: { stubs } });
        wrapper.vm.forgotPasswordErrors = [{ message: 'old error' }];
        await wrapper.vm.resetPassword();
        expect(fetchJson).toHaveBeenCalledWith('/forgotPassword', expect.objectContaining({ method: 'POST' }));
    });

    it('forgotUsername clears forgotUsernameErrors before submitting', async () => {
        const { fetchJson } = await import('../../../app/utils/utils.js');
        fetchJson.mockResolvedValue({});

        const wrapper = mount(ForgotPassword, { global: { stubs } });
        wrapper.vm.forgotUsernameErrors = [{ message: 'old error' }];
        await wrapper.vm.forgotUsername();
        expect(fetchJson).toHaveBeenCalledWith('/forgotUsername', expect.objectContaining({ method: 'POST' }));
    });

    it('resetPassword sets errors on failure', async () => {
        const { fetchJson } = await import('../../../app/utils/utils.js');
        fetchJson.mockRejectedValue({ json: { errors: [{ message: 'Invalid username' }] } });

        const wrapper = mount(ForgotPassword, { global: { stubs } });
        await wrapper.vm.resetPassword();
        expect(wrapper.vm.forgotPasswordErrors).toEqual([{ message: 'Invalid username' }]);
    });

    it('forgotUsername sets errors on failure', async () => {
        const { fetchJson } = await import('../../../app/utils/utils.js');
        fetchJson.mockRejectedValue({ json: { errors: [{ message: 'Invalid email' }] } });

        const wrapper = mount(ForgotPassword, { global: { stubs } });
        await wrapper.vm.forgotUsername();
        expect(wrapper.vm.forgotUsernameErrors).toEqual([{ message: 'Invalid email' }]);
    });
});
