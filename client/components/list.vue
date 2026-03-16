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
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import category from './category.vue';
import listSummary from './list-summary.vue';
import dragula from 'dragula';

defineOptions({ name: 'List' });

const store = useLighterpackStore();

const onboardingCompleted = ref(false);
const itemDrake = ref(null);
const categoryDragStartIndex = ref(false);
const itemDragId = ref(false);

const library = computed(() => store.library);
const list = computed(() => store.activeList);
const categories = computed(() => list.value.categoryIds.map((id) => library.value.getCategoryById(id)));
const isListNew = computed(() => list.value.totalWeight === 0);
const isLocalSaving = computed(() => store.saveType === 'local');

watch(categories, () => {
    nextTick(() => {
        handleItemReorder();
    });
});

onMounted(() => {
    handleCategoryReorder();
    handleItemReorder();
});

function newCategory() {
    store.newCategory(list.value);
}

function updateListDescription() {
    store.updateListDescription(list.value);
}

function handleItemReorder() {
    if (itemDrake.value) {
        itemDrake.value.destroy();
    }
    const $categoryItems = Array.prototype.slice.call(document.getElementsByClassName('lpItems'));
    const drake = dragula($categoryItems, {
        moves($el, $source, $handle, _sibling) {
            return $handle.classList.contains('lpItemHandle');
        },
        accepts($el, $target, $source, $sibling) {
            if (!$sibling || $sibling.classList.contains('lpItemsHeader')) {
                return false; // header and footer are technically part of this list - exclude them both.
            }
            return true;
        },
    });
    drake.on('drag', ($el, _target, _source, _sibling) => {
        itemDragId.value = parseInt($el.id); // fragile
    });
    drake.on('drop', ($el, $target, _source, _sibling) => {
        const categoryId = parseInt($target.parentElement.id); // fragile
        store.reorderItem({
            list: list.value,
            itemId: itemDragId.value,
            categoryId,
            dropIndex: getElementIndex($el) - 1,
        });
        drake.cancel(true);
    });
    itemDrake.value = drake;
}

function handleCategoryReorder() {
    const $categories = document.getElementsByClassName('lpCategories')[0];
    const drake = dragula([$categories], {
        moves(el, $source, $handle, _sibling) {
            return $handle.classList.contains('lpCategoryHandle');
        },
    });
    drake.on('drag', ($el, _target, _source, _sibling) => {
        categoryDragStartIndex.value = getElementIndex($el);
    });
    drake.on('drop', ($el, _target, _source, _sibling) => {
        store.reorderCategory({
            list: list.value,
            before: categoryDragStartIndex.value,
            after: getElementIndex($el),
        });
        drake.cancel(true);
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
