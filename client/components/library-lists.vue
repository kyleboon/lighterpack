<template>
    <section id="listContainer">
        <div class="listContainerHeader">
            <h2>Lists</h2>
            <PopoverHover id="addListFlyout">
                <template #target>
                    <a class="lpAdd" @click="newList"><i class="lpSprite lpSpriteAdd" />Add new list</a>
                </template>
                <template #content>
                    <a class="lpAdd" @click="newList"><i class="lpSprite lpSpriteAdd" />Add new list</a>
                    <a class="lpAdd" @click="importCSV"><i class="lpSprite lpSpriteUpload" />Import CSV</a>
                    <a class="lpCopy" @click="copyList"><i class="lpSprite lpSpriteCopy" />Copy a list</a>
                </template>
            </PopoverHover>
        </div>
        <ul id="lists">
            <li
                v-for="libList in library.lists"
                :key="libList.id"
                class="lpLibraryList"
                :class="{ lpActive: library.defaultListId == libList.id }"
            >
                <div class="lpHandle" title="Reorder this item" />
                <span class="lpLibraryListSwitch lpListName" @click="setDefaultList(libList)">
                    {{ listName(libList) }}
                </span>
                <a class="lpRemove" title="Remove this list" @click="removeList(libList)"
                    ><i class="lpSprite lpSpriteRemove"
                /></a>
            </li>
        </ul>
    </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import PopoverHover from './popover-hover.vue';
import dragula from 'dragula';

defineOptions({ name: 'LibraryList' });

defineProps({
    list: {
        type: Object,
        default: null,
    },
});

const store = useLighterpackStore();

const dragStartIndex = ref(null);

const library = computed(() => store.library);

onMounted(() => {
    handleListReorder();
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

function handleListReorder() {
    const $lists = document.getElementById('lists');
    const drake = dragula([$lists], {
        moves($el, $source, $handle, _sibling) {
            return $handle.classList.contains('lpHandle');
        },
    });
    drake.on('drag', ($el, _target, _source, _sibling) => {
        dragStartIndex.value = getElementIndex($el);
    });
    drake.on('drop', ($el, _target, _source, _sibling) => {
        store.reorderList({ before: dragStartIndex.value, after: getElementIndex($el) });
        drake.cancel(true);
    });
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
@use '../css/globals' as *;

#listContainer {
    flex: 0 0 auto;

    #lists {
        max-height: 25vh;
    }
}

.lpLibraryList {
    border-top: 1px dotted #999;
    display: flex;
    list-style: none;
    margin: 0 10px;
    overflow-y: auto;
    padding: 6px 0;
    position: relative;

    &:first-child {
        border-top: none;
        padding-top: 10px;
    }

    &:last-child {
        border-bottom: none;
    }

    &.lpActive {
        color: $yellow1;
        font-weight: bold;

        .lpRemove {
            display: none;
        }
    }

    &.gu-mirror {
        background: #606060;
        border: 1px solid #999;
        color: #fff;
    }

    .lpHandle {
        flex: 0 0 12px;
        height: 18px;
        margin-right: 5px;
    }

    &:hover .lpHandle {
        visibility: visible;
    }

    .lpListName {
        flex: 1 1 auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:hover {
            cursor: pointer;
            text-decoration: underline;
        }
    }

    .lpRemove {
        flex: 0 0 8px;
        margin-bottom: 0;
    }
}

.listContainerHeader {
    display: flex;
    justify-content: space-between;
}

#addListFlyout {
    .lpContent a {
        display: block;
        margin-bottom: 5px;

        &:last-child {
            margin-bottom: 0;
        }
    }
}
</style>
