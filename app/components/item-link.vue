<template>
    <modal id="itemLinkDialog" :shown="shown" @hide="shown = false">
        <h2>Add a link for this item</h2>
        <form id="itemLinkForm" @submit.prevent="addLink">
            <input v-model="url" type="text" d="itemLink" placeholder="Item Link" />
            <input type="submit" class="lpButton" value="Save" />
            <a class="lpHref close" @click="shown = false">Cancel</a>
        </form>
    </modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import modal from './modal.vue';

defineOptions({ name: 'ItemLink' });

const store = useLighterpackStore();

const url = ref('');

const shown = computed({
    get: () => !!(store.activeItemDialog && store.activeItemDialog.type === 'link'),
    set: (val) => {
        if (!val) store.closeItemDialog();
    },
});

const item = computed(() => (store.activeItemDialog ? store.activeItemDialog.item : null));

watch(shown, (val) => {
    if (val && item.value) {
        url.value = item.value.url;
    }
});

function addLink() {
    store.updateItemLink({ url: url.value, item: item.value });
    store.closeItemDialog();
}
</script>

<style lang="scss"></style>
