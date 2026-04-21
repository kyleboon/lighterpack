<template>
    <div v-if="isSignedIn" class="bw-list-actions">
        <Popover id="list-actions" :shown="menuOpen" @hide="closeMenu">
            <template #target>
                <button
                    class="bw-btn bw-btn-icon bw-list-actions-btn"
                    :class="{ 'is-copied': copied }"
                    aria-label="List actions"
                    title="List actions"
                    @click="toggleMenu"
                >
                    <svg
                        v-if="!copied"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        stroke="none"
                        aria-hidden="true"
                    >
                        <circle cx="3" cy="8" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="13" cy="8" r="1.5" />
                    </svg>
                    <svg
                        v-else
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M3 8l4 4 6-6" />
                    </svg>
                </button>
            </template>
            <template #content>
                <div class="bw-actions-menu">
                    <div class="bw-actions-menu-section-label">Share</div>
                    <button
                        class="bw-actions-menu-item"
                        :disabled="loading"
                        :aria-disabled="loading"
                        @click="copyShareLink"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7 4" />
                            <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L9 12" />
                        </svg>
                        Copy share link
                    </button>

                    <div class="bw-actions-menu-divider" />
                    <div class="bw-actions-menu-section-label">Export</div>
                    <button
                        class="bw-actions-menu-item"
                        :disabled="loading"
                        :aria-disabled="loading"
                        @click="exportCSV"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M8 2v9" />
                            <path d="M5 8l3 3 3-3" />
                            <path d="M3 13h10" />
                        </svg>
                        Export to CSV
                    </button>

                    <div class="bw-actions-menu-divider" />
                    <div class="bw-actions-menu-section-label">Manage</div>
                    <button class="bw-actions-menu-item" @click="copyList">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <rect x="2" y="4" width="10" height="10" rx="1" />
                            <path d="M5 4V3a1 1 0 011-1h7a1 1 0 011 1v10a1 1 0 01-1 1h-1" />
                        </svg>
                        Copy this list
                    </button>
                </div>
            </template>
        </Popover>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useBaseweightStore } from '../store/store';
import { fetchJson } from '../utils/utils';
import Popover from './popover.vue';

defineOptions({ name: 'ListActions' });

const store = useBaseweightStore();

const menuOpen = ref(false);
const copied = ref(false);
const loading = ref(false);

const isSignedIn = computed(() => store.loggedIn);
const library = computed(() => store.library);
const list = computed(() => library.value.getListById(library.value.defaultListId));
const baseUrl = computed(() => {
    const loc = window.location;
    return loc.origin || `${loc.protocol}//${loc.hostname}`;
});

function toggleMenu() {
    menuOpen.value = !menuOpen.value;
}

function closeMenu() {
    menuOpen.value = false;
}

async function ensureExternalId() {
    if (list.value.externalId) return list.value.externalId;
    loading.value = true;
    try {
        const response = await fetchJson('/api/external-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
        });
        store.setExternalId({ externalId: response.externalId, list: list.value });
        return response.externalId;
    } catch {
        store._showError('An error occurred while generating a share link. Please try again.');
        return null;
    } finally {
        loading.value = false;
    }
}

async function copyShareLink() {
    if (loading.value) return;
    closeMenu();
    const id = await ensureExternalId();
    if (!id) return;
    const url = `${baseUrl.value}/r/${id}`;
    try {
        await navigator.clipboard.writeText(url);
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 2000);
    } catch {
        store._showError('Could not copy to clipboard. Please copy the link manually.');
    }
}

async function exportCSV() {
    if (loading.value) return;
    closeMenu();
    const id = await ensureExternalId();
    if (!id) return;
    window.open(`${baseUrl.value}/csv/${id}`, '_blank');
}

function copyList() {
    closeMenu();
    store.copyList(list.value.id);
}
</script>

<style>
.bw-list-actions {
    position: relative;
}

.bw-list-actions-btn {
    align-items: center;
    background: none;
    border: none;
    border-radius: 6px;
    color: #8a8880;
    cursor: pointer;
    display: inline-flex;
    justify-content: center;
    padding: 6px;
    transition:
        color 120ms ease,
        background-color 120ms ease;

    &:hover {
        background: #f3f2ee;
        color: #1e1e1c;
    }

    &.is-copied {
        background-color: var(--amber-50);
        color: var(--amber-400);
    }
}

/* Right-align the dropdown panel so it doesn't overflow the viewport */
#list-actions .bw-popover-content {
    left: auto;
    right: 0;
    transform: none;

    &::before {
        left: auto;
        margin-left: 0;
        right: 12px;
    }
}

#list-actions.is-shown .bw-popover-content {
    transform: none;
}

/* Menu content */
.bw-actions-menu {
    display: flex;
    flex-direction: column;
    min-width: 190px;
    padding: 4px 0;
}

.bw-actions-menu-section-label {
    color: var(--charcoal-300);
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding: 6px 12px 2px;
    text-transform: uppercase;
    user-select: none;
}

.bw-actions-menu-item {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    cursor: pointer;
    display: flex;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    gap: var(--space-3);
    margin: 0 4px;
    padding: 7px 8px;
    text-align: left;
    transition: background-color var(--transition-fast);
    width: calc(100% - 8px);

    &:hover {
        background-color: var(--stone-100);
    }

    &:focus-visible {
        outline: 2px solid var(--amber-400);
        outline-offset: 2px;
    }

    &:disabled,
    &[aria-disabled='true'] {
        color: var(--charcoal-300);
        cursor: not-allowed;
        pointer-events: none;
    }

    svg {
        color: var(--charcoal-300);
        flex-shrink: 0;
    }
}

.bw-actions-menu-divider {
    background: var(--stone-200);
    height: 1px;
    margin: 4px 12px;
}
</style>
