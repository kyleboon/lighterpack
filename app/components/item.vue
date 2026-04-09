<template>
    <li :id="item.id" :class="'lpItem ' + item.classes">
        <span v-if="!readonly" class="lpHandleCell">
            <div class="lpItemHandle lpHandle" title="Reorder this item" />
        </span>
        <span v-if="library.optionalFields['images']" class="lpImageCell">
            <span v-if="item.images && item.images.length > 0" class="lpImageStrip">
                <img
                    v-for="(img, i) in visibleThumbnails"
                    :key="img.id ?? i"
                    class="lpItemThumb"
                    :src="img.url"
                    :alt="`${item.name} image ${i + 1}`"
                    :title="`Image ${i + 1}`"
                    @click="viewItemImageAt(i)"
                />
                <span v-if="extraImageCount > 0" class="lpThumbMore" @click="viewItemImageAt(visibleThumbnails.length)">
                    +{{ extraImageCount }}
                </span>
            </span>
            <img
                v-else-if="thumbnailImage"
                class="lpItemImage"
                :src="thumbnailImage"
                :alt="item.name + ' thumbnail'"
                @click="viewItemImage()"
            />
        </span>
        <template v-if="readonly">
            <span class="lpName">
                <a v-if="item.url" class="lpHref" :href="item.url">{{ item.name }}</a>
                <template v-else>{{ item.name }}</template>
            </span>
            <span class="lpDescription">{{ item.description }}</span>
        </template>
        <template v-else>
            <label :for="'item-name-' + item.id" class="visually-hidden">Item name</label>
            <input
                :id="'item-name-' + item.id"
                v-model="item.name"
                v-focus-on-create="categoryItem._isNew"
                type="text"
                class="lpName lpSilent"
                placeholder="Name"
                @input="saveItem"
            />
            <label :for="'item-desc-' + item.id" class="visually-hidden">Item description</label>
            <input
                :id="'item-desc-' + item.id"
                v-model="item.description"
                type="text"
                class="lpDescription lpSilent"
                placeholder="Description"
                @input="saveItem"
            />
        </template>
        <span v-if="readonly" class="lpActionsCell">
            <i v-if="library.optionalFields['worn']" class="lpSprite lpWorn" :class="{ lpActive: categoryItem.worn }" />
            <i
                v-if="library.optionalFields['consumable']"
                class="lpSprite lpConsumable"
                :class="{ lpActive: categoryItem.consumable }"
            />
            <i v-if="categoryItem.star" class="lpSprite lpStar" :class="'lpStar' + categoryItem.star" />
        </span>
        <span v-else class="lpActionsCell">
            <button
                class="lp-icon-btn lpCamera"
                title="Upload a photo or use a photo from the web"
                aria-label="Upload photo"
                @click="updateItemImage"
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
            <button
                class="lp-icon-btn lpLink"
                :class="{ lpActive: item.url }"
                title="Add a link for this item"
                aria-label="Add link"
                @click="updateItemLink"
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
                    <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7 4" />
                    <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L9 12" />
                </svg>
            </button>
            <button
                v-if="library.optionalFields['worn']"
                class="lp-icon-btn lpWorn"
                :class="{ lpActive: categoryItem.worn }"
                title="Mark this item as worn"
                :aria-label="categoryItem.worn ? 'Worn (active)' : 'Mark as worn'"
                @click="toggleWorn"
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
                    <circle cx="8" cy="3.5" r="1.5" />
                    <path d="M5.5 7.5l-1.5 6h8l-1.5-6" />
                    <path d="M5.5 7.5c.7 1.5 4.3 1.5 5 0" />
                </svg>
            </button>
            <button
                v-if="library.optionalFields['consumable']"
                class="lp-icon-btn lpConsumable"
                :class="{ lpActive: categoryItem.consumable }"
                title="Mark this item as a consumable"
                :aria-label="categoryItem.consumable ? 'Consumable (active)' : 'Mark as consumable'"
                @click="toggleConsumable"
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
                        d="M8 13.5C5.5 13.5 4 11.8 4 9.5c0-1.8.8-3 2.5-4.5 0 1.5.7 2.3 1.5 2.5C8 6 8.8 4.5 9 3c1.8 1.3 3 2.7 3 4.5 0 2.5-1.5 3.5-2.5 4.5C9.2 13.2 8.6 13.5 8 13.5z"
                    />
                </svg>
            </button>
            <button
                class="lp-icon-btn lpStar"
                :class="'lpStar' + categoryItem.star"
                title="Star this item"
                :aria-label="categoryItem.star ? 'Star level ' + categoryItem.star : 'Add star'"
                @click="cycleStar"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path
                        d="M8 2l1.6 4H14l-3.4 2.5 1.3 4L8 10.3l-3.9 2.2 1.3-4L2 6h4.4L8 2z"
                        stroke="currentColor"
                        stroke-width="1.5"
                        :fill="categoryItem.star ? 'currentColor' : 'none'"
                    />
                </svg>
            </button>
        </span>
        <span v-if="library.optionalFields['price']" class="lpPriceCell">
            <template v-if="readonly"
                >{{ library.currencySymbol }}{{ item.price ? item.price.toFixed(2) : '0.00' }}</template
            >
            <input
                v-else
                v-model="displayPrice"
                v-empty-if-zero
                type="text"
                aria-label="Price"
                :class="{ lpPrice: true, lpNumber: true, lpSilent: true, lpSilentError: priceError }"
                @input="savePrice"
                @keydown.up="incrementPrice($event)"
                @keydown.down="decrementPrice($event)"
                @blur="setDisplayPrice"
            />
        </span>
        <span class="lpWeightCell lpNumber">
            <template v-if="readonly">{{ displayWeight }} {{ item.authorUnit }}</template>
            <template v-else>
                <input
                    v-model="displayWeight"
                    v-empty-if-zero
                    type="text"
                    aria-label="Weight"
                    :class="{ lpWeight: true, lpNumber: true, lpSilent: true, lpSilentError: weightError }"
                    @input="saveWeight"
                    @keydown.up="incrementWeight($event)"
                    @keydown.down="decrementWeight($event)"
                />
                <unitSelect :unit="item.authorUnit" :on-change="setUnit" />
            </template>
        </span>
        <span class="lpQtyCell">
            <template v-if="readonly">{{ displayQty }}</template>
            <template v-else>
                <input
                    v-model="displayQty"
                    type="text"
                    aria-label="Quantity"
                    :class="{ lpQty: true, lpNumber: true, lpSilent: true, lpSilentError: qtyError }"
                    @input="saveQty"
                    @keydown.up="incrementQty($event)"
                    @keydown.down="decrementQty($event)"
                />
                <span class="lpArrows">
                    <button
                        type="button"
                        class="lp-arrow lpUp"
                        aria-label="Increase quantity"
                        @click="incrementQty($event)"
                    >
                        <svg
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            aria-hidden="true"
                        >
                            <path d="M1 5l4-4 4 4" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        class="lp-arrow lpDown"
                        aria-label="Decrease quantity"
                        @click="decrementQty($event)"
                    >
                        <svg
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            aria-hidden="true"
                        >
                            <path d="M1 1l4 4 4-4" />
                        </svg>
                    </button>
                </span>
            </template>
        </span>
        <span v-if="!readonly" class="lpRemoveCell">
            <a class="lpRemove lpRemoveItem" title="Remove this item" aria-label="Remove item" @click="removeItem">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <line x1="4" y1="4" x2="12" y2="12" />
                    <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
            </a>
        </span>
    </li>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount } from 'vue';
