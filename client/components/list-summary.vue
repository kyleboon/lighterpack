<template>
    <div class="lpListSummary">
        <div class="lpChartContainer">
            <donut-chart
                :categories="categories"
                :total-weight="list.totalWeight"
                :library="library"
                @category-hover="hoveredCategoryId = $event"
            />
        </div>
        <div class="lpTotalsContainer">
            <ul class="lpTotals lpTable lpDataTable">
                <li class="lpRow lpHeader">
                    <span class="lpCell">&nbsp;</span>
                    <span class="lpCell"> Category </span>
                    <span v-if="library.optionalFields['price']" class="lpCell"> Price </span>
                    <span class="lpCell"> Weight </span>
                </li>
                <li
                    v-for="category in categories"
                    :key="category.id"
                    :class="{ hover: category.activeHover, 'lpTotalCategory lpRow': true }"
                >
                    <span class="lpCell lpLegendCell">
                        <colorPicker
                            v-if="category.displayColor"
                            :color="colorToHex(category.displayColor)"
                            @color-change="updateColor(category, $event)"
                        />
                    </span>
                    <span class="lpCell">
                        {{ category.name }}
                    </span>
                    <span v-if="library.optionalFields['price']" class="lpCell lpNumber">
                        {{ displayPrice(category.subtotalPrice, library.currencySymbol) }}
                    </span>
                    <span class="lpCell lpNumber">
                        <span class="lpDisplaySubtotal" :mg="category.subtotalWeight">{{
                            displayWeight(category.subtotalWeight, library.totalUnit)
                        }}</span>
                        <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                    </span>
                </li>
                <li class="lpRow lpFooter lpTotal">
                    <span class="lpCell" />
                    <span class="lpCell lpSubtotal" :title="list.totalQty + ' items'"> Total </span>
                    <span
                        v-if="library.optionalFields['price']"
                        class="lpCell lpNumber lpSubtotal"
                        :title="list.totalQty + ' items'"
                    >
                        {{ displayPrice(list.totalPrice, library.currencySymbol) }}
                    </span>
                    <span class="lpCell lpNumber lpSubtotal">
                        <span class="lpTotalValue" :title="list.totalQty + ' items'">
                            {{ displayWeight(list.totalWeight, library.totalUnit) }}
                        </span>
                        <span class="lpTotalUnit"
                            ><unitSelect :unit="library.totalUnit" :on-change="setTotalUnit"
                        /></span>
                    </span>
                </li>
                <li
                    v-if="list.totalConsumableWeight"
                    data-weight-type="consumable"
                    class="lpRow lpFooter lpBreakdown lpConsumableWeight"
                >
                    <span class="lpCell" />
                    <span class="lpCell lpSubtotal"> Consumable </span>
                    <span v-if="library.optionalFields['price']" class="lpCell lpNumber lpSubtotal">
                        {{ displayPrice(list.totalConsumablePrice, library.currencySymbol) }}
                    </span>
                    <span class="lpCell lpNumber lpSubtotal">
                        <span class="lpDisplaySubtotal" :mg="list.totalConsumableWeight">{{
                            displayWeight(list.totalConsumableWeight, library.totalUnit)
                        }}</span>
                        <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                    </span>
                </li>
                <li v-if="list.totalWornWeight" data-weight-type="worn" class="lpRow lpFooter lpBreakdown lpWornWeight">
                    <span class="lpCell" />
                    <span class="lpCell lpSubtotal"> Worn </span>
                    <span v-if="library.optionalFields['price']" class="lpCell lpNumber" />
                    <span class="lpCell lpNumber lpSubtotal">
                        <span class="lpDisplaySubtotal" :mg="list.totalWornWeight">{{
                            displayWeight(list.totalWornWeight, library.totalUnit)
                        }}</span>
                        <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                    </span>
                </li>
                <li
                    v-if="list.totalWornWeight || list.totalConsumableWeight"
                    data-weight-type="base"
                    class="lpRow lpFooter lpBreakdown lpBaseWeight"
                >
                    <span class="lpCell" />
                    <span
                        class="lpCell lpSubtotal"
                        :title="
                            displayWeight(list.totalPackWeight, library.totalUnit) +
                            ' ' +
                            library.totalUnit +
                            ' pack weight (consumable + base weight)'
                        "
                    >
                        Base Weight
                    </span>
                    <span v-if="library.optionalFields['price']" class="lpCell lpNumber" />
                    <span class="lpCell lpNumber lpSubtotal">
                        <span
                            class="lpDisplaySubtotal"
                            :mg="list.totalBaseWeight"
                            :title="
                                displayWeight(list.totalPackWeight, library.totalUnit) +
                                ' ' +
                                library.totalUnit +
                                ' pack weight (consumable + base weight)'
                            "
                        >
                            {{ displayWeight(list.totalBaseWeight, library.totalUnit) }}
                        </span>
                        <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                    </span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import colorPicker from './colorpicker.vue';
import unitSelect from './unit-select.vue';
import donutChart from './donut-chart.vue';

import utilsMixin from '../mixins/utils-mixin.js';
import colorUtils from '../utils/color.js';

export default {
    name: 'ListSummary',
    components: {
        colorPicker,
        unitSelect,
        donutChart,
    },
    mixins: [utilsMixin],
    props: {
        list: {
            type: Object,
        },
    },
    data() {
        return {
            hoveredCategoryId: null,
        };
    },
    computed: {
        library() {
            return this.$store.library;
        },
        categories() {
            return this.list.categoryIds.map((id, i) => {
                const category = this.library.getCategoryById(id);
                category.activeHover = this.hoveredCategoryId === category.id;
                category.displayColor = colorUtils.rgbToString(category.color || colorUtils.getColor(i));
                return category;
            });
        },
    },
    methods: {
        setTotalUnit(unit) {
            this.$store.setTotalUnit(unit);
        },
        updateColor(category, color) {
            category.color = colorUtils.hexToRgb(color);
            category.displayColor = colorUtils.rgbToString(category.color);
            this.$store.updateCategoryColor(category);
        },
        colorToHex(color) {
            return colorUtils.rgbToHex(colorUtils.stringToRgb(color));
        },
    },
};
</script>

<style lang="scss">
.lpLegend {
    &:hover {
        border-color: #666;
        cursor: pointer;
    }
}
</style>
