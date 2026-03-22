<template>
    <span v-if="isSignedIn" class="headerItem hasPopover">
        <PopoverHover id="share" @shown="focusShare">
            <template #target>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7 4" />
                    <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L9 12" />
                </svg>
                Share
            </template>
            <template #content>
                <div class="lp-share-fields">
                    <div class="lp-share-field">
                        <label class="lp-share-label" for="shareUrl">Share your list</label>
                        <input
                            id="shareUrl"
                            ref="shareUrlInput"
                            v-select-on-focus
                            class="lp-share-input"
                            type="text"
                            :value="shareUrl"
                        />
                    </div>
                    <div class="lp-share-field">
                        <label class="lp-share-label" for="embedUrl">Embed your list</label>
                        <textarea id="embedUrl" v-select-on-focus class="lp-share-input" :value="embedCode" readonly />
                    </div>
                    <a id="csvUrl" :href="csvUrl" target="_blank" class="lpHref lp-share-download">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            aria-hidden="true"
                        >
                            <path d="M8 2v9" />
                            <path d="M5 8l3 3 3-3" />
                            <path d="M3 13h10" />
                        </svg>
                        Export to CSV
                    </a>
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
        fetchJson('/api/external-id', {
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
#share .lp-popover-content,
#share .lpContent {
    width: 330px;
}

.lp-share-fields {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.lp-share-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.lp-share-label {
    color: #1e1e1c;
    font-family: 'Figtree', system-ui, sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
}

.lp-share-input {
    background: #f3f2ee;
    border: 1px solid #d0cfc9;
    border-radius: 6px;
    color: #1e1e1c;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    padding: 6px 8px;
    resize: none;
    width: 100%;

    &:focus {
        border-color: #e8a220;
        outline: none;
    }
}

textarea.lp-share-input {
    height: 56px;
}

.lp-share-download {
    align-items: center;
    color: #8a8880;
    display: inline-flex;
    font-family: 'Figtree', system-ui, sans-serif;
    font-size: 12px;
    gap: 5px;
    margin-top: 4px;
    text-decoration: none;
    transition: color 120ms ease;

    &:hover {
        color: #e8a220;
    }
}
</style>
