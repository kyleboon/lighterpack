import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useLighterpackStore } from '../../../app/store/store.js';
import ImportCsv from '../../../app/components/import-csv.vue';

describe('ImportCsv component', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const stubs = { modal: true };

    it('renders the import CSV container', () => {
        const wrapper = mount(ImportCsv, { global: { stubs } });
        expect(wrapper.find('#importCSV').exists()).toBe(true);
    });

    it('shown starts as false', () => {
        const wrapper = mount(ImportCsv, { global: { stubs } });
        expect(wrapper.vm.shown).toBe(false);
    });

    it('validateImport sets shown to true for valid CSV data', () => {
        const wrapper = mount(ImportCsv, { global: { stubs } });
        const csvContent = 'Item Name,Category,Description,Qty,Weight,Unit\nTent,Shelter,My tent,1,500,g';
        wrapper.vm.validateImport(csvContent, 'my-list');
        expect(wrapper.vm.shown).toBe(true);
        expect(wrapper.vm.importData.data).toHaveLength(1);
    });

    it('validateImport skips header row', () => {
        const wrapper = mount(ImportCsv, { global: { stubs } });
        const csvContent = 'Item Name,Category,Description,Qty,Weight,Unit\nTent,Shelter,My tent,1,500,g';
        wrapper.vm.validateImport(csvContent, 'list');
        expect(wrapper.vm.importData.data[0].name).toBe('Tent');
    });

    it('validateImport normalizes unit aliases', () => {
        const wrapper = mount(ImportCsv, { global: { stubs } });
        const csvContent = 'Item Name,Category,Description,Qty,Weight,Unit\nItem,Cat,Desc,1,100,ounces';
        wrapper.vm.validateImport(csvContent, 'list');
        expect(wrapper.vm.importData.data[0].unit).toBe('oz');
    });

    it('importList calls store.importCSV and hides modal', () => {
        const store = useLighterpackStore();
        store.importCSV = vi.fn();
        const wrapper = mount(ImportCsv, { global: { stubs } });
        wrapper.vm.shown = true;
        wrapper.vm.importData = { data: [{ name: 'Tent' }], name: 'list' };
        wrapper.vm.importList();
        expect(store.importCSV).toHaveBeenCalledWith(wrapper.vm.importData);
        expect(wrapper.vm.shown).toBe(false);
    });
});
