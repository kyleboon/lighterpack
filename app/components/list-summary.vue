<template>
    <div class="bwListSummary">
        <div class="bwChartContainer">
            <donut-chart
                :categories="categories"
                :total-weight="list.totalWeight"
                :library="library"
                @category-hover="hoveredCategoryId = $event"
            />
        </div>
        <div class="bwTotalsContainer">
            <div class="bw-summary" :class="{ 'bw-summary--has-price': library.optionalFields['price'] }">
                <!-- Header -->
                <div class="bw-summary-header">
                    <span class="bw-s-dot"></span>
                    <span class="bw-s-name">Category</span>
                    <span v-if="library.optionalFields['price']" class="bw-s-price">Price</span>
                    <span class="bw-s-weight">Weight</span>
                </div>

                <!-- Category rows -->
                <div
                    v-for="category in categories"
                    :key="category.id"
                    class="bw-summary-row"
                    :class="{ 'bw-summary-row--hover': category.activeHover }"
                >
                    <span class="bw-s-dot bw-s-dot--picker">
                        <colorPicker
                            v-if="!readonly && category.displayColor"
                            :color="colorToHex(category.displayColor)"
                            @color-change="updateColor(category, $event)"
                        />
                        <span
                            v-else-if="category.displayColor"
                            class="bwLegend"
                            :style="{ backgroundColor: category.displayColor }"
                        />
                    </span>
                    <span class="bw-s-name">{{ category.name }}</span>
                    <span v-if="library.optionalFields['price']" class="bw-s-price bw-s-num">
                        {{ displayPrice(category.subtotalPrice, library.currencySymbol) }}
                    </span>
                    <span class="bw-s-weight bw-s-num">
                        <span class="bwDisplaySubtotal" :mg="category.subtotalWeight">{{
                            displayWeight(category.subtotalWeight, library.totalUnit)
                        }}</span>
                        <span class="bw-s-unit">{{ library.totalUnit }}</span>
                    </span>
                </div>

                <!-- Total row -->
                <div class="bw-summary-total">
                    <span class="bw-s-dot"></span>
                    <span class="bw-s-name">
                        Total
                        <span class="bw-s-qty">{{ list.totalQty }} items</span>
                    </span>
                    <span v-if="library.optionalFields['price']" class="bw-s-price bw-s-num">
                        {{ displayPrice(list.totalPrice, library.currencySymbol) }}
                    </span>
                    <span class="bw-s-weight bw-s-num">
                        <span class="bwTotalValue">{{ displayWeight(list.totalWeight, library.totalUnit) }}</span>
                        <span class="bw-s-unit"
                            ><unitSelect
                                v-if="!readonly"
                                :unit="library.totalUnit"
                                :on-change="setTotalUnit"
                            /><template v-else>{{ library.totalUnit }}</template></span
                        >
                    </span>
                </div>

                <!-- Breakdown strip (consumable / worn / base) -->
                <div v-if="list.totalConsumableWeight || list.totalWornWeight" class="bw-summary-breakdown">
                    <div v-if="list.totalConsumableWeight" class="bw-breakdown-chip" data-weight-type="consumable">
                        <span class="bw-breakdown-label">Consumable</span>
                        <span class="bw-breakdown-value">
                            <span class="bwDisplaySubtotal" :mg="list.totalConsumableWeight">{{
                                displayWeight(list.totalConsumableWeight, library.totalUnit)
                            }}</span>
                            <span class="bw-s-unit">{{ library.totalUnit }}</span>
                        </span>
                    </div>
                    <div v-if="list.totalWornWeight" class="bw-breakdown-chip" data-weight-type="worn">
                        <span class="bw-breakdown-label">Worn</span>
                        <span class="bw-breakdown-value">
                            <span class="bwDisplaySubtotal" :mg="list.totalWornWeight">{{
                                displayWeight(list.totalWornWeight, library.totalUnit)
                            }}</span>
                            <span class="bw-s-unit">{{ library.totalUnit }}</span>
                        </span>
                    </div>
                    <div class="bw-breakdown-chip bw-breakdown-chip--base" data-weight-type="base">
                        <span class="bw-breakdown-label">Base weight</span>
                        <span class="bw-breakdown-value">
                            <span
                                class="bwDisplaySubtotal"
                                :mg="list.totalBaseWeight"
                                :title="
                                    displayWeight(list.totalPackWeight, library.totalUnit) +
                                    ' ' +
                                    library.totalUnit +
                                    ' pack weight'
                                "
                                >{{ displayWeight(list.totalBaseWeight, library.totalUnit) }}</span
                            >
                            <span class="bw-s-unit">{{ library.totalUnit }}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useBaseweightStore } from '../store/store';
