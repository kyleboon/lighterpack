import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PopoverHover from '../../../client/components/popover-hover.vue';

describe('PopoverHover component', () => {
    it('starts with shown false', () => {
        const wrapper = mount(PopoverHover, {
            global: { stubs: { Popover: true } },
        });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('show() sets shown to true and emits shown', () => {
        const wrapper = mount(PopoverHover, {
            global: { stubs: { Popover: true } },
        });
        wrapper.vm.show();
        expect(wrapper.vm.shown).toBe(true);
        expect(wrapper.emitted('shown')).toBeTruthy();
    });

    it('hide() sets shown to false and emits hidden', () => {
        const wrapper = mount(PopoverHover, {
            global: { stubs: { Popover: true } },
        });
        wrapper.vm.show();
        wrapper.vm.hide();
        expect(wrapper.vm.shown).toBe(false);
        expect(wrapper.emitted('hidden')).toBeTruthy();
    });

    it('startHideTimeout() hides after 50ms', async () => {
        vi.useFakeTimers();
        const wrapper = mount(PopoverHover, {
            global: { stubs: { Popover: true } },
        });
        wrapper.vm.show();
        wrapper.vm.startHideTimeout();
        vi.advanceTimersByTime(60);
        expect(wrapper.vm.shown).toBe(false);
        vi.useRealTimers();
    });

    it('show() cancels pending hide timeout', async () => {
        vi.useFakeTimers();
        const wrapper = mount(PopoverHover, {
            global: { stubs: { Popover: true } },
        });
        wrapper.vm.show();
        wrapper.vm.startHideTimeout();
        wrapper.vm.show(); // cancels the timeout
        vi.advanceTimersByTime(100);
        expect(wrapper.vm.shown).toBe(true);
        vi.useRealTimers();
    });
});
