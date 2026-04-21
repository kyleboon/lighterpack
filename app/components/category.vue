<template>
    <li :id="category.id" class="bwCategory">
        <ul class="bwItems bwDataTable">
            <li class="bwHeader bwItemsHeader">
                <span v-if="!readonly" class="bwHandleCell">
                    <div class="bwHandle bwCategoryHandle" title="Reorder this category" />
                </span>
                <h2 v-if="readonly" class="bwCategoryName">{{ category.name }}</h2>
                <input
                    v-else
                    v-focus-on-create="category._isNew"
                    type="text"
                    :value="category.name"
                    placeholder="Category Name"
                    class="bwCategoryName bwSilent"
                    @input="updateCategoryName"
                />
                <button
                    v-if="!readonly && library.optionalFields['images']"
                    class="bw-icon-btn bwCategoryCamera"
                    title="Manage category images"
                    aria-label="Manage category images"
                    @click="manageCategoryImages"
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
                <span v-if="library.optionalFields['price']" class="bwPriceCell">Price</span>
                <span class="bwWeightCell">Weight</span>
                <span class="bwQtyCell">qty</span>
                <span v-if="!readonly" class="bwRemoveCell"
                    ><a
                        class="bwRemove bwRemoveCategory"
                        title="Remove this category"
                        aria-label="Remove category"
                        @click="removeCategory(category)"
                        ><svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            aria-hidden="true"
                        >
                            <line x1="4" y1="4" x2="12" y2="12" />
                            <line x1="12" y1="4" x2="4" y2="12" /></svg></a
                ></span>
            </li>
            <li v-if="library.optionalFields['images'] && categoryImages.length > 0" class="bwCategoryImageRow">
                <span class="bwImageStrip">
                    <img
                        v-for="(img, i) in visibleCategoryThumbs"
                        :key="img.id ?? i"
                        class="bwItemThumb"
                        :src="img.url"
                        :alt="`${category.name} image ${i + 1}`"
                        :title="`Image ${i + 1}`"
                        @click="viewCategoryImageAt(i)"
                    />
                    <span
                        v-if="extraCategoryImageCount > 0"
                        class="bwThumbMore"
                        @click="viewCategoryImageAt(visibleCategoryThumbs.length)"
                        >+{{ extraCategoryImageCount }}</span
                    >
                </span>
            </li>
            <item
                v-for="itemContainer in itemContainers"
                :key="itemContainer.item.id"
                :item-container="itemContainer"
                :category="category"
                :readonly="readonly"
            />
            <li class="bwFooter bwItemsFooter">
                <span class="bwAddItemCell">
                    <a v-if="!readonly" class="bwAdd bwAddItem bw-action-link" @click="newItem">
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
                        Add new item
                    </a>
                </span>
                <span v-if="library.optionalFields['price']" class="bwPriceCell bwNumber bwSubtotal">
                    {{ displayPrice(category.subtotalPrice, library.currencySymbol) }}
                </span>
                <span class="bwWeightCell bwNumber bwSubtotal">
                    <span class="bwDisplaySubtotal">{{
                        displayWeight(category.subtotalWeight, library.totalUnit)
                    }}</span>
                    <span class="bwSubtotalUnit">{{ library.totalUnit }}</span>
                </span>
                <span class="bwQtyCell bwSubtotal">
                    <span class="bwQtySubtotal">{{ category.subtotalQty }}</span>
                </span>
                <span class="bwRemoveCell" />
            </li>
        </ul>
    </li>
</template>

<script setup>
import { computed } from 'vue';
import { useBaseweightStore } from '../store/store';
import { MgToWeight } from '#shared/utils/weight';
import item from './item.vue';

defineOptions({ name: 'Category' });

const props = defineProps({
    category: { type: Object, default: null },
    readonly: { type: Boolean, default: false },
});

const store = useBaseweightStore();

const library = computed(() => store.library);

const MAX_VISIBLE_THUMBS = 4;

const categoryImages = computed(() =>
    (props.category.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
);

const visibleCategoryThumbs = computed(() => categoryImages.value.slice(0, MAX_VISIBLE_THUMBS));

const extraCategoryImageCount = computed(() => Math.max(0, categoryImages.value.length - MAX_VISIBLE_THUMBS));

const itemContainers = computed(() => {
    return props.category.categoryItems.map((categoryItem) => ({
        categoryItem,
        item: library.value.getItemById(categoryItem.itemId),
    }));
});

function displayWeight(mg, unit) {
    return MgToWeight(mg, unit) || 0;
}

function displayPrice(price, symbol) {
    const amount = typeof price === 'number' ? price.toFixed(2) : '0.00';
    return symbol + amount;
}

function newItem() {
    store.newItem({ category: props.category, _isNew: true });
}

function updateCategoryName(evt) {
    store.updateCategoryName({ id: props.category.id, name: evt.target.value });
}

function viewCategoryImageAt(index) {
    store.openViewImagesDialog(categoryImages.value, index);
}

function manageCategoryImages() {
    store.openCategoryImageDialog(props.category);
}

function removeCategory(category) {
    store.initSpeedbump(() => store.removeCategory(category), {
        body: 'Are you sure you want to delete this category? This cannot be undone.',
    });
}
</script>

<style>
.bwQtySubtotal {
    padding-right: 25px; /* Accommodates delete column */
}

.bwPriceSubtotal {
    padding-right: 4px;
}

.bwCategoryName {
    font-family: Figtree, system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;

    &::placeholder {
        color: #c8c7c2;
    }
}

/* Action link for adding items */
.bw-action-link {
    align-items: center;
    color: #8a8880;
    cursor: pointer;
    display: inline-flex;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 12px;
    gap: 4px;
    text-decoration: none;
    transition: color 120ms ease;

    &:hover {
        color: #e8a220;
    }

    svg {
        flex-shrink: 0;
    }
}

/* Category image thumbnail row */
.bwCategoryImageRow {
    padding: 6px 8px 6px 28px;

    .bwImageStrip {
        align-items: center;
        display: flex;
        gap: 4px;
    }
}

/* Category camera button */
.bwCategoryCamera {
    visibility: hidden;

    .bwHeader:hover & {
        visibility: visible;
    }
}

/* Remove button */
.bwRemoveCategory {
    align-items: center;
    color: #c8c7c2;
    cursor: pointer;
    display: inline-flex;
    transition: color 120ms ease;

    &:hover {
        color: #c05848;
    }
}
</style>
