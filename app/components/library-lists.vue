<template>
    <section class="lp-lists-section" id="listContainer">
        <div class="lp-sidebar-section-header">
            <span class="lp-label-xs">Lists</span>
        </div>

        <ul id="lists" class="lp-nav-list">
            <li
                v-for="libList in library.lists"
                :key="libList.id"
                class="lp-nav-list-item"
                :class="{ 'is-active': library.defaultListId == libList.id }"
            >
                <span class="lpHandle lp-drag-handle" title="Reorder">
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true">
                        <circle cx="3" cy="2.5" r="1.2" fill="currentColor" />
                        <circle cx="7" cy="2.5" r="1.2" fill="currentColor" />
                        <circle cx="3" cy="7" r="1.2" fill="currentColor" />
                        <circle cx="7" cy="7" r="1.2" fill="currentColor" />
                        <circle cx="3" cy="11.5" r="1.2" fill="currentColor" />
                        <circle cx="7" cy="11.5" r="1.2" fill="currentColor" />
                    </svg>
                </span>
                <button
                    class="lp-nav-link"
                    :class="{ active: library.defaultListId == libList.id }"
                    @click="setDefaultList(libList)"
                >
                    {{ listName(libList) }}
                </button>
                <button
                    v-if="library.defaultListId !== libList.id"
                    class="lp-nav-remove"
                    title="Remove this list"
                    aria-label="Remove list"
                    @click="removeList(libList)"
                >
                    ×
                </button>
            </li>
        </ul>

        <div class="lp-lists-actions">
            <button class="lp-action-link" @click="newList">+ Add new list</button>
            <button class="lp-action-link" @click="importCSV">+ Import CSV</button>
            <button class="lp-action-link" @click="copyList">+ Copy a list</button>
        </div>
    </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import Sortable from 'sortablejs';

defineOptions({ name: 'LibraryList' });

defineProps({
    list: {
        type: Object,
        default: null,
    },
});

const store = useLighterpackStore();

const library = computed(() => store.library);

/** @type {Sortable | null} */
let listSortable = null;

onMounted(() => {
    const $lists = document.getElementById('lists');
    listSortable = Sortable.create($lists, {
        handle: '.lpHandle',
        animation: 150,
        onEnd(evt) {
            const { item, from, oldIndex, newIndex } = evt;
            if (newIndex < oldIndex) {
                from.insertBefore(item, from.children[oldIndex + 1] ?? null);
            } else {
                from.insertBefore(item, from.children[oldIndex] ?? null);
            }
            store.reorderList({ before: oldIndex, after: newIndex });
        },
    });
});

onUnmounted(() => {
    if (listSortable) listSortable.destroy();
});

function listName(list) {
    return list.name || 'New list';
}

function setDefaultList(list) {
    store.setDefaultList(list);
}

function newList() {
    store.newList();
}

function copyList() {
    store.showModal('copyList');
}

function importCSV() {
    store.triggerImportCSV();
}

function removeList(list) {
    const callback = () => {
        store.removeList(list);
    };
    const speedbumpOptions = {
        body: 'Are you sure you want to delete this list? This cannot be undone.',
    };
    store.initSpeedbump(callback, speedbumpOptions);
}
</script>

<style lang="scss">
/* ── Section header ─────────────────────────────────────────── */
.lp-sidebar-section-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    padding: 0 8px;
}

.lp-label-xs {
    color: #5a5954;
    font-family: 'Figtree', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    user-select: none;
}

/* ── Nav list ───────────────────────────────────────────────── */
.lp-nav-list {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
}

.lp-nav-list-item {
    align-items: center;
    display: flex;
    gap: 2px;

    &:hover .lp-drag-handle {
        opacity: 1;
    }
    &:hover .lp-nav-remove {
        opacity: 1;
    }
}

.lp-drag-handle {
    align-items: center;
    color: #3b3b37;
    cursor: grab;
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    opacity: 0;
    padding: 4px 2px;
    transition:
        opacity 120ms ease,
        color 120ms ease;
    width: 16px;

    &:active {
        cursor: grabbing;
    }
    &:hover {
        color: #5a5954;
    }
}

/* Nav link — replicates .lp-nav-link from style guide */
.lp-nav-link {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #8a8880;
    cursor: pointer;
    display: flex;
    flex: 1;
    font-family: 'Figtree', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 400;
    min-width: 0;
    overflow: hidden;
    padding: 5px 8px;
    text-align: left;
    text-overflow: ellipsis;
    transition:
        background-color 120ms ease,
        color 120ms ease;
    white-space: nowrap;

    &:hover {
        background-color: #2f2f2c;
        color: #c8c6bc;
    }

    &.active {
        color: #e8a220;
        font-weight: 500;

        &:hover {
            background-color: rgba(232, 162, 32, 0.08);
        }
    }

    &:focus-visible {
        outline: 2px solid #e8a220;
        outline-offset: 2px;
    }
}

.lp-nav-remove {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #3b3b37;
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    font-size: 14px;
    height: 22px;
    justify-content: center;
    line-height: 1;
    opacity: 0;
    padding: 0;
    transition:
        color 120ms ease,
        opacity 120ms ease;
    width: 22px;

    &:hover {
        color: #c87171;
    }
    &:focus-visible {
        outline: 2px solid #e8a220;
        outline-offset: 2px;
    }
}

/* ── Add / import / copy actions ────────────────────────────── */
.lp-lists-actions {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-left: 8px;
}

.lp-action-link {
    align-items: center;
    background: transparent;
    border: none;
    color: #e8a220;
    cursor: pointer;
    display: inline-flex;
    font-family: 'Figtree', system-ui, sans-serif;
    font-size: 12px;
    font-weight: 500;
    gap: 4px;
    padding: 4px 4px;
    text-align: left;
    text-decoration: none;
    transition: color 120ms ease;

    &:hover {
        color: #c07a0a;
    }
    &:focus-visible {
        outline: 2px solid #e8a220;
        outline-offset: 2px;
        border-radius: 4px;
    }
}

/* ── Sortable drag state ─────────────────────────────────────── */
.lp-nav-list-item.sortable-drag {
    background: #2f2f2c;
    border-radius: 6px;
    opacity: 0.9;
}
</style>
