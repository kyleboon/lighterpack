<template>
    <div>
        <modal id="itemImageDialog" :shown="shown" label-id="item-image-dialog-title" @hide="shown = false">
            <h2 id="item-image-dialog-title" class="image-dialog-title">{{ dialogTitle }}</h2>

            <!-- Existing image gallery -->
            <div v-if="images.length" class="image-gallery">
                <div ref="galleryEl" class="gallery-strip">
                    <div v-for="img in images" :key="img.id" class="gallery-item">
                        <img
                            :src="img.url"
                            class="gallery-thumb"
                            :alt="`Image ${images.indexOf(img) + 1}`"
                            @click="viewImage(img)"
                        />
                        <button
                            class="gallery-delete"
                            title="Remove image"
                            aria-label="Remove image"
                            @click="removeImage(img)"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <p class="gallery-hint">Drag thumbnails to reorder · Click to view full size</p>
            </div>

            <!-- Add section (hidden when at limit) -->
            <template v-if="images.length < MAX_IMAGES">
                <div class="add-section">
                    <div
                        class="drop-zone"
                        :class="{ 'is-dragging': isDragging, 'is-uploading': uploading }"
                        @dragover.prevent="isDragging = true"
                        @dragleave="isDragging = false"
                        @drop.prevent="handleDrop"
                        @click="fileInput.click()"
                    >
                        <template v-if="uploading">
                            <span class="drop-zone-spinner" />
                            <span class="drop-zone-text">Uploading…</span>
                        </template>
                        <template v-else>
                            <span class="drop-zone-icon">↑</span>
                            <span class="drop-zone-text">Drop image here or click to browse</span>
                        </template>
                    </div>

                    <form class="url-form" @submit.prevent="saveUrl">
                        <label class="url-label">Or paste an image URL</label>
                        <div class="url-row">
                            <input
                                v-model="urlInput"
                                type="text"
                                class="url-input"
                                placeholder="https://example.com/photo.jpg"
                            />
                            <button type="submit" class="lpButton" :disabled="!urlInput.trim() || savingUrl">
                                Add
                            </button>
                        </div>
                    </form>
                </div>
            </template>
            <p v-else class="max-notice">Maximum of {{ MAX_IMAGES }} images per item.</p>
        </modal>

        <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileChange" />
    </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import Sortable from 'sortablejs';
import { useLighterpackStore } from '../store/store';
import modal from './modal.vue';

const MAX_IMAGES = 4;

defineOptions({ name: 'ItemImage' });

const store = useLighterpackStore();

const fileInput = ref(null);
const galleryEl = ref(null);
const urlInput = ref('');
const uploading = ref(false);
const savingUrl = ref(false);
const isDragging = ref(false);

/** @type {import('sortablejs').Sortable | null} */
let sortableInstance = null;

const shown = computed({
    get: () => !!(store.activeItemDialog && store.activeItemDialog.type === 'image'),
    set: (val) => {
        if (!val) store.closeItemDialog();
    },
});

const entityType = computed(() => store.activeItemDialog?.entityType ?? 'item');

const dialogTitle = computed(() => {
    if (entityType.value === 'category') return 'Manage Category Images';
    if (entityType.value === 'list') return 'Manage List Images';
    return 'Manage Item Images';
});

// Look up the reactive library entity so images array stays live after uploads/deletes
const reactiveEntity = computed(() => {
    if (!store.activeItemDialog || store.activeItemDialog.type !== 'image') return null;
    const id = store.activeItemDialog.entity?.id;
    if (!id || !store.library) return null;
    if (entityType.value === 'category') return store.library.getCategoryById(id);
    if (entityType.value === 'list') return store.library.getListById(id);
    return store.library.getItemById(id);
});

const images = computed(() => (reactiveEntity.value?.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order));

watch(shown, (val) => {
    if (val) urlInput.value = '';
});

// Mount/remount Sortable whenever the gallery element appears or disappears
watch(galleryEl, (el) => {
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
    if (!el) return;
    sortableInstance = Sortable.create(el, {
        animation: 150,
        onEnd(evt) {
            const oldIndex = evt.oldIndex ?? 0;
            const newIndex = evt.newIndex ?? 0;
            if (oldIndex === newIndex) return;

            // Revert SortableJS DOM mutation so Vue re-renders cleanly
            if (newIndex < oldIndex) {
                el.insertBefore(evt.item, el.children[oldIndex + 1] ?? null);
            } else {
                el.insertBefore(evt.item, el.children[oldIndex] ?? null);
            }

            const reordered = [...images.value];
            const [moved] = reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, moved);
            store.reorderImages({ entityType: entityType.value, entityId: reactiveEntity.value.id, images: reordered });
        },
    });
});

