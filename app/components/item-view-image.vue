<template>
    <modal id="lpImageDialog" :shown="shown" @hide="shown = false">
        <img :src="imageUrl" />
    </modal>
</template>

<script setup>
import { computed } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import modal from './modal.vue';

defineOptions({ name: 'ItemViewImage' });

const store = useLighterpackStore();

const shown = computed({
    get: () => !!(store.activeItemDialog && store.activeItemDialog.type === 'viewImage'),
    set: (val) => {
        if (!val) store.closeItemDialog();
    },
});

const imageUrl = computed(() =>
    store.activeItemDialog && store.activeItemDialog.type === 'viewImage' ? store.activeItemDialog.imageUrl : '',
);
</script>

<style lang="scss">
#itemImageDialog {
    width: 640px;

    .imageUploadDescription {
        margin-bottom: 19px;
    }
}
</style>
