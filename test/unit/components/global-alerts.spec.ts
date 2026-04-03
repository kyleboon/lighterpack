import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import GlobalAlerts from '../../../app/components/global-alerts.vue';
import { useLighterpackStore } from '../../../app/store/store';

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
        expect(wrapper.find('.lp-global-alert').exists()).toBe(true);
        expect(wrapper.find('.lp-global-alert').text()).toContain('Test alert');
    });

    it('renders multiple alerts', async () => {
        const store = useLighterpackStore();
        store.globalAlerts.push({ message: 'Alert 1' }, { message: 'Alert 2' });

        const wrapper = mount(GlobalAlerts);
        const items = wrapper.findAll('.lp-global-alert');
        expect(items).toHaveLength(2);
    });
});
