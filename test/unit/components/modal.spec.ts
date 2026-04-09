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
        await wrapper.find('.lp-modal-overlay').trigger('click');
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('emits hide when Escape key is pressed', async () => {
        const wrapper = mount(Modal, { props: { shown: true } });
        await wrapper.trigger('keyup', { keyCode: 27 });
        window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 27 }));
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('applies transparent overlay class when transparentOverlay is true', () => {
        const wrapper = mount(Modal, { props: { shown: true, transparentOverlay: true } });
        expect(wrapper.find('.lp-modal-overlay.is-transparent').exists()).toBe(true);
    });

    it('has role="dialog" and aria-modal="true" when shown', () => {
        const wrapper = mount(Modal, {
            props: { shown: true },
            slots: { default: '<h2 id="modal-title">Title</h2>' },
        });
        const dialog = wrapper.find('.lp-modal');
        expect(dialog.attributes('role')).toBe('dialog');
        expect(dialog.attributes('aria-modal')).toBe('true');
    });

    it('sets aria-labelledby to the provided labelId prop', () => {
        const wrapper = mount(Modal, {
            props: { shown: true, labelId: 'my-title' },
            slots: { default: '<h2 id="my-title">Title</h2>' },
        });
        const dialog = wrapper.find('.lp-modal');
        expect(dialog.attributes('aria-labelledby')).toBe('my-title');
    });
});