import { MgToWeight } from '#shared/utils/weight';
import { getColor, rgbToString, hexToRgb, rgbToHex, stringToRgb } from '#shared/utils/color';
import colorPicker from './colorpicker.vue';
import unitSelect from './unit-select.vue';
import donutChart from './donut-chart.vue';

defineOptions({ name: 'ListSummary' });

const props = defineProps({
    list: { type: Object, default: null },
    readonly: { type: Boolean, default: false },
});

const store = useBaseweightStore();

const hoveredCategoryId = ref(null);

const library = computed(() => store.library);

const categories = computed(() =>
    props.list.categoryIds.map((id, i) => {
        const category = library.value.getCategoryById(id);
        return {
            ...category,
            activeHover: hoveredCategoryId.value === category.id,
            displayColor: rgbToString(category.color || getColor(i)),
        };
    }),
);

function displayWeight(mg, unit) {
    return MgToWeight(mg, unit) || 0;
}

function displayPrice(price, symbol) {
    const amount = typeof price === 'number' ? price.toFixed(2) : '0.00';
    return symbol + amount;
}

function setTotalUnit(unit) {
    store.setTotalUnit(unit);
}

function updateColor(category, color) {
    store.updateCategoryColor({ id: category.id, color: hexToRgb(color) });
}

function colorToHex(color) {
    return rgbToHex(stringToRgb(color));
}
</script>

<style>
/* ================================================================
   List Summary — donut chart + aligned weight/price table
   ================================================================ */

.bwListSummary {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-bottom: 24px;
}

.bwChartContainer {
    flex-shrink: 0;
}

.bwTotalsContainer {
    flex: 1;
    min-width: 260px;
}

/* ── Summary table ────────────────────────────────────────────── */

/*
 * Grid columns:
 *   [dot]   [name]   [weight]
 *   26px    1fr      96px
 *
 * With price:
 *   [dot]   [name]   [price]   [weight]
 *   26px    1fr      80px      96px
 */
.bw-summary {
    --col-dot: 26px;
    --col-price: 80px;
    --col-weight: 96px;
    --cols: var(--col-dot) 1fr var(--col-weight);

    font-family: Figtree, system-ui, sans-serif;
    font-size: 13px;
    width: 100%;

    &.bw-summary--has-price {
        --cols: var(--col-dot) 1fr var(--col-price) var(--col-weight);
    }
}

/* Shared grid layout for every row type */
.bw-summary-header,
.bw-summary-row,
.bw-summary-total {
    align-items: center;
    display: grid;
    grid-template-columns: var(--cols);
}

/* ── Header ─────────────────────────────────────────────────────── */
.bw-summary-header {
    border-bottom: 1px solid #d0cfc9;
    color: #8a8880;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding-bottom: 6px;
    text-transform: uppercase;
}

/* ── Category rows ──────────────────────────────────────────────── */
.bw-summary-row {
    border-bottom: 1px solid #e8e7e1;
    padding: 4px 0;
    transition: background-color 80ms ease;

    &.bw-summary-row--hover {
        background: #f3f2ee;
        margin: 0 -6px;
        padding-left: 6px;
        padding-right: 6px;
    }
}

/* ── Total row ──────────────────────────────────────────────────── */
.bw-summary-total {
    border-top: 2px solid #1e1e1c;
    font-weight: 600;
    padding: 7px 0 4px;
}

/* ── Shared cell classes ────────────────────────────────────────── */
.bw-s-dot {
    align-items: center;
    display: flex;
    width: var(--col-dot);
}

.bw-s-name {
    align-items: baseline;
    display: flex;
    gap: 6px;
    overflow: hidden;
    padding-right: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.bw-s-price {
    padding-right: 8px;
    text-align: right;
}

.bw-s-weight {
    text-align: right;
}

.bw-s-num {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
}

.bw-s-unit {
    color: #8a8880;
    font-size: 11px;
    margin-left: 2px;
}

.bw-s-qty {
    color: #8a8880;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 11px;
    font-weight: 400;
}

/* ── Breakdown strip ────────────────────────────────────────────── */
.bw-summary-breakdown {
    border-top: 1px solid #e8e7e1;
    display: flex;
    flex-wrap: wrap;
    gap: 2px 16px;
    margin-top: 2px;
    padding-top: 8px;
}

.bw-breakdown-chip {
    align-items: baseline;
    color: #8a8880;
    display: flex;
    font-size: 12px;
    gap: 6px;
}

.bw-breakdown-label {
    font-weight: 500;
}

.bw-breakdown-value {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
}

.bw-breakdown-chip--base {
    color: #5a5954;
    font-weight: 600;
    margin-left: auto;

    .bw-breakdown-label {
        font-weight: 600;
    }
}
</style>
