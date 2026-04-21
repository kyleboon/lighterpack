<template>
    <section class="lp-gear-section lp-library-section" id="libraryContainer">
        <div class="lp-sidebar-section-header">
            <span class="lp-label-xs">Gear</span>
        </div>

        <input
            id="librarySearch"
            v-model="searchText"
            class="lp-sidebar-search"
            type="search"
            placeholder="Search gear…"
            aria-label="Search gear library"
        />

        <ul id="library" class="lp-gear-list">
            <li
                v-for="libItem in filteredItems"
                :key="libItem.id"
                class="lp-gear-list-item"
                :class="{ 'is-in-list': libItem.inCurrentList }"
                :data-item-id="libItem.id"
            >
                <div
                    v-if="!libItem.inCurrentList"
                    class="lpHandle lpLibraryItemHandle lp-gear-drag-handle"
                    title="Drag to add to list"
                    aria-label="Drag to add to list"
                >
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true">
                        <circle cx="2" cy="2" r="1.1" fill="currentColor" />
                        <circle cx="6" cy="2" r="1.1" fill="currentColor" />
                        <circle cx="2" cy="6" r="1.1" fill="currentColor" />
                        <circle cx="6" cy="6" r="1.1" fill="currentColor" />
                        <circle cx="2" cy="10" r="1.1" fill="currentColor" />
                        <circle cx="6" cy="10" r="1.1" fill="currentColor" />
                    </svg>
                </div>
                <div v-else class="lp-gear-in-list-indicator" aria-hidden="true" />

                <div class="lp-gear-item-info">
                    <a
                        v-if="libItem.url"
                        :href="libItem.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="lp-gear-item-name lp-gear-item-link"
                        >{{ libItem.name }}</a
                    >
                    <span v-else class="lp-gear-item-name">{{ libItem.name }}</span>
                    <span v-if="libItem.description" class="lp-gear-item-desc">{{ libItem.description }}</span>
                </div>

                <span class="lp-gear-item-weight">
                    {{ displayWeight(libItem.weight, libItem.authorUnit) }}
                    <span class="lp-gear-item-unit">{{ libItem.authorUnit }}</span>
                </span>

                <button
                    class="lp-gear-remove"
                    title="Delete this item permanently"
                    aria-label="Delete item"
                    @click="removeItem(libItem)"
                >
                    ×
                </button>
            </li>
        </ul>
    </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLighterpackStore } from '../store/store';
import Sortable from 'sortablejs';
import { MgToWeight } from '#shared/utils/weight';

defineOptions({ name: 'LibraryItem' });

defineProps({
    item: {
        type: Object,
        default: null,
    },
});

const store = useLighterpackStore();

const searchText = ref('');

const library = computed(() => store.library);

const filteredItems = computed(() => {
    let filteredItemsList = [];
    if (!searchText.value) {
        filteredItemsList = library.value.items.map((libItem) => Object.assign({}, libItem));
    } else {
        const lowerCaseSearchText = searchText.value.toLowerCase();
        for (let i = 0; i < library.value.items.length; i++) {
            const libItem = library.value.items[i];
            if (
                libItem.name.toLowerCase().indexOf(lowerCaseSearchText) > -1 ||
                libItem.description.toLowerCase().indexOf(lowerCaseSearchText) > -1
            ) {
                filteredItemsList.push(Object.assign({}, libItem));
            }
        }
    }

    const currentListItems = library.value.getItemsInCurrentList();
    for (let i = 0; i < filteredItemsList.length; i++) {
        if (currentListItems.indexOf(filteredItemsList[i].id) > -1) {
            filteredItemsList[i].inCurrentList = true;
        }
    }

    return filteredItemsList;
});

/** @type {import('vue').Ref<Sortable | null>} */
const librarySortable = ref(null);

onMounted(() => {
    const $library = document.getElementById('library');
    librarySortable.value = Sortable.create($library, {
        group: {
            name: 'items',
            pull: 'clone',
            put: false,
        },
        handle: '.lpLibraryItemHandle',
        filter(_evt, el) {
            // Prevent dragging items already in the current list
            const items = store.library.getItemsInCurrentList();
            return items.indexOf(parseInt(el.dataset.itemId)) > -1;
        },
        preventOnFilter: false,
        animation: 150,
    });
});

