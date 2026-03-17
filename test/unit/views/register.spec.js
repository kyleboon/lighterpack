import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import Register from '../../../app/pages/register.vue';

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({ push: vi.fn() }),
        useRoute: () => ({ path: '/register' }),
    };
});

const stubs = {
    modal: { template: '<div><slot /></div>' },
    blackoutFooter: true,
    globalAlerts: true,
    registerForm: true,
    RouterLink: { template: '<a><slot /></a>' },
};

describe('Register view', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renders the register form', () => {
        const wrapper = mount(Register, { global: { stubs } });
        expect(wrapper.find('#registerContainer').exists()).toBe(true);
    });

    it('isLocalSaving is true when saveType is local', () => {
        const store = useLighterpackStore();
        store.saveType = 'local';
        const wrapper = mount(Register, { global: { stubs } });
        expect(wrapper.find('.lpWarning').exists()).toBe(true);
    });

    it('isLocalSaving is false when saveType is not local', () => {
        const store = useLighterpackStore();
        store.saveType = 'remote';
        const wrapper = mount(Register, { global: { stubs } });
        expect(wrapper.find('.lpWarning').exists()).toBe(false);
    });
});
