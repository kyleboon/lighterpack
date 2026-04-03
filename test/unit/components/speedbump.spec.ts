import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store';
import Speedbump from '../../../app/components/speedbump.vue';

describe('Speedbump component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true };

    it('is not shown when speedbump is null', () => {
        const store = useLighterpackStore();
        store.speedbump = null;
        const wrapper = mount(Speedbump, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('is shown when speedbump is set', () => {
        const store = useLighterpackStore();
        store.speedbump = { options: 'Are you sure?' };
        const wrapper = mount(Speedbump, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(true);
    });

    it('setting shown to false calls store.closeSpeedbump', () => {
        const store = useLighterpackStore();
        store.speedbump = { options: 'Are you sure?' };
        store.closeSpeedbump = vi.fn();
        const wrapper = mount(Speedbump, { global: { stubs } });
        wrapper.vm.shown = false;
        expect(store.closeSpeedbump).toHaveBeenCalled();
    });

    it('messages uses defaults when speedbump is null', () => {
        const store = useLighterpackStore();
        store.speedbump = null;
        const wrapper = mount(Speedbump, { global: { stubs } });
        expect(wrapper.vm.messages.confirm).toBe('Yes');
        expect(wrapper.vm.messages.cancel).toBe('No');
    });

    it('messages uses string option as body', () => {
        const store = useLighterpackStore();
        store.speedbump = { options: 'Delete this item?' };
        const wrapper = mount(Speedbump, { global: { stubs } });
        expect(wrapper.vm.messages.body).toBe('Delete this item?');
    });

    it('messages merges object options', () => {
        const store = useLighterpackStore();
        store.speedbump = { options: { title: 'Confirm', body: 'Really?', confirm: 'Yep' } };
        const wrapper = mount(Speedbump, { global: { stubs } });
        expect(wrapper.vm.messages.title).toBe('Confirm');
        expect(wrapper.vm.messages.body).toBe('Really?');
        expect(wrapper.vm.messages.confirm).toBe('Yep');
        expect(wrapper.vm.messages.cancel).toBe('No'); // default preserved
    });

    it('confirmSpeedbump() calls store.confirmSpeedbump', () => {
        const store = useLighterpackStore();
        store.speedbump = { options: 'Sure?' };
        store.confirmSpeedbump = vi.fn();
        const wrapper = mount(Speedbump, { global: { stubs } });
        wrapper.vm.confirmSpeedbump();
        expect(store.confirmSpeedbump).toHaveBeenCalled();
    });
});