onUnmounted(() => {
    if (librarySortable.value) librarySortable.value.destroy();
});

function displayWeight(mg, unit) {
    return MgToWeight(mg, unit) || 0;
}

function removeItem(item) {
    const callback = () => {
        store.removeItem(item);
    };
    const speedbumpOptions = {
        body: 'Are you sure you want to delete this item? This cannot be undone.',
    };
    store.initSpeedbump(callback, speedbumpOptions);
}
</script>

<style>
/* ── Gear section ───────────────────────────────────────────── */
.lp-gear-section {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
}

/* ── Search input ───────────────────────────────────────────── */
.lp-sidebar-search {
    background: #2f2f2c;
    border: 0.5px solid #3b3b37;
    border-radius: 6px;
    color: #c8c6bc;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 12px;
    margin-bottom: 8px;
    outline: none;
    padding: 6px 10px;
    transition: border-color 120ms ease;
    width: 100%;

    &::placeholder {
        color: #5a5954;
    }

    &:focus {
        background: #2f2f2c;
        border-color: #e8a220;
    }

    /* Remove native search clear button */
    &::-webkit-search-cancel-button {
        display: none;
    }
}

/* ── Gear list ──────────────────────────────────────────────── */
.lp-gear-list {
    flex: 1;
    list-style: none;
    margin: 0;
    min-height: 0;
    overflow-y: auto;
    padding: 0;
    scrollbar-color: #3b3b37 transparent;
    scrollbar-width: thin;
}

.lp-gear-list-item {
    align-items: flex-start;
    border-bottom: 0.5px solid #2f2f2c;
    display: flex;
    gap: 4px;
    padding: 6px 4px 6px 0;
    position: relative;

    &:first-child {
        border-top: none;
    }

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        .lp-gear-drag-handle {
            opacity: 1;
        }

        .lp-gear-remove {
            opacity: 1;
        }
    }

    &.is-in-list {
        opacity: 0.45;
    }

    /* Ghost during drag */
    &.sortable-drag {
        background: #3b3b37;
        border-radius: 6px;
        opacity: 0.85;
    }
}

/* ── Drag handle ────────────────────────────────────────────── */
.lp-gear-drag-handle {
    align-items: center;
    color: #3b3b37;
    cursor: grab;
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    margin-top: 3px;
    opacity: 0;
    padding: 2px;
    transition:
        opacity 120ms ease,
        color 120ms ease;
    width: 14px;

    &:active {
        cursor: grabbing;
    }

    &:hover {
        color: #5a5954;
    }
}

.lp-gear-in-list-indicator {
    flex-shrink: 0;
    width: 14px;
}

/* ── Item info ──────────────────────────────────────────────── */
.lp-gear-item-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
}

.lp-gear-item-name {
    color: #c8c6bc;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 12px;
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.lp-gear-item-link {
    color: #97b8d8;
    text-decoration: none;
    transition: color 120ms ease;

    &:hover {
        color: #4d84b4;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
}

.lp-gear-item-desc {
    color: #5a5954;
    display: block;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ── Weight (DM Mono per style guide) ───────────────────────── */
.lp-gear-item-weight {
    color: #8a8880;
    flex-shrink: 0;
    font-family: 'DM Mono', 'Fira Mono', monospace;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    margin-top: 1px;
    white-space: nowrap;
}

.lp-gear-item-unit {
    color: #5a5954;
    font-size: 10px;
}

/* ── Remove button ──────────────────────────────────────────── */
.lp-gear-remove {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #3b3b37;
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    font-size: 13px;
    height: 20px;
    justify-content: center;
    line-height: 1;
    margin-top: 1px;
    opacity: 0;
    padding: 0;
    transition:
        color 120ms ease,
        opacity 120ms ease;
    width: 20px;

    &:hover {
        color: #c87171;
    }

    &:focus-visible {
        outline: 2px solid #e8a220;
        outline-offset: 2px;
    }
}
</style>
