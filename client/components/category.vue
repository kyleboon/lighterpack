<template>
    <li :id="category.id" class="lpCategory">
        <ul class="lpItems lpDataTable">
            <li class="lpHeader lpItemsHeader">
                <span class="lpHandleCell">
                    <div class="lpHandle lpCategoryHandle" title="Reorder this category" />
                </span>
                <input
                    v-focus-on-create="category._isNew"
                    type="text"
                    :value="category.name"
                    placeholder="Category Name"
                    class="lpCategoryName lpSilent"
                    @input="updateCategoryName"
                />
                <span v-if="library.optionalFields['price']" class="lpPriceCell">Price</span>
                <span class="lpWeightCell">Weight</span>
                <span class="lpQtyCell">qty</span>
                <span class="lpRemoveCell"
                    ><a class="lpRemove lpRemoveCategory" title="Remove this category" @click="removeCategory(category)"
                        ><i class="lpSprite lpSpriteRemove" /></a
                ></span>
            </li>
            <item
                v-for="itemContainer in itemContainers"
                :key="itemContainer.item.id"
                :item-container="itemContainer"
                :category="category"
            />
            <li class="lpFooter lpItemsFooter">
                <span class="lpAddItemCell">
                    <a class="lpAdd lpAddItem" @click="newItem"><i class="lpSprite lpSpriteAdd" />Add new item</a>
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
import { useLighterpackStore } from '../store/store.js';
import weightUtils from '../utils/weight.js';
import item from './item.vue';

defineOptions({ name: 'Category' });

const props = defineProps({
    category: { type: Object, default: null },
});

const store = useLighterpackStore();

const library = computed(() => store.library);

const itemContainers = computed(() => {
    return props.category.categoryItems.map((categoryItem) => ({
        categoryItem,
        item: library.value.getItemById(categoryItem.itemId),
    }));
});

function displayWeight(mg, unit) {
    return weightUtils.MgToWeight(mg, unit) || 0;
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

function removeCategory(category) {
    store.initSpeedbump(() => store.removeCategory(category), {
        body: 'Are you sure you want to delete this category? This cannot be undone.',
    });
}
</script>

<style lang="scss">
.lpQtySubtotal {
    padding-right: 25px; /* Accommodates delete column */
}

.lpPriceSubtotal {
    /* unused? */
    padding-right: 4px;
}
</style>
