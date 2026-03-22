<template>
    <div class="lpListBody">
        <!-- ── List header: title + share ──── -->
        <header class="lp-list-header">
            <input
                class="lp-list-title"
                :value="list.name"
                type="text"
                placeholder="List name"
                autocomplete="off"
                name="lastpass-disable-search"
                @input="updateListName"
            />
            <div class="lp-list-header-actions">
                <share />
            </div>
        </header>

        <div v-if="isListNew" id="getStarted">
            <h2>Welcome to LighterPack!</h2>
            <p>Here's what you need to get started:</p>
            <ol>
                <li>Click on things to edit them. Give your list and category a name.</li>
                <li>Add new categories and give items weights to start the visualization.</li>
                <li v-if="!isLocalSaving">When you're done, share your list with others!</li>
            </ol>
            <p v-if="isLocalSaving" class="lpWarning">
                <strong>Note:</strong> Your data is being saved to your local computer. In order to share your lists
                please register an account.
            </p>
        </div>
        <list-summary v-if="!isListNew" :list="list" />

        <div style="clear: both" />

        <div v-if="library.optionalFields['listDescription']" id="listDescriptionContainer">
            <h3>List Description</h3>
            <p>
                (<a href="https://guides.github.com/features/mastering-markdown/" target="_blank" class="lpHref"
                    >Markdown</a
                >
                supported)
            </p>
            <textarea id="listDescription" v-model="list.description" @input="updateListDescription" />
        </div>

        <ul class="lpCategories">
            <category v-for="cat in categories" :key="cat.id" :category="cat" />
        </ul>

        <hr />

        <a class="lpAdd addCategory lp-action-link" @click="newCategory">
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
            >
                <line x1="8" y1="3" x2="8" y2="13" />
                <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
            Add new category
        </a>
    </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import Sortable from 'sortablejs';
import { useItemDrag } from '../composables/useItemDrag.js';
import category from './category.vue';
import listSummary from './list-summary.vue';
import share from './share.vue';

defineOptions({ name: 'List' });

const store = useLighterpackStore();

const library = computed(() => store.library);
const list = computed(() => store.activeList);
const categories = computed(() => {
    const l = list.value;
    if (!l) return [];
    return l.categoryIds.map((id) => library.value.getCategoryById(id));
});
const isListNew = computed(() => list.value.totalWeight === 0);
const isLocalSaving = computed(() => store.saveType === 'local');

const itemDrag = useItemDrag();
/** @type {Sortable | null} */
let categorySortable = null;

watch(categories, () => {
    nextTick(() => {
        itemDrag.setup(list);
    });
});

onMounted(() => {
    categorySortable = handleCategoryReorder();
    itemDrag.setup(list);
});

onUnmounted(() => {
    itemDrag.destroy();
    if (categorySortable) categorySortable.destroy();
});

function updateListName(evt) {
    store.updateListName({ id: list.value.id, name: evt.target.value });
}

function newCategory() {
    store.newCategory(list.value);
}

function updateListDescription() {
    store.updateListDescription(list.value);
}

function handleCategoryReorder() {
    const $categories = /** @type {HTMLElement} */ (document.getElementsByClassName('lpCategories')[0]);
    return Sortable.create($categories, {
        handle: '.lpCategoryHandle',
        animation: 150,
        onEnd(evt) {
            const { item, from, oldIndex, newIndex } = evt;
            if (newIndex < oldIndex) {
                from.insertBefore(item, from.children[oldIndex + 1] ?? null);
            } else {
                from.insertBefore(item, from.children[oldIndex] ?? null);
            }
            store.reorderCategory({
                list: list.value,
                before: oldIndex,
                after: newIndex,
            });
        },
    });
}
</script>

<style lang="scss">
/* ── List header ─────────────────────────────────────────────── */
.lp-list-header {
    align-items: center;
    display: flex;
    gap: 8px;
    margin: 0 -20px 20px;
    padding: 10px 16px;
    border-bottom: 1px solid #e8e7e1;
}

.lp-list-title {
    background: transparent;
    border: 0.5px solid transparent;
    border-radius: 4px;
    color: #1e1e1c;
    flex: 1;
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 20px;
    font-weight: 400;
    letter-spacing: -0.01em;
    min-width: 0;
    outline: none;
    padding: 4px 8px;
    transition:
        border-color 120ms ease,
        background 120ms ease;

    &::placeholder {
        color: #8a8880;
    }

    &:hover {
        border-color: #d0cfc9;
    }

    &:focus {
        background: #f3f2ee;
        border-color: #e8a220;
    }
}

.lp-list-header-actions {
    align-items: center;
    display: flex;
    flex-shrink: 0;

    /* Style the share component trigger when rendered here */
    .headerItem {
        align-items: center;
        color: #8a8880;
        cursor: pointer;
        display: flex;
        font-family: 'Figtree', system-ui, sans-serif;
        font-size: 13px;
        font-weight: 500;
        gap: 5px;
        padding: 6px 10px;
        border-radius: 6px;
        transition:
            color 120ms ease,
            background-color 120ms ease;

        &:hover {
            background: #f3f2ee;
            color: #1e1e1c;
        }

        .lpTarget {
            align-items: center;
            color: inherit;
            display: flex;
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            gap: 5px;
            padding: 0;
        }
    }
}

/* ── Existing styles ─────────────────────────────────────────── */
#listDescriptionContainer {
    margin: 25px 0;

    h3,
    p {
        display: inline-block;
        margin: 0 0 5px;
    }

    h3 {
        margin-right: 10px;
    }

    textarea {
        height: 65px;
        width: 100%;
    }
}

#getStarted {
    background: #f3f2ee;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    font-family: 'Figtree', system-ui, sans-serif;
    height: 220px;
    justify-content: center;
    line-height: 1.6;
    padding: 30px;

    h2 {
        font-family: 'DM Serif Display', Georgia, serif;
        font-size: 22px;
        font-weight: 400;
        line-height: 1;
    }

    h2,
    p,
    ol {
        margin: 0 0 15px;

        &:last-child {
            margin-bottom: 0;
        }
    }
}

/* "Add new category" link */
.addCategory {
    color: #8a8880;
    cursor: pointer;
    align-items: center;
    display: inline-flex;
    font-family: 'Figtree', system-ui, sans-serif;
    font-size: 13px;
    gap: 4px;
    margin-top: 16px;
    text-decoration: none;
    transition: color 120ms ease;

    &:hover {
        color: #e8a220;
    }
}
</style>
