<template>
    <div class="lpListBody">
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
            <category v-for="category in categories" :key="category.id" :category="category" />
        </ul>

        <hr />

        <a class="lpAdd addCategory" @click="newCategory"><i class="lpSprite lpSpriteAdd" />Add new category</a>
    </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import Sortable from 'sortablejs';
import { useItemDrag } from '../composables/useItemDrag.js';
import category from './category.vue';
import listSummary from './list-summary.vue';

defineOptions({ name: 'List' });

const store = useLighterpackStore();

const library = computed(() => store.library);
const list = computed(() => store.activeList);
const categories = computed(() => list.value.categoryIds.map((id) => library.value.getCategoryById(id)));
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
@use 'sass:color';
@use '../css/globals' as *;

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
    background: color.adjust($background1, $lightness: -10%);
    display: flex;
    flex-direction: column;
    height: 220px;
    justify-content: center;
    line-height: 1.6;
    padding: $spacingLarge;

    h2 {
        font-size: 24px;
        line-height: 1;
    }

    h2,
    p,
    ol {
        margin: 0 0 $spacingMedium;

        &:last-child {
            margin-bottom: 0;
        }
    }
}
</style>
