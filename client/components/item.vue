<template>
    <li :id="item.id" :class="'lpItem ' + item.classes">
        <span class="lpHandleCell">
            <div class="lpItemHandle lpHandle" title="Reorder this item" />
        </span>
        <span v-if="library.optionalFields['images']" class="lpImageCell">
            <img v-if="thumbnailImage" class="lpItemImage" :src="thumbnailImage" @click="viewItemImage()" />
        </span>
        <input
            v-model="item.name"
            v-focus-on-create="categoryItem._isNew"
            type="text"
            class="lpName lpSilent"
            placeholder="Name"
            @input="saveItem"
        />
        <input
            v-model="item.description"
            type="text"
            class="lpDescription lpSilent"
            placeholder="Description"
            @input="saveItem"
        />
        <span class="lpActionsCell">
            <i class="lpSprite lpCamera" title="Upload a photo or use a photo from the web" @click="updateItemImage" />
            <i
                class="lpSprite lpLink"
                :class="{ lpActive: item.url }"
                title="Add a link for this item"
                @click="updateItemLink"
            />
            <i
                v-if="library.optionalFields['worn']"
                class="lpSprite lpWorn"
                :class="{ lpActive: categoryItem.worn }"
                title="Mark this item as worn"
                @click="toggleWorn"
            />
            <i
                v-if="library.optionalFields['consumable']"
                class="lpSprite lpConsumable"
                :class="{ lpActive: categoryItem.consumable }"
                title="Mark this item as a consumable"
                @click="toggleConsumable"
            />
            <i :class="'lpSprite lpStar lpStar' + categoryItem.star" title="Star this item" @click="cycleStar" />
        </span>
        <span v-if="library.optionalFields['price']" class="lpPriceCell">
            <input
                v-model="displayPrice"
                v-empty-if-zero
                type="text"
                :class="{ lpPrice: true, lpNumber: true, lpSilent: true, lpSilentError: priceError }"
                @input="savePrice"
                @keydown.up="incrementPrice($event)"
                @keydown.down="decrementPrice($event)"
                @blur="setDisplayPrice"
            />
        </span>
        <span class="lpWeightCell lpNumber">
            <input
                v-model="displayWeight"
                v-empty-if-zero
                type="text"
                :class="{ lpWeight: true, lpNumber: true, lpSilent: true, lpSilentError: weightError }"
                @input="saveWeight"
                @keydown.up="incrementWeight($event)"
                @keydown.down="decrementWeight($event)"
            />
            <unitSelect :unit="item.authorUnit" :on-change="setUnit" />
        </span>
        <span class="lpQtyCell">
            <input
                v-model="displayQty"
                type="text"
                :class="{ lpQty: true, lpNumber: true, lpSilent: true, lpSilentError: qtyError }"
                @input="saveQty"
                @keydown.up="incrementQty($event)"
                @keydown.down="decrementQty($event)"
            />
            <span class="lpArrows">
                <span class="lpSprite lpUp" @click="incrementQty($event)" />
                <span class="lpSprite lpDown" @click="decrementQty($event)" />
            </span>
        </span>
        <span class="lpRemoveCell">
            <a class="lpRemove lpRemoveItem" title="Remove this item" @click="removeItem"
                ><i class="lpSprite lpSpriteRemove"
            /></a>
        </span>
    </li>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import unitSelect from './unit-select.vue';
import weightUtils from '../utils/weight.js';

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

const thumbnailImage = computed(() => {
    if (item.value.image) {
        return `https://i.imgur.com/${item.value.image}s.jpg`;
    }
    if (item.value.imageUrl) {
        return item.value.imageUrl;
    }
    return '';
});

const fullImage = computed(() => {
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
        item.value.weight = weightUtils.WeightToMg(weightFloat, item.value.authorUnit);
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
    displayWeight.value = weightUtils.MgToWeight(item.value.weight, item.value.authorUnit);
}

function updateItemLink() {
    store.openItemLinkDialog(item.value);
}

function updateItemImage() {
    store.openItemImageDialog(item.value);
}

function viewItemImage() {
    store.openViewImageDialog(fullImage.value);
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

    const newWeight = weightUtils.MgToWeight(item.value.weight, item.value.authorUnit) + 1;
    item.value.weight = weightUtils.WeightToMg(newWeight, item.value.authorUnit);

    saveItem();
}

function decrementWeight(evt) {
    evt.stopImmediatePropagation();

    if (weightError.value) {
        return;
    }

    const newWeight = weightUtils.MgToWeight(item.value.weight, item.value.authorUnit) - 1;
    item.value.weight = weightUtils.WeightToMg(newWeight, item.value.authorUnit);

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

<style lang="scss">
.lpItem {
    &:hover,
    &.ui-sortable-helper {
        background: #fff;

        .lpRemove,
        .lpWorn,
        .lpConsumable,
        .lpCamera,
        .lpLink,
        .lpHandle,
        .lpArrows,
        .lpStar {
            visibility: visible;
        }
    }

    input,
    select {
        padding: 3px;
    }
}

.lpArrows {
    display: inline-block;
    height: 14px;
    position: relative;
    visibility: hidden;
    width: 10px;

    .lpUp,
    .lpDown {
        cursor: pointer;
        left: 0;
        margin: 2px;
        opacity: 0.5;
        position: absolute;
        top: 0;

        &:hover {
            opacity: 1;
        }
    }

    .lpDown {
        top: 11px;
    }
}
</style>
