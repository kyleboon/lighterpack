<template>
    <section class="lp-lists-section" id="listContainer">
        <div class="lp-sidebar-section-header">
            <span class="lp-label-xs">Lists</span>
        </div>

        <ul id="lists" class="lp-nav-list">
            <li
                v-for="(libList, index) in library.lists"
                :key="libList.id"
                class="lp-nav-list-item"
                :class="{ 'is-active': library.defaultListId == libList.id }"
            >
                <span class="lpHandle lp-drag-handle" title="Reorder" aria-label="Drag to reorder list">
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
                    v-if="index > 0"
                    class="lp-reorder-btn visually-hidden"
                    :aria-label="'Move ' + listName(libList) + ' up'"
                    @click="moveListUp(index)"
                >
                    &uarr;
                </button>
                <button
                    v-if="index < library.lists.length - 1"
                    class="lp-reorder-btn visually-hidden"
                    :aria-label="'Move ' + listName(libList) + ' down'"
                    @click="moveListDown(index)"
                >
                    &darr;
                </button>
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
        </div>
    </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useLighterpackStore } from '../store/store';
import Sortable from 'sortablejs';
import { useAnnounce } from '../composables/useAnnounce';

defineOptions({ name: 'LibraryList' });

defineProps({
    list: {
        type: Object,
        default: null,
    },
});

const store = useLighterpackStore();

const library = computed(() => store.library);

const { announce } = useAnnounce();

function moveListUp(index) {
    store.reorderList({ before: index, after: index - 1 });
    const name = listName(library.value.lists[index - 1]);
    announce(`Moved ${name} to position ${index} of ${library.value.lists.length}`);
}

function moveListDown(index) {
    store.reorderList({ before: index, after: index + 1 });
    const name = listName(library.value.lists[index + 1]);
    announce(`Moved ${name} to position ${index + 2} of ${library.value.lists.length}`);
}

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

<style>
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
    font-family: Figtree, system-ui, sans-serif;
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
    font-family: Figtree, system-ui, sans-serif;
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
            background-color: rgb(232 162 32 / 8%);
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
    font-family: Figtree, system-ui, sans-serif;
    font-size: 12px;
    font-weight: 500;
    gap: 4px;
    padding: 4px;
    text-align: left;
    text-decoration: none;
    transition: color 120ms ease;

    &:hover {
        color: #c07a0a;
    }

    &:focus-visible {
        border-radius: 4px;
        outline: 2px solid #e8a220;
        outline-offset: 2px;
    }
}

/* ── Sortable drag state ─────────────────────────────────────── */
.lp-nav-list-item.sortable-drag {
    background: #2f2f2c;
    border-radius: 6px;
    opacity: 0.9;
}

.lp-reorder-btn {
    background: none;
    border: 1px solid #3b3b37;
    border-radius: 4px;
    color: #c8c6bc;
    cursor: pointer;
    font-size: 12px;
    height: 22px;
    line-height: 1;
    padding: 0;
    width: 22px;
}

.lp-reorder-btn:focus-visible {
    clip: auto;
    clip-path: none;
    height: auto;
    outline: 2px solid #e8a220;
    outline-offset: 2px;
    overflow: visible;
    position: static;
    white-space: normal;
    width: auto;
}
</style>
