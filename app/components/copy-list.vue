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
@use '../css/globals' as *;
</style>
