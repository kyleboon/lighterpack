import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import GlobalAlerts from '../../../client/components/global-alerts.vue';
import { useLighterpackStore } from '../../../client/store/store.js';

describe('GlobalAlerts component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renders nothing when there are no alerts', () => {
        const wrapper = mount(GlobalAlerts);
        expect(wrapper.find('ul').exists()).toBe(false);
    });

    it('renders alerts from the store', async () => {
        const store = useLighterpackStore();
        store.globalAlerts.push({ message: 'Test alert' });

        const wrapper = mount(GlobalAlerts);
        expect(wrapper.find('ul').exists()).toBe(true);
        expect(wrapper.find('li').text()).toBe('Test alert');
    });

    it('renders multiple alerts', async () => {
        const store = useLighterpackStore();
        store.globalAlerts.push({ message: 'Alert 1' }, { message: 'Alert 2' });

        const wrapper = mount(GlobalAlerts);
        const items = wrapper.findAll('li');
        expect(items).toHaveLength(2);
    });
});
