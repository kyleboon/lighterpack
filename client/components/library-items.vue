<template>
    <section id="libraryContainer">
        <h2>Gear</h2>
        <input id="librarySearch" v-model="searchText" type="text" placeholder="search items" />
        <ul id="library">
            <li v-for="libItem in filteredItems" :key="libItem.id" class="lpLibraryItem" :data-item-id="libItem.id">
                <a v-if="libItem.url" :href="libItem.url" target="_blank" class="lpName lpHref">{{ libItem.name }}</a>
                <span v-if="!libItem.url" class="lpName">{{ libItem.name }}</span>
                <span class="lpWeight">
                    {{ displayWeight(libItem.weight, libItem.authorUnit) }}
                    {{ libItem.authorUnit }}
                </span>
                <span class="lpDescription">
                    {{ libItem.description }}
                </span>
                <a
                    class="lpRemove lpRemoveLibraryItem speedbump"
                    title="Delete this item permanently"
                    @click="removeItem(libItem)"
                    ><i class="lpSprite lpSpriteRemove"
                /></a>
                <div v-if="!libItem.inCurrentList" class="lpHandle lpLibraryItemHandle" title="Reorder this item" />
            </li>
        </ul>
    </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import dragula from 'dragula';
import weightUtils from '../utils/weight.js';

defineOptions({ name: 'LibraryItem' });

defineProps({
    item: {
        type: Object,
        default: null,
    },
});

const store = useLighterpackStore();

const searchText = ref('');
const itemDragId = ref(false);
const drake = ref(null);

const library = computed(() => store.library);

const filteredItems = computed(() => {
    let i;
    let item;
    let filteredItemsList = [];
    if (!searchText.value) {
        filteredItemsList = library.value.items.map((libItem) => Object.assign({}, libItem));
    } else {
        const lowerCaseSearchText = searchText.value.toLowerCase();

        for (i = 0; i < library.value.items.length; i++) {
            item = library.value.items[i];
            if (
                item.name.toLowerCase().indexOf(lowerCaseSearchText) > -1 ||
                item.description.toLowerCase().indexOf(lowerCaseSearchText) > -1
            ) {
                filteredItemsList.push(Object.assign({}, item));
            }
        }
    }

    const currentListItems = library.value.getItemsInCurrentList();

    for (i = 0; i < filteredItemsList.length; i++) {
        item = filteredItemsList[i];
        if (currentListItems.indexOf(item.id) > -1) {
            item.inCurrentList = true;
        }
    }

    return filteredItemsList;
});

const list = computed(() => library.value.getListById(library.value.defaultListId));
const categories = computed(() => list.value.categoryIds.map((id) => library.value.getCategoryById(id)));

watch(categories, () => {
    nextTick(() => {
        handleItemDrag();
    });
});

onMounted(() => {
    handleItemDrag();
});

function handleItemDrag() {
    if (drake.value) {
        drake.value.destroy();
    }

    const $library = document.getElementById('library');
    const $categoryItems = Array.prototype.slice.call(document.getElementsByClassName('lpItems')); // list.vue
    const newDrake = dragula([$library].concat($categoryItems), {
        copy: true,
        moves($el, $source, $handle, _sibling) {
            const items = library.value.getItemsInCurrentList();
            if (items.indexOf(parseInt($el.dataset.itemId)) > -1) {
                return false;
            }
            return $handle.classList.contains('lpLibraryItemHandle');
        },
        accepts($el, $target, $source, $sibling) {
            if ($target.id === 'library' || !$sibling || $sibling.classList.contains('lpItemsHeader')) {
                return false; // header and footer are technically part of this list - exclude them both.
            }
            return true;
        },
    });
    newDrake.on('drag', ($el, _target, _source, _sibling) => {
        itemDragId.value = parseInt($el.dataset.itemId); // fragile
    });
    newDrake.on('drop', ($el, $target, _source, _sibling) => {
        if (!$target || $target.id === 'library') {
            return;
        }
        const categoryId = parseInt($target.parentElement.id); // fragile
        store.addItemToCategory({
            itemId: itemDragId.value,
            categoryId,
            dropIndex: getElementIndex($el) - 1,
        });
        newDrake.cancel(true);
    });
    drake.value = newDrake;
}

function displayWeight(mg, unit) {
    return weightUtils.MgToWeight(mg, unit) || 0;
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

<style lang="scss">
#libraryContainer {
    display: flex;
    flex: 2 0 30vh;
    flex-direction: column;
}

#library {
    flex: 1 0 25vh;
    overflow-y: scroll;
}

#librarySearch {
    background: #666;
    border: 1px solid #888;
    color: #fff;
    margin-bottom: 15px;
    padding: 3px 6px;
}

.lpLibraryItem {
    border-top: 1px dotted #999;
    list-style: none;
    margin: 0 10px 5px;
    min-height: 43px;
    overflow: hidden;
    padding: 5px 5px 0 15px;
    position: relative;

    &:first-child {
        border-top: none;
        padding-top: 10px;
    }

    &:last-child {
        border-bottom: none;
    }

    &.gu-mirror {
        background: #606060;
        border: 1px solid #999;
        color: #fff;
    }

    .lpName {
        float: left;
        margin: 0;
        max-width: 190px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .lpWeight {
        float: right;
        width: auto;
    }

    .lpDescription {
        clear: both;
        color: #ccc;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 235px;
    }

    .lpHandle {
        height: 80px;
        left: 0;
        position: absolute;
        top: 5px;
    }

    .lpRemove {
        bottom: 0;
        position: absolute;
        right: 14px;
    }

    #library.lpSearching & {
        display: none;
    }

    #library.lpSearching &.lpHit {
        display: block;
    }

    #main > & {
        background: #666;
        color: #fff;
        padding: 10px;
        width: 235px;
    }
}
</style>
