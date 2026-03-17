import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Modal from '../../../app/components/modal.vue';

describe('Modal component', () => {
    it('renders slot content when shown is true', () => {
        const wrapper = mount(Modal, {
            props: { shown: true },
            slots: { default: '<p class="content">Hello</p>' },
        });
        expect(wrapper.find('.content').exists()).toBe(true);
    });

    it('does not render slot content when shown is false', () => {
        const wrapper = mount(Modal, {
            props: { shown: false },
            slots: { default: '<p class="content">Hello</p>' },
        });
        expect(wrapper.find('.content').exists()).toBe(false);
    });

    it('emits hide when overlay is clicked', async () => {
        const wrapper = mount(Modal, { props: { shown: true } });
        await wrapper.find('.lpModalOverlay').trigger('click');
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('emits hide when Escape key is pressed', async () => {
        const wrapper = mount(Modal, { props: { shown: true } });
        await wrapper.trigger('keyup', { keyCode: 27 });
        window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 27 }));
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('applies blackout class when blackout prop is true', () => {
        const wrapper = mount(Modal, { props: { shown: true, blackout: true } });
        expect(wrapper.find('.lpBlackout').exists()).toBe(true);
    });

    it('applies transparent overlay class when transparentOverlay is true', () => {
        const wrapper = mount(Modal, { props: { shown: true, transparentOverlay: true } });
        expect(wrapper.find('.lpTransparent').exists()).toBe(true);
    });
});
