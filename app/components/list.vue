<template>
    <div class="lpListBody">
        <!-- ── List header: title + share ──── -->
        <header class="lp-list-header">
            <h1 v-if="readonly" class="lp-list-title">{{ list.name }}</h1>
            <input
                v-else
                class="lp-list-title"
                :value="list.name"
                type="text"
                placeholder="List name"
                autocomplete="off"
                name="lastpass-disable-search"
                @input="updateListName"
            />
            <div v-if="!readonly" class="lp-list-header-actions">
                <button
                    v-if="library.optionalFields['images']"
                    class="lp-icon-btn lp-list-camera"
                    title="Manage list images"
                    @click="manageListImages"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        aria-hidden="true"
                    >
                        <path
                            d="M13 11.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-6a.5.5 0 01.5-.5H5l1-2h4l1 2h1.5a.5.5 0 01.5.5v6z"
                        />
                        <circle cx="8" cy="8.5" r="2" />
                    </svg>
                </button>
                <list-actions />
            </div>
        </header>

        <div v-if="!readonly && isListNew" id="getStarted">
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
        <div v-if="library.optionalFields['images'] && listImages.length > 0" class="lp-list-image-strip">
            <img
                v-for="(img, i) in visibleListThumbs"
                :key="img.id ?? i"
                class="lpItemThumb"
                :src="img.url"
                :title="`Image ${i + 1}`"
                @click="viewListImageAt(i)"
            />
            <span v-if="extraListImageCount > 0" class="lpThumbMore" @click="viewListImageAt(visibleListThumbs.length)"
                >+{{ extraListImageCount }}</span
            >
        </div>

        <list-summary v-if="!isListNew" :list="list" :readonly="readonly" />

        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="readonly && renderedDescription" id="lpListDescription" v-html="renderedDescription" />

        <div style="clear: both" />

        <div v-if="!readonly && library.optionalFields['listDescription']" id="listDescriptionContainer">
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
            <category v-for="cat in categories" :key="cat.id" :category="cat" :readonly="readonly" />
        </ul>

        <hr v-if="!readonly" />

        <a v-if="!readonly" class="lpAdd addCategory lp-action-link" @click="newCategory">
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
import { marked } from 'marked';
import { useLighterpackStore } from '../store/store';
import category from './category.vue';
import listSummary from './list-summary.vue';
import listActions from './list-actions.vue';

defineOptions({ name: 'List' });

const props = defineProps({
    readonly: { type: Boolean, default: false },
});

const store = useLighterpackStore();

const MAX_VISIBLE_THUMBS = 4;

const library = computed(() => store.library);
const list = computed(() => store.activeList);

const listImages = computed(() => (list.value?.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order));

const visibleListThumbs = computed(() => listImages.value.slice(0, MAX_VISIBLE_THUMBS));

const extraListImageCount = computed(() => Math.max(0, listImages.value.length - MAX_VISIBLE_THUMBS));
const categories = computed(() => {
    const l = list.value;
    if (!l) return [];
    return l.categoryIds.map((id) => library.value.getCategoryById(id));
});
const isListNew = computed(() => list.value.totalWeight === 0);
const isLocalSaving = computed(() => store.saveType === 'local');

const renderedDescription = computed(() => {
    if (!props.readonly || !list.value?.description) return '';
    // marked() with default options escapes HTML in the input.
    // DOMPurify is not used here because isomorphic-dompurify's jsdom
    // dependency causes SSR crashes in the Nuxt production build.
    return marked(list.value.description);
});

let categorySortable = null;
let itemDrag = null;

watch(categories, () => {
    if (!itemDrag) return;
    nextTick(() => {
        itemDrag.setup(list);
    });
});

onMounted(async () => {
    if (props.readonly) return;
    const [{ default: Sortable }, { useItemDrag }] = await Promise.all([
        import('sortablejs'),
        import('../composables/useItemDrag'),
    ]);
    itemDrag = useItemDrag();
    categorySortable = handleCategoryReorder(Sortable);
    itemDrag.setup(list);
});

onUnmounted(() => {
    if (itemDrag) itemDrag.destroy();
    if (categorySortable) categorySortable.destroy();
});

function viewListImageAt(index) {
    store.openViewImagesDialog(listImages.value, index);
}

function manageListImages() {
    store.openListImageDialog(list.value);
}

function updateListName(evt) {
    store.updateListName({ id: list.value.id, name: evt.target.value });
}

function newCategory() {
    store.newCategory(list.value);
}

function updateListDescription() {
    store.updateListDescription(list.value);
}

function handleCategoryReorder(Sortable) {
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
    border-bottom: 1px solid #e8e7e1;
    display: flex;
    gap: 8px;
    margin: 0 -20px 20px;
    padding: 10px 16px;
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
        border-radius: 6px;
        color: #8a8880;
        cursor: pointer;
        display: flex;
        font-family: Figtree, system-ui, sans-serif;
        font-size: 13px;
        font-weight: 500;
        gap: 5px;
        padding: 6px 10px;
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

/* List image thumbnail strip */
.lp-list-image-strip {
    align-items: center;
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
}

/* List-level camera button */
.lp-list-camera {
    color: #8a8880;
    visibility: visible;

    &:hover {
        color: #1e1e1c;
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
    font-family: Figtree, system-ui, sans-serif;
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
    align-items: center;
    color: #8a8880;
    cursor: pointer;
    display: inline-flex;
    font-family: Figtree, system-ui, sans-serif;
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
