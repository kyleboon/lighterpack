import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Moderation from '../../../app/pages/moderation.vue';

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({ push: vi.fn() }),
        useRoute: () => ({ path: '/moderation' }),
    };
});

vi.mock('../../../app/utils/utils.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, fetchJson: vi.fn() };
});

describe('Moderation view', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renders the admin panel heading', () => {
        const wrapper = mount(Moderation);
        expect(wrapper.find('h1').text()).toBe('Admin panel');
    });

    it('resultsLoaded is false initially', () => {
        const wrapper = mount(Moderation);
        expect(wrapper.vm.resultsLoaded).toBe(false);
    });

    it('setUser sets userToInspect and editableLibrary', () => {
        const wrapper = mount(Moderation);
        const user = { username: 'alice', library: { items: [] } };
        wrapper.vm.setUser(user);
        expect(wrapper.vm.userToInspect).toEqual(user);
        expect(wrapper.vm.editableLibrary).toBe(JSON.stringify(user.library));
    });

    it('setUser resets newPassword to null', () => {
        const wrapper = mount(Moderation);
        wrapper.vm.newPassword = 'oldpassword';
        const user = { username: 'bob', library: {} };
        wrapper.vm.setUser(user);
        expect(wrapper.vm.newPassword).toBeNull();
    });

    it('resultsLoaded is true when searchResults is set', async () => {
        const { fetchJson } = await import('../../../app/utils/utils.js');
        fetchJson.mockResolvedValue({ results: [{ username: 'alice' }] });

        const wrapper = mount(Moderation);
        await wrapper.vm.searchUsers();
        expect(wrapper.vm.resultsLoaded).toBe(true);
    });
});
