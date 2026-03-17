<template>
    <div v-if="library && list" id="main" class="lpShare">
        <div
            class="lpList"
            :class="{
                lpShowImages: library.optionalFields.images,
                lpShowWorn: library.optionalFields.worn,
                lpShowConsumable: library.optionalFields.consumable,
                lpShowPrices: library.optionalFields.price,
            }"
        >
            <h1 class="lpListName">{{ list.name }}</h1>

            <div class="lpListSummary">
                <div class="lpChartContainer">
                    <donut-chart :categories="categories" :total-weight="totalWeight" :library="library" />
                </div>
                <div class="lpTotalsContainer">
                    <ul class="lpTotals lpTable lpDataTable">
                        <li class="lpRow lpHeader">
                            <span class="lpCell">&nbsp;</span>
                            <span class="lpCell">Category</span>
                            <span v-if="library.optionalFields.price" class="lpCell">Price</span>
                            <span class="lpCell">Weight</span>
                        </li>
                        <li
                            v-for="cat in categories"
                            :key="cat.id"
                            class="lpTotalCategory lpRow"
                            :id="`total_${cat.id}`"
                            :category="cat.id"
                        >
                            <span class="lpCell lpLegendCell">
                                <span class="lpLegend" :style="{ backgroundColor: cat.displayColor }" />
                            </span>
                            <span class="lpCell">{{ cat.name }}</span>
                            <span v-if="library.optionalFields.price" class="lpCell lpNumber">
                                {{ library.currencySymbol
                                }}{{ cat.subtotalPrice ? cat.subtotalPrice.toFixed(2) : '0.00' }}
                            </span>
                            <span class="lpCell lpNumber">
                                <div class="lpSubtotal">
                                    <span class="lpDisplaySubtotal" :mg="cat.subtotalWeight">{{
                                        mgToWeight(cat.subtotalWeight, library.totalUnit)
                                    }}</span>
                                    <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                                </div>
                            </span>
                        </li>
                        <li class="lpRow lpFooter lpTotal">
                            <span class="lpCell" />
                            <span class="lpCell lpSubtotal" :title="`${totals.totalQty} items`">Total</span>
                            <span v-if="library.optionalFields.price" class="lpCell lpNumber lpSubtotal">
                                {{ library.currencySymbol }}{{ totals.totalPriceDisplay }}
                            </span>
                            <span class="lpCell lpNumber lpSubtotal">
                                <span class="lpTotalValue" :title="`${totals.totalQty} items`">{{
                                    totals.totalWeightDisplay
                                }}</span>
                                <span class="lpTotalUnit">{{ library.totalUnit }}</span>
                            </span>
                        </li>
                        <li v-if="totals.totalConsumableWeight" class="lpRow lpFooter lpBreakdown lpConsumableWeight">
                            <span class="lpCell" />
                            <span class="lpCell lpSubtotal">Consumable</span>
                            <span v-if="library.optionalFields.price" class="lpCell" />
                            <span class="lpCell lpNumber lpSubtotal">
                                <span class="lpDisplaySubtotal" :mg="totals.totalConsumableWeight">{{
                                    totals.totalConsumableWeightDisplay
                                }}</span>
                                <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                            </span>
                        </li>
                        <li v-if="totals.totalWornWeight" class="lpRow lpFooter lpBreakdown lpWornWeight">
                            <span class="lpCell" />
                            <span class="lpCell lpSubtotal">Worn</span>
                            <span v-if="library.optionalFields.price" class="lpCell" />
                            <span class="lpCell lpNumber lpSubtotal">
                                <span class="lpDisplaySubtotal" :mg="totals.totalWornWeight">{{
                                    totals.totalWornWeightDisplay
                                }}</span>
                                <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                            </span>
                        </li>
                        <li v-if="totals.shouldDisplayPackWeight" class="lpRow lpFooter lpBreakdown lpPackWeight">
                            <span class="lpCell" />
                            <span class="lpCell lpSubtotal">Base Weight</span>
                            <span v-if="library.optionalFields.price" class="lpCell" />
                            <span class="lpCell lpNumber lpSubtotal">
                                <span class="lpDisplaySubtotal" :mg="totals.totalPackWeight">{{
                                    totals.totalPackWeightDisplay
                                }}</span>
                                <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            <div style="clear: both" />

            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="renderedDescription" id="lpListDescription" v-html="renderedDescription" />

            <ul class="lpCategories">
                <li v-for="cat in categories" :key="cat.id" class="lpCategory" :id="cat.id">
                    <ul class="lpItems lpDataTable">
                        <li class="lpHeader lpItemsHeader">
                            <h2 class="lpCategoryName">{{ cat.name }}</h2>
                            <span v-if="library.optionalFields.price" class="lpPriceCell">Price</span>
                            <span class="lpWeightCell">Weight</span>
                            <span class="lpQtyCell">qty</span>
                        </li>
                        <li
                            v-for="ci in cat.categoryItems"
                            :key="ci.itemId"
                            class="lpItem"
                            :class="itemClasses(ci)"
                            :id="ci.itemId"
                        >
                            <span v-if="library.optionalFields.images" class="lpImageCell">
                                <img
                                    v-if="getItem(ci.itemId).image"
                                    class="lpItemImage"
                                    :src="`https://i.imgur.com/${getItem(ci.itemId).image}s.jpg`"
                                    :href="`https://i.imgur.com/${getItem(ci.itemId).image}l.jpg`"
                                />
                                <img
                                    v-else-if="getItem(ci.itemId).imageUrl"
                                    class="lpItemImage"
                                    :src="getItem(ci.itemId).imageUrl"
                                    :href="getItem(ci.itemId).imageUrl"
                                />
                            </span>
                            <span class="lpName">
                                <a v-if="getItem(ci.itemId).url" :href="getItem(ci.itemId).url" class="lpHref">{{
                                    getItem(ci.itemId).name
                                }}</a>
                                <template v-else>{{ getItem(ci.itemId).name }}</template>
                            </span>
                            <span class="lpDescription">{{ getItem(ci.itemId).description }}</span>
                            <span class="lpActionsCell">
                                <i
                                    class="lpSprite lpWorn"
                                    :class="{ lpActive: ci.worn }"
                                    title="This item is worn and not counted in pack weight."
                                />
                                <i
                                    class="lpSprite lpConsumable"
                                    :class="{ lpActive: ci.consumable }"
                                    title="This item is a consumable and not counted in pack weight."
                                />
                                <i
                                    class="lpSprite lpStar"
                                    :class="[starClass(getItem(ci.itemId)), { lpHidden: !getItem(ci.itemId).star }]"
                                    title="This item is starred"
                                />
                            </span>
                            <span v-if="library.optionalFields.price" class="lpPriceCell lpNumber">
                                {{ library.currencySymbol
                                }}{{ getItem(ci.itemId).price ? getItem(ci.itemId).price.toFixed(2) : '0.00' }}
                            </span>
                            <span class="lpWeightCell lpNumber">
                                <span class="lpWeight">{{
                                    mgToWeight(getItem(ci.itemId).weight, getItem(ci.itemId).authorUnit)
                                }}</span>
                                <div class="lpUnitSelect">
                                    <span class="lpDisplay">{{ getItem(ci.itemId).authorUnit }}</span>
                                </div>
                            </span>
                            <span class="lpQtyCell lpNumber" :qty="ci.qty">{{ ci.qty }}</span>
                        </li>
                        <li class="lpFooter lpItemsFooter">
                            <span v-if="library.optionalFields.price" class="lpPriceCell lpNumber">
                                <div class="lpPriceSubtotal">
                                    {{ library.currencySymbol
                                    }}{{ cat.subtotalPrice ? cat.subtotalPrice.toFixed(2) : '0.00' }}
                                </div>
                            </span>
                            <span class="lpWeightCell lpNumber">
                                <div class="lpSubtotal">
                                    <span class="lpDisplaySubtotal" :mg="cat.subtotalWeight">{{
                                        mgToWeight(cat.subtotalWeight, library.totalUnit)
                                    }}</span>
                                    <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                                </div>
                            </span>
                            <span class="lpQtyCell lpNumber">
                                <div class="lpSubtotal">
                                    <span class="lpQtySubtotal">{{ cat.subtotalQty }}</span>
                                </div>
                            </span>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
    <div v-else-if="error" id="main" class="lpShare">
        <p>{{ error.message || 'List not found.' }}</p>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked';
