import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Signin from '../../../client/views/signin.vue';

let mockPath = '/signin';

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({ push: vi.fn() }),
        useRoute: () => ({ path: mockPath }),
    };
});

const stubs = {
    modal: { template: '<div><slot /></div>' },
    blackoutFooter: true,
    globalAlerts: true,
    SigninForm: {
        name: 'SigninForm',
        template: '<div class="signin-form" />',
        props: ['message'],
    },
    RouterLink: { template: '<a><slot /></a>' },
};

describe('Signin view', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockPath = '/signin';
    });

    it('renders the signin form', () => {
        const wrapper = mount(Signin, { global: { stubs } });
        expect(wrapper.find('.signin-form').exists()).toBe(true);
    });

    it('message is empty for a normal signin path', () => {
        mockPath = '/signin';
        const wrapper = mount(Signin, { global: { stubs } });
        const form = wrapper.findComponent(stubs.SigninForm);
        expect(form.props('message')).toBe('');
    });

    it('message is set for reset-password path', () => {
        mockPath = '/signin/reset-password';
        const wrapper = mount(Signin, { global: { stubs } });
        const form = wrapper.findComponent(stubs.SigninForm);
        expect(form.props('message')).not.toBe('');
        expect(form.props('message')).toContain('email');
    });

    it('message is set for forgot-username path', () => {
        mockPath = '/signin/forgot-username';
        const wrapper = mount(Signin, { global: { stubs } });
        const form = wrapper.findComponent(stubs.SigninForm);
        expect(form.props('message')).not.toBe('');
        expect(form.props('message')).toContain('email');
    });
});
