import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BlackoutFooter from '../../../client/components/blackout-footer.vue';

describe('BlackoutFooter component', () => {
    it('renders the footer container', () => {
        const wrapper = mount(BlackoutFooter);
        expect(wrapper.find('#lpWelcomeFooter').exists()).toBe(true);
    });

    it('renders a contact link', () => {
        const wrapper = mount(BlackoutFooter);
        const links = wrapper.findAll('a');
        expect(links.length).toBeGreaterThan(0);
    });
});