import dataTypes from '../../../shared/dataTypes.js';
import weightUtils from '../../../shared/utils/weight.js';

const { Library } = dataTypes;

const route = useRoute();
const { data: shareData, error } = await useAsyncData('share', () => $fetch(`/api/share/${route.params.id}`));

const library = computed(() => {
    if (!shareData.value) return null;
    const lib = new Library();
    lib.load(shareData.value.library);
    for (const l of lib.lists) {
        if (l.externalId && l.externalId == shareData.value.externalId) {
            lib.defaultListId = l.id;
            break;
        }
    }
    // Pre-calculate subtotals for all categories
    for (const cat of lib.categories) {
        cat.calculateSubtotal();
    }
    return lib;
});

const list = computed(() => {
    if (!library.value) return null;
    return library.value.getListById(library.value.defaultListId);
});

const categories = computed(() => {
    if (!library.value || !list.value) return [];
    return list.value.categoryIds.map((id) => library.value.getCategoryById(id)).filter(Boolean);
});

const totalWeight = computed(() => categories.value.reduce((sum, c) => sum + c.subtotalWeight, 0));

const totals = computed(() => {
    let totalWeight = 0;
    let totalWornWeight = 0;
    let totalConsumableWeight = 0;
    let totalQty = 0;
    let totalPrice = 0;
    let totalConsumablePrice = 0;

    for (const cat of categories.value) {
        totalWeight += cat.subtotalWeight;
        totalPrice += cat.subtotalPrice;
        totalWornWeight += cat.subtotalWornWeight;
        totalConsumableWeight += cat.subtotalConsumableWeight;
        totalConsumablePrice += cat.subtotalConsumablePrice;
        totalQty += cat.subtotalQty;
    }

    const totalPackWeight = totalWeight - (totalWornWeight + totalConsumableWeight);
    const unit = library.value?.totalUnit ?? 'oz';

    return {
        totalWeight,
        totalWeightDisplay: mgToWeight(totalWeight, unit),
        totalWornWeight,
        totalWornWeightDisplay: mgToWeight(totalWornWeight, unit),
        totalConsumableWeight,
        totalConsumableWeightDisplay: mgToWeight(totalConsumableWeight, unit),
        totalPackWeight,
        totalPackWeightDisplay: mgToWeight(totalPackWeight, unit),
        shouldDisplayPackWeight: totalPackWeight !== totalWeight,
        totalQty,
        totalPrice,
        totalPriceDisplay: totalPrice ? totalPrice.toFixed(2) : '',
        totalConsumablePrice,
        totalConsumablePriceDisplay: totalConsumablePrice ? totalConsumablePrice.toFixed(2) : '',
    };
});

const renderedDescription = computed(() => {
    if (!list.value?.description) return '';
    return marked(list.value.description);
});

function mgToWeight(mg, unit) {
    return weightUtils.MgToWeight(mg, unit);
}

function getItem(itemId) {
    return library.value?.getItemById(itemId) ?? {};
}

function itemClasses(ci) {
    const item = getItem(ci.itemId);
    return {
        lpItemHasImage: !!(item.image || item.imageUrl),
        lpItemHasPrice: !!item.price,
    };
}

function starClass(item) {
    return item.star ? `lpStar${item.star}` : '';
}
</script>

<style lang="scss">
@use '../../assets/css/globals' as *;
@use '../../assets/css/share' as *;
</style>