onUnmounted(() => {
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
});

function viewImage(img) {
    store.openViewImageDialog(img.url);
}

async function removeImage(img) {
    if (!reactiveEntity.value) return;
    try {
        await store.deleteImage({ id: img.id, entityType: entityType.value, entityId: reactiveEntity.value.id });
    } catch {
        store._showError('Failed to delete image.');
    }
}

async function uploadFile(file) {
    if (!reactiveEntity.value || images.value.length >= MAX_IMAGES) return;

    const type = file.type;
    if (type !== 'image/png' && type !== 'image/jpeg' && type !== 'image/gif' && type !== 'image/webp') {
        alert('File must be an image (PNG, JPG, GIF, or WebP).');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        alert('Please upload a file less than 10 MB.');
        return;
    }

    uploading.value = true;
    try {
        await store.uploadImage({ file, entityType: entityType.value, entityId: reactiveEntity.value.id });
    } catch {
        alert('Upload failed. Please try again.');
    } finally {
        uploading.value = false;
    }
}

function handleFileChange(evt) {
    const file = evt.target.files[0];
    if (file) uploadFile(file);
    evt.target.value = '';
}

function handleDrop(evt) {
    isDragging.value = false;
    const file = evt.dataTransfer.files[0];
    if (file) uploadFile(file);
}

async function saveUrl() {
    const url = urlInput.value.trim();
    if (!url || !reactiveEntity.value) return;
    savingUrl.value = true;
    try {
        await store.addImageUrl({ entityType: entityType.value, entityId: reactiveEntity.value.id, url });
        urlInput.value = '';
    } catch {
        store._showError('Failed to save image URL.');
    } finally {
        savingUrl.value = false;
    }
}
</script>

<style>
#itemImageDialog {
    width: 560px;
}

.image-dialog-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 16px;
}

/* ── Gallery ────────────────────────────────────────────────────────────────── */

.image-gallery {
    margin-bottom: 20px;
}

.gallery-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.gallery-item {
    cursor: grab;
    position: relative;

    &:active {
        cursor: grabbing;
    }
}

.gallery-thumb {
    border-radius: 6px;
    cursor: pointer;
    display: block;
    height: 80px;
    object-fit: cover;
    width: 80px;
}

.gallery-delete {
    align-items: center;
    background: rgb(0 0 0 / 60%);
    border: none;
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    display: flex;
    font-size: 14px;
    height: 20px;
    justify-content: center;
    line-height: 1;
    padding: 0;
    position: absolute;
    right: 4px;
    top: 4px;
    width: 20px;

    &:hover {
        background: rgb(0 0 0 / 85%);
    }
}

.gallery-hint {
    color: #9e9c96;
    font-size: 11px;
    margin-top: 6px;
}

/* ── Add section ────────────────────────────────────────────────────────────── */

.add-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.drop-zone {
    align-items: center;
    background: #f8f7f3;
    border: 2px dashed #d0cfc9;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 6px;
    justify-content: center;
    min-height: 90px;
    padding: 20px;
    text-align: center;
    transition:
        border-color 0.15s,
        background 0.15s;

    &.is-dragging {
        background: #fff9ee;
        border-color: #e8a220;
    }

    &.is-uploading {
        cursor: default;
        opacity: 0.7;
    }
}

.drop-zone-icon {
    color: #8a8880;
    font-size: 22px;
    line-height: 1;
}

.drop-zone-text {
    color: #8a8880;
    font-size: 13px;
}

.drop-zone-spinner {
    animation: spin 0.8s linear infinite;
    border: 2px solid #d0cfc9;
    border-radius: 50%;
    border-top-color: #e8a220;
    display: inline-block;
    height: 20px;
    width: 20px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* ── URL form ───────────────────────────────────────────────────────────────── */

.url-label {
    color: #6b6964;
    display: block;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 6px;
}

.url-row {
    display: flex;
    gap: 8px;
}

.url-input {
    background: #f3f2ee;
    border: 1px solid #d0cfc9;
    border-radius: 6px;
    color: #1e1e1c;
    flex: 1;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 13px;
    min-width: 0;
    padding: 7px 10px;

    &:focus {
        border-color: #e8a220;
        outline: none;
    }
}

.max-notice {
    color: #8a8880;
    font-size: 13px;
    margin-top: 8px;
}
</style>
