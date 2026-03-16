import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Spinner from '../../../client/components/spinner.vue';

describe('Spinner component', () => {
    it('renders a div with class lpSpinner', () => {
        const wrapper = mount(Spinner);
        expect(wrapper.find('.lpSpinner').exists()).toBe(true);
    });
});
