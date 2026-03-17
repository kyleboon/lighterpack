<template>
    <span v-if="isSignedIn" class="headerItem hasPopover">
        <PopoverHover id="share" @shown="focusShare">
            <template #target><i class="lpSprite lpLink" /> Share</template>
            <template #content>
                <div class="lpFields">
                    <div class="lpField">
                        <label for="shareUrl">Share your list</label>
                        <input id="shareUrl" ref="shareUrlInput" v-select-on-focus type="text" :value="shareUrl" />
                    </div>
                    <div class="lpField">
                        <label for="embedUrl">Embed your list</label>
                        <textarea id="embedUrl" v-select-on-focus :value="embedCode" readonly />
                    </div>
                    <a id="csvUrl" :href="csvUrl" target="_blank" class="lpHref"
                        ><i class="lpSprite lpSpriteDownload" />Export to CSV</a
                    >
                </div>
            </template>
        </PopoverHover>
    </span>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import { fetchJson } from '../utils/utils.js';
import PopoverHover from './popover-hover.vue';

defineOptions({ name: 'Share' });

const store = useLighterpackStore();

const shareUrlInput = ref(null);

const library = computed(() => store.library);
const list = computed(() => library.value.getListById(library.value.defaultListId));
const isSignedIn = computed(() => store.loggedIn);
const externalId = computed(() => list.value.externalId || '');
const baseUrl = computed(() => {
    const location = window.location;
    return location.origin ? location.origin : `${location.protocol}//${location.hostname}`;
});
const shareUrl = computed(() => (externalId.value ? `${baseUrl.value}/r/${externalId.value}` : ''));
const csvUrl = computed(() => (externalId.value ? `${baseUrl.value}/csv/${externalId.value}` : ''));
const embedCode = computed(
    () => `<script src="${baseUrl.value}/e/${externalId.value}"><\/script><div id="${externalId.value}"></div>`,
);

function focusShare(_evt) {
    if (!list.value.externalId) {
        fetchJson('/externalId', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
        })
            .then((response) => {
                store.setExternalId({ externalId: response.externalId, list: list.value });
                nextTick(() => {
                    if (shareUrlInput.value) shareUrlInput.value.select();
                });
            })
            .catch((_response) => {
                alert('An error occurred while attempting to get an ID for your list. Please try again later.'); // TODO
            });
    } else {
        nextTick(() => {
            if (shareUrlInput.value) shareUrlInput.value.select();
        });
    }
}
</script>

<style lang="scss">
#share label {
    font-weight: bold;
}
</style>
