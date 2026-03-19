import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Signin from '../../../app/pages/signin.vue';

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({ push: vi.fn() }),
        useRoute: () => ({ path: '/signin' }),
    };
});

const stubs = {
    modal: { template: '<div><slot /></div>' },
    blackoutFooter: true,
    globalAlerts: true,
    SigninForm: { name: 'SigninForm', template: '<div class="signin-form" />' },
    RouterLink: { template: '<a><slot /></a>' },
};

describe('Signin view', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renders the signin form', () => {
        const wrapper = mount(Signin, { global: { stubs } });
        expect(wrapper.find('.signin-form').exists()).toBe(true);
    });
});