import { useLighterpackStore } from '../store/store';
import unitSelect from './unit-select.vue';
import { WeightToMg, MgToWeight } from '#shared/utils/weight';

defineOptions({ name: 'Item' });

const props = defineProps({
    category: {
        type: Object,
        default: null,
    },
    itemContainer: {
        type: Object,
        default: null,
    },
    readonly: {
        type: Boolean,
        default: false,
    },
});

const store = useLighterpackStore();

const displayWeight = ref(0);
const displayPrice = ref(0);
const displayQty = ref(0);
const weightError = ref(false);
const priceError = ref(false);
const qtyError = ref(false);
const numStars = ref(4);

const library = computed(() => store.library);
const item = ref({ ...props.itemContainer.item });
const categoryItem = ref({ ...props.itemContainer.categoryItem });

const MAX_VISIBLE_THUMBS = 4;

const visibleThumbnails = computed(() => {
    const sorted = (item.value.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    return sorted.slice(0, MAX_VISIBLE_THUMBS);
});

const extraImageCount = computed(() => Math.max(0, (item.value.images?.length ?? 0) - MAX_VISIBLE_THUMBS));

const thumbnailImage = computed(() => {
    if (item.value.images?.length) {
        return item.value.images[0].url;
    }
    // Legacy Imgur
    if (item.value.image) {
        return `https://i.imgur.com/${item.value.image}s.jpg`;
    }
    if (item.value.imageUrl) {
        return item.value.imageUrl;
    }
    return '';
});

const fullImage = computed(() => {
    if (item.value.images?.length) {
        return item.value.images[0].url;
    }
    // Legacy Imgur
    if (item.value.image) {
        return `https://i.imgur.com/${item.value.image}l.jpg`;
    }
    if (item.value.imageUrl) {
        return item.value.imageUrl;
    }
    return '';
});

watch(
    () => props.itemContainer.item,
    (newItem) => {
        item.value = { ...newItem };
        setDisplayWeight();
    },
    { deep: true },
);

watch(
    () => props.itemContainer.categoryItem,
    (newCategoryItem) => {
        categoryItem.value = { ...newCategoryItem };
        setDisplayQty();
    },
    { deep: true },
);

onBeforeMount(() => {
    setDisplayWeight();
    setDisplayPrice();
    setDisplayQty();
});

function saveItem() {
    store.updateItem(item.value);
}

function saveCategoryItem() {
    store.updateCategoryItem({ category: props.category, categoryItem: categoryItem.value });
}

function setUnit(unit) {
    item.value.authorUnit = unit;
    store.updateItemUnit(unit);
    saveWeight(); // calling saveWeight preserves the text in the weight box instead of converting units.
}

function savePrice() {
    const priceFloat = parseFloat(displayPrice.value, 10);

    if (!isNaN(priceFloat)) {
        item.value.price = Math.round(priceFloat * 100) / 100;
        saveItem();
        priceError.value = false;
    } else {
        priceError.value = true;
    }
}

function saveQty() {
    const qtyFloat = parseFloat(displayQty.value, 10);

    if (!isNaN(qtyFloat)) {
        categoryItem.value.qty = qtyFloat;
        saveCategoryItem();
        qtyError.value = false;
    } else {
        qtyError.value = true;
    }
}

function saveWeight() {
    const weightFloat = parseFloat(displayWeight.value, 10);

    if (!isNaN(weightFloat)) {
        item.value.weight = WeightToMg(weightFloat, item.value.authorUnit);
        saveItem();
        weightError.value = false;
    } else {
        weightError.value = true;
    }
}

function setDisplayPrice() {
    if (!priceError.value) {
        displayPrice.value = item.value.price.toFixed(2);
    }
}

function setDisplayQty() {
    if (!qtyError.value) {
        displayQty.value = categoryItem.value.qty;
    }
}

function setDisplayWeight() {
    displayWeight.value = MgToWeight(item.value.weight, item.value.authorUnit);
}

function updateItemLink() {
    store.openItemLinkDialog(item.value);
}

function updateItemImage() {
    store.openItemImageDialog(item.value);
}

function viewItemImage() {
    if (item.value.images?.length) {
        store.openViewImagesDialog(item.value.images.slice().sort((a, b) => a.sort_order - b.sort_order));
    } else {
        store.openViewImageDialog(fullImage.value);
    }
}

function viewItemImageAt(index) {
    const sorted = (item.value.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    store.openViewImagesDialog(sorted, index);
}

function toggleWorn() {
    if (categoryItem.value.consumable) {
        return;
    }
    categoryItem.value.worn = !categoryItem.value.worn;
    saveCategoryItem();
}

function toggleConsumable() {
    if (categoryItem.value.worn) {
        return;
    }
    categoryItem.value.consumable = !categoryItem.value.consumable;
    saveCategoryItem();
}

function cycleStar() {
    if (!categoryItem.value.star) {
        categoryItem.value.star = 0;
    }
    categoryItem.value.star = (categoryItem.value.star + 1) % numStars.value;
    saveCategoryItem();
}

function incrementPrice(evt) {
    evt.stopImmediatePropagation();

    if (priceError.value) {
        return;
    }

    item.value.price = item.value.price + 1;

    saveItem();
    setDisplayPrice();
}

function decrementPrice(evt) {
    evt.stopImmediatePropagation();

    if (priceError.value) {
        return;
    }

    item.value.price = item.value.price - 1;

    if (item.value.price < 0) {
        item.value.price = 0;
    }

    saveItem();
    setDisplayPrice();
}

function incrementQty(evt) {
    evt.stopImmediatePropagation();

    if (qtyError.value) {
        return;
    }

    categoryItem.value.qty = categoryItem.value.qty + 1;
    saveCategoryItem();
}

function decrementQty(evt) {
    evt.stopImmediatePropagation();

    if (qtyError.value) {
        return;
    }

    categoryItem.value.qty = categoryItem.value.qty - 1;

    if (categoryItem.value.qty < 0) {
        categoryItem.value.qty = 0;
    }

    saveCategoryItem();
}

function incrementWeight(evt) {
    evt.stopImmediatePropagation();

    if (weightError.value) {
        return;
    }

    const newWeight = MgToWeight(item.value.weight, item.value.authorUnit) + 1;
    item.value.weight = WeightToMg(newWeight, item.value.authorUnit);

    saveItem();
}

function decrementWeight(evt) {
    evt.stopImmediatePropagation();

    if (weightError.value) {
        return;
    }

    const newWeight = MgToWeight(item.value.weight, item.value.authorUnit) - 1;
    item.value.weight = WeightToMg(newWeight, item.value.authorUnit);

    if (item.value.weight < 0) {
        item.value.weight = 0;
    }

    saveItem();
}

function removeItem() {
    store.removeItemFromCategory({ itemId: item.value.id, category: props.category });
}

defineExpose({
    displayWeight,
    displayPrice,
    displayQty,
    weightError,
    priceError,
    qtyError,
    numStars,
    library,
    item,
    categoryItem,
    visibleThumbnails,
    extraImageCount,
    thumbnailImage,
    fullImage,
    saveItem,
    saveCategoryItem,
    setUnit,
    savePrice,
    saveQty,
    saveWeight,
    setDisplayPrice,
    setDisplayQty,
    setDisplayWeight,
    updateItemLink,
    updateItemImage,
    viewItemImage,
    viewItemImageAt,
    toggleWorn,
    toggleConsumable,
    cycleStar,
    incrementPrice,
    decrementPrice,
    incrementQty,
    decrementQty,
    incrementWeight,
    decrementWeight,
    removeItem,
});
</script>

<style>
.lpItem {
    &:hover,
    &.ui-sortable-helper {
        background: #f3f2ee;

        .lpRemove,
        .lpHandle,
        .lpArrows,
        .lp-icon-btn {
            visibility: visible;
        }
    }

    input,
    select {
        padding: 3px;
    }
}

/* Action icon buttons (camera, link, worn, consumable, star) */
.lp-icon-btn {
    align-items: center;
    background: none;
    border: none;
    color: #c8c7c2;
    cursor: pointer;
    display: inline-flex;
    justify-content: center;
    padding: 2px;
    transition: color 120ms ease;
    visibility: hidden;

    &:hover {
        color: #5a5954;
    }

    &.lpActive {
        color: #e8a220;
        visibility: visible;
    }
}

/* Star states */
.lpStar {
    &.lpStar0 {
        color: #c8c7c2;
    }

    &.lpStar1 {
        color: #e8a220;
        visibility: visible;
    }

    &.lpStar2 {
        color: #d68a00;
        visibility: visible;
    }

    &.lpStar3 {
        color: #b06e00;
        visibility: visible;
    }
}

/* Remove link */
.lpRemoveItem {
    color: #c8c7c2;
    cursor: pointer;
    display: inline-flex;
    transition: color 120ms ease;
    visibility: hidden;

    &:hover {
        color: #c05848;
    }
}

/* Multi-image thumbnail strip */
.lpImageStrip {
    align-items: center;
    display: flex;
    gap: 2px;
}

.lpItemThumb {
    border-radius: 3px;
    cursor: pointer;
    flex-shrink: 0;
    height: 36px;
    object-fit: cover;
    opacity: 0.85;
    transition: opacity 120ms ease;
    width: 36px;

    &:hover {
        opacity: 1;
    }
}

.lpThumbMore {
    align-items: center;
    background: #e8e7e2;
    border-radius: 3px;
    color: #5a5954;
    cursor: pointer;
    display: flex;
    font-size: 11px;
    font-weight: 600;
    height: 36px;
    justify-content: center;
    min-width: 28px;
    padding: 0 4px;
    transition: background 120ms ease;

    &:hover {
        background: #d0cfc9;
    }
}

/* Qty arrows */
.lpArrows {
    display: inline-flex;
    flex-direction: column;
    gap: 1px;
    visibility: hidden;
}

.lp-arrow {
    background: none;
    border: none;
    color: #8a8880;
    cursor: pointer;
    display: flex;
    line-height: 1;
    padding: 0;
    transition: color 120ms ease;

    &:hover {
        color: #1e1e1c;
    }
}
</style>
