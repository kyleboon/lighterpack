<template>
    <modal id="itemLinkDialog" :shown="shown" label-id="item-link-dialog-title" @hide="shown = false">
        <h2 id="item-link-dialog-title">Add a link for this item</h2>
        <form id="itemLinkForm" @submit.prevent="addLink">
            <input v-model="url" type="text" d="itemLink" placeholder="Item Link" />
            <input type="submit" class="lpButton" value="Save" />
            <a class="lpHref close" @click="shown = false">Cancel</a>
        </form>
    </modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useLighterpackStore } from '../store/store';
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

<style>
#itemLinkDialog {
    width: 380px;
}

#itemLinkForm {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;

    input[type='text'] {
        background: #f3f2ee;
        border: 1px solid #d0cfc9;
        border-radius: 6px;
        color: #1e1e1c;
        font-family: Figtree, system-ui, sans-serif;
        font-size: 13px;
        padding: 7px 10px;
        width: 100%;

        &:focus {
            border-color: #e8a220;
            outline: none;
        }
    }
}
</style>
