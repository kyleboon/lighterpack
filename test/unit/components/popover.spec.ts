import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Popover from '../../../app/components/popover.vue';

describe('Popover component', () => {
    it('adds lpPopoverShown class when shown is true', () => {
        const wrapper = mount(Popover, { props: { shown: true } });
        expect(wrapper.find('.lpPopoverShown').exists()).toBe(true);
    });

    it('does not add lpPopoverShown class when shown is false', () => {
        const wrapper = mount(Popover, { props: { shown: false } });
        expect(wrapper.find('.lpPopoverShown').exists()).toBe(false);
    });

    it('emits hide when Escape key is pressed and shown is true', () => {
        mount(Popover, { props: { shown: true } });
        window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 27 }));
        // Checking via a fresh mount to verify the listener was registered
        const wrapper2 = mount(Popover, { props: { shown: true } });
        window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 27 }));
        expect(wrapper2.emitted('hide')).toBeTruthy();
    });

    it('does not emit hide when shown is false and Escape is pressed', () => {
        const wrapper = mount(Popover, { props: { shown: false } });
        window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 27 }));
        expect(wrapper.emitted('hide')).toBeFalsy();
    });

    it('renders target and content slots', () => {
        const wrapper = mount(Popover, {
            props: { shown: true },
            slots: {
                target: '<button class="my-target">Open</button>',
                content: '<div class="my-content">Content</div>',
            },
        });
        expect(wrapper.find('.my-target').exists()).toBe(true);
        expect(wrapper.find('.my-content').exists()).toBe(true);
    });

    it('has aria-modal="true" on the content div', () => {
        const wrapper = mount(Popover, {
            props: { shown: true },
            slots: {
                target: '<button>trigger</button>',
                content: '<div>content</div>',
            },
        });
        const content = wrapper.find('.lp-popover-content');
        expect(content.attributes('aria-modal')).toBe('true');
    });
});
