<template>
    <modal id="copyListDialog" :shown="shown" @hide="shown = false">
        <h2>Choose the list to copy</h2>
        <select id="listToCopy" v-model="listId">
            <option v-for="list in library.lists" :key="list.id" :value="list.id">
                {{ list.name }}
            </option>
        </select>
        <br /><br />
        <p class="lpWarning">
            <b>Note:</b> Copying a list will link the items between your lists. Updating an item in one list will alter
            that item in all other lists that item is in.
        </p>
        <a id="copyConfirm" class="lpButton" @click="copyList">Copy List</a>
        <a class="lpButton close" @click="shown = false">Cancel</a>
    </modal>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import modal from './modal.vue';

defineOptions({ name: 'CopyList' });

const store = useLighterpackStore();

const listId = ref(false);

const library = computed(() => store.library);

const shown = computed({
    get: () => store.activeModal === 'copyList',
    set: (val) => {
        if (!val) store.closeModal();
    },
});

function copyList() {
    if (!listId.value) return; // TODO: errors
    store.copyList(listId.value);
    shown.value = false;
}
</script>

<style lang="scss">
#copyListDialog {
    width: 360px;
}

#listToCopy {
    appearance: none;
    background: #f3f2ee
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238a8880' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")
        no-repeat right 10px center;
    border: 1px solid #d0cfc9;
    border-radius: 6px;
    color: #1e1e1c;
    cursor: pointer;
    display: block;
    font-family: 'Figtree', system-ui, sans-serif;
    font-size: 13px;
    margin: 8px 0 16px;
    padding: 7px 32px 7px 10px;
    width: 100%;

    &:focus {
        border-color: #e8a220;
        outline: none;
    }
}
</style>
