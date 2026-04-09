<template>
    <modal id="lpImageDialog" :shown="shown" label-id="view-image-dialog-title" @hide="shown = false">
        <h2 id="view-image-dialog-title" class="visually-hidden">Image viewer</h2>
        <!-- Main image display -->
        <div class="view-image-main">
            <button
                v-if="images.length > 1"
                class="nav-btn nav-prev"
                :disabled="activeIndex === 0"
                aria-label="Previous image"
                @click="prev"
            >
                ‹
            </button>
            <img :src="activeUrl" class="view-image-img" alt="Full size image" />
            <button
                v-if="images.length > 1"
                class="nav-btn nav-next"
                :disabled="activeIndex === images.length - 1"
                aria-label="Next image"
                @click="next"
            >
                ›
            </button>
        </div>

        <!-- Thumbnail strip (multi-image only) -->
        <div v-if="images.length > 1" class="view-thumb-strip">
            <img
                v-for="(img, i) in images"
                :key="img.id ?? i"
                :src="img.url ?? img"
                class="view-thumb"
                :class="{ 'is-active': i === activeIndex }"
                :alt="`Thumbnail ${i + 1}`"
                @click="activeIndex = i"
            />
        </div>
    </modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useLighterpackStore } from '../store/store';
import modal from './modal.vue';

defineOptions({ name: 'ItemViewImage' });

const store = useLighterpackStore();
const activeIndex = ref(0);

const shown = computed({
    get: () => !!(store.activeItemDialog && store.activeItemDialog.type === 'viewImage'),
    set: (val) => {
        if (!val) store.closeItemDialog();
    },
});

// Normalise both { imageUrl } and { images } dialogs into a flat array
const images = computed(() => {
    if (!store.activeItemDialog || store.activeItemDialog.type !== 'viewImage') return [];
    if (store.activeItemDialog.images?.length) {
        return store.activeItemDialog.images;
    }
    if (store.activeItemDialog.imageUrl) {
        return [{ id: null, url: store.activeItemDialog.imageUrl }];
    }
    return [];
});

const activeUrl = computed(() => {
    const img = images.value[activeIndex.value];
    if (!img) return '';
    return img.url ?? img;
});

// Reset to startIndex (or 0) whenever the dialog opens
watch(shown, (val) => {
    if (val) activeIndex.value = store.activeItemDialog?.startIndex ?? 0;
});

function prev() {
    if (activeIndex.value > 0) activeIndex.value--;
}
function next() {
    if (activeIndex.value < images.value.length - 1) activeIndex.value++;
}
</script>

<style>
#lpImageDialog {
    max-width: 90vw;
    width: auto;
}

.view-image-main {
    align-items: center;
    display: flex;
    gap: 8px;
    justify-content: center;
}

.view-image-img {
    border-radius: 6px;
    display: block;
    max-height: 70vh;
    max-width: calc(90vw - 80px);
    object-fit: contain;
}

.nav-btn {
    background: none;
    border: 1px solid #d0cfc9;
    border-radius: 50%;
    color: #4a4845;
    cursor: pointer;
    flex-shrink: 0;
    font-size: 22px;
    height: 36px;
    line-height: 1;
    padding: 0;
    width: 36px;

    &:hover:not(:disabled) {
        background: #f3f2ee;
    }

    &:disabled {
        color: #c8c6c0;
        cursor: default;
    }
}

.view-thumb-strip {
    display: flex;
    gap: 6px;
    justify-content: center;
    margin-top: 12px;
    overflow-x: auto;
}

.view-thumb {
    border: 2px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
    height: 48px;
    object-fit: cover;
    opacity: 0.6;
    transition:
        opacity 0.15s,
        border-color 0.15s;
    width: 48px;

    &.is-active,
    &:hover {
        border-color: #e8a220;
        opacity: 1;
    }
}
</style>
