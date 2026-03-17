import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Sidebar from '../../../app/components/sidebar.vue';

describe('Sidebar component', () => {
    const stubs = { libraryItems: true, libraryLists: true };

    it('renders the sidebar container', () => {
        const wrapper = mount(Sidebar, { global: { stubs } });
        expect(wrapper.find('#sidebar').exists()).toBe(true);
    });

    it('renders libraryLists child', () => {
        const wrapper = mount(Sidebar, { global: { stubs } });
        expect(wrapper.findComponent({ name: 'libraryLists' }).exists()).toBe(true);
    });

    it('renders libraryItems child', () => {
        const wrapper = mount(Sidebar, { global: { stubs } });
        expect(wrapper.findComponent({ name: 'libraryItems' }).exists()).toBe(true);
    });
});
