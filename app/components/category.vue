<template>
    <li :id="category.id" class="lpCategory">
        <ul class="lpItems lpDataTable">
            <li class="lpHeader lpItemsHeader">
                <span v-if="!readonly" class="lpHandleCell">
                    <div class="lpHandle lpCategoryHandle" title="Reorder this category" />
                </span>
                <h2 v-if="readonly" class="lpCategoryName">{{ category.name }}</h2>
                <input
                    v-else
                    v-focus-on-create="category._isNew"
                    type="text"
                    :value="category.name"
                    placeholder="Category Name"
                    class="lpCategoryName lpSilent"
                    @input="updateCategoryName"
                />
                <button
                    v-if="!readonly && library.optionalFields['images']"
                    class="lp-icon-btn lpCategoryCamera"
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
                <span v-if="library.optionalFields['price']" class="lpPriceCell">Price</span>
                <span class="lpWeightCell">Weight</span>
                <span class="lpQtyCell">qty</span>
                <span v-if="!readonly" class="lpRemoveCell"
                    ><a
                        class="lpRemove lpRemoveCategory"
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
            <li v-if="library.optionalFields['images'] && categoryImages.length > 0" class="lpCategoryImageRow">
                <span class="lpImageStrip">
                    <img
                        v-for="(img, i) in visibleCategoryThumbs"
                        :key="img.id ?? i"
                        class="lpItemThumb"
                        :src="img.url"
                        :title="`Image ${i + 1}`"
                        @click="viewCategoryImageAt(i)"
                    />
                    <span
                        v-if="extraCategoryImageCount > 0"
                        class="lpThumbMore"
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
            <li class="lpFooter lpItemsFooter">
                <span class="lpAddItemCell">
                    <a v-if="!readonly" class="lpAdd lpAddItem lp-action-link" @click="newItem">
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
                <span v-if="library.optionalFields['price']" class="lpPriceCell lpNumber lpSubtotal">
                    {{ displayPrice(category.subtotalPrice, library.currencySymbol) }}
                </span>
                <span class="lpWeightCell lpNumber lpSubtotal">
                    <span class="lpDisplaySubtotal">{{
                        displayWeight(category.subtotalWeight, library.totalUnit)
                    }}</span>
                    <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                </span>
                <span class="lpQtyCell lpSubtotal">
                    <span class="lpQtySubtotal">{{ category.subtotalQty }}</span>
                </span>
                <span class="lpRemoveCell" />
            </li>
        </ul>
    </li>
</template>

<script setup>
import { computed } from 'vue';
import { useLighterpackStore } from '../store/store';
import { MgToWeight } from '#shared/utils/weight';
import item from './item.vue';

defineOptions({ name: 'Category' });

const props = defineProps({
    category: { type: Object, default: null },
    readonly: { type: Boolean, default: false },
});

const store = useLighterpackStore();

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
.lpQtySubtotal {
    padding-right: 25px; /* Accommodates delete column */
}

.lpPriceSubtotal {
    padding-right: 4px;
}

.lpCategoryName {
    font-family: Figtree, system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;

    &::placeholder {
        color: #c8c7c2;
    }
}

/* Action link for adding items */
.lp-action-link {
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
.lpCategoryImageRow {
    padding: 6px 8px 6px 28px;

    .lpImageStrip {
        align-items: center;
        display: flex;
        gap: 4px;
    }
}

/* Category camera button */
.lpCategoryCamera {
    visibility: hidden;

    .lpHeader:hover & {
        visibility: visible;
    }
}

/* Remove button */
.lpRemoveCategory {
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
