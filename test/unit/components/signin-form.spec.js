import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SigninForm from '../../../app/components/signin-form.vue';

describe('SigninForm component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    const stubs = { errors: true, spinner: true };

    it('renders the sign-in form with email input', () => {
        const wrapper = mount(SigninForm, { global: { stubs } });
        expect(wrapper.find('form.signin').exists()).toBe(true);
        expect(wrapper.find('input[name="email"]').exists()).toBe(true);
    });

    it('does not show success message initially', () => {
        const wrapper = mount(SigninForm, { global: { stubs } });
        expect(wrapper.find('.lpSuccess').exists()).toBe(false);
    });

    it('adds a validation error when email is empty', async () => {
        const wrapper = mount(SigninForm, { global: { stubs } });
        await wrapper.find('form').trigger('submit');
        expect(wrapper.vm.errors_).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'email' })]));
    });

    it('uses default callbackURL of "/" when prop is not provided', async () => {
        const fetchSpy = vi.fn().mockResolvedValue({});
        vi.stubGlobal('$fetch', fetchSpy);

        const wrapper = mount(SigninForm, { global: { stubs } });
        await wrapper.find('input[name="email"]').setValue('test@example.com');
        await wrapper.vm.sendMagicLink();

        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/auth/sign-in/magic-link',
            expect.objectContaining({
                body: expect.objectContaining({ callbackURL: '/' }),
            }),
        );

        vi.unstubAllGlobals();
    });

    it('uses provided callbackURL prop in magic link request', async () => {
        const fetchSpy = vi.fn().mockResolvedValue({});
        vi.stubGlobal('$fetch', fetchSpy);

        const wrapper = mount(SigninForm, {
            global: { stubs },
            props: { callbackURL: '/r/abc123' },
        });
        await wrapper.find('input[name="email"]').setValue('test@example.com');
        await wrapper.vm.sendMagicLink();

        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/auth/sign-in/magic-link',
            expect.objectContaining({
                body: expect.objectContaining({ callbackURL: '/r/abc123' }),
            }),
        );

        vi.unstubAllGlobals();
    });
});
