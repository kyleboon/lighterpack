<template>
    <svg
        class="lp-chart"
        viewBox="0 0 260 260"
        width="260"
        height="260"
        @mouseleave="onLeave"
        @click.self="expandedId = null"
    >
        <!-- Outer ring: one slice per category -->
        <path
            v-for="slice in categorySlices"
            :key="slice.id"
            :d="slice.path"
            :fill="slice.fill"
            stroke="#f5f5f5"
            stroke-width="2"
            class="lp-donut-slice"
            :class="{ 'is-expanded': expandedId === slice.id }"
            @mouseenter="onSliceEnter(slice)"
            @click.stop="onCategoryClick(slice)"
        >
            <title>{{ slice.name }}: {{ slice.weight }}</title>
        </path>

        <!-- Inner ring: items within the expanded category -->
        <Transition name="lp-ring">
            <g v-if="expandedId && itemSlices.length">
                <path
                    v-for="(slice, i) in itemSlices"
                    :key="`item-${i}`"
                    :d="slice.path"
                    :fill="slice.fill"
                    stroke="#f5f5f5"
                    stroke-width="1"
                    class="lp-donut-slice"
                    @mouseenter="onSliceEnter(slice)"
                >
                    <title>{{ slice.name }}: {{ slice.weight }}</title>
                </path>
            </g>
        </Transition>

        <!-- Center label shown on hover -->
        <g v-if="hovered" class="lp-center-label">
            <text x="130" y="123" text-anchor="middle" class="lp-center-name">
                {{ truncate(hovered.name) }}
            </text>
            <text x="130" y="140" text-anchor="middle" class="lp-center-weight">
                {{ hovered.weight }}
            </text>
        </g>
    </svg>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import colorUtils from '../utils/color.js';
import weightUtils from '../utils/weight.js';

defineOptions({ name: 'DonutChart' });

const props = defineProps({
    categories: {
        type: Array,
        default: null,
    },
    totalWeight: {
        type: Number,
        default: 0,
    },
    library: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(['category-hover']);

const CX = 130;
const CY = 130;
const CAT_INNER = 70;
const CAT_OUTER = 120;
const CAT_EXPANDED_INNER = 25;
const CAT_EXPANDED_OUTER = 65;
const ITEM_INNER = 70;
const ITEM_OUTER = 120;

/**
 * @param {number} innerR
 * @param {number} outerR
 * @param {number} startAngle
 * @param {number} endAngle
 * @returns {string}
 */
function segmentPath(innerR, outerR, startAngle, endAngleIn) {
    const endAngle = endAngleIn - startAngle >= Math.PI * 2 ? startAngle + Math.PI * 2 - 0.0001 : endAngleIn;
    const x1 = CX + outerR * Math.cos(startAngle);
    const y1 = CY + outerR * Math.sin(startAngle);
    const x2 = CX + outerR * Math.cos(endAngle);
    const y2 = CY + outerR * Math.sin(endAngle);
    const x3 = CX + innerR * Math.cos(endAngle);
    const y3 = CY + innerR * Math.sin(endAngle);
    const x4 = CX + innerR * Math.cos(startAngle);
    const y4 = CY + innerR * Math.sin(startAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

const expandedId = ref(null);
const hovered = ref(null);

const categorySlices = computed(() => {
    if (!props.totalWeight) return [];
    const innerR = expandedId.value ? CAT_EXPANDED_INNER : CAT_INNER;
    const outerR = expandedId.value ? CAT_EXPANDED_OUTER : CAT_OUTER;
    let angle = -Math.PI / 2;
    return props.categories
        .filter((cat) => cat.subtotalWeight > 0)
        .map((cat, i) => {
            const catColor = cat.color || colorUtils.getColor(i);
            const fill = colorUtils.rgbToString(catColor);
            const span = (cat.subtotalWeight / props.totalWeight) * 2 * Math.PI;
            const path = segmentPath(innerR, outerR, angle, angle + span);
            const weight = `${weightUtils.MgToWeight(cat.subtotalWeight, props.library.totalUnit)} ${props.library.totalUnit}`;
            const slice = { id: cat.id, fill, path, name: cat.name, weight, catColor };
            angle += span;
            return slice;
        });
});

const itemSlices = computed(() => {
    if (!expandedId.value) return [];
    const catIndex = props.categories.findIndex((c) => c.id === expandedId.value);
    const category = props.library.getCategoryById(expandedId.value);
    if (!category || !category.subtotalWeight) return [];
    const catColor = category.color || colorUtils.getColor(catIndex);
    let angle = -Math.PI / 2;
    return category.categoryItems
        .map((ci, i) => {
            const item = props.library.getItemById(ci.itemId);
            if (!item || !item.weight) return null;
            const weight = item.weight * ci.qty;
            const span = (weight / category.subtotalWeight) * 2 * Math.PI;
            const fill = colorUtils.rgbToString(colorUtils.getColor(i, catColor));
            const path = segmentPath(ITEM_INNER, ITEM_OUTER, angle, angle + span);
            const name = ci.qty > 1 ? `${item.name} ×${ci.qty}` : item.name;
            const weightStr = `${weightUtils.MgToWeight(weight, props.library.totalUnit)} ${props.library.totalUnit}`;
            angle += span;
            return { fill, path, name, weight: weightStr };
        })
        .filter(Boolean);
});

watch(
    () => props.categories,
    (newCategories) => {
        if (expandedId.value && !newCategories.find((c) => c.id === expandedId.value)) {
            expandedId.value = null;
        }
    },
);

function onSliceEnter(slice) {
    hovered.value = slice;
    emit('category-hover', slice.id ?? null);
}

function onLeave() {
    hovered.value = null;
    emit('category-hover', null);
}

function onCategoryClick(slice) {
    expandedId.value = expandedId.value === slice.id ? null : slice.id;
}

function truncate(str, max = 18) {
    return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}
</script>

<style lang="scss">
.lp-chart {
    cursor: default;
    display: block;
}

.lp-donut-slice {
    cursor: pointer;
    transition: opacity 0.12s;

    &:hover {
        opacity: 0.8;
    }

    &.is-expanded {
        stroke: #555 !important;
        stroke-width: 3 !important;
    }
}

.lp-center-label {
    pointer-events: none;
    user-select: none;
}

.lp-center-name {
    font-size: 12px;
    font-weight: 600;
    fill: #333;
}

.lp-center-weight {
    font-size: 11px;
    fill: #666;
}

.lp-ring-enter-active,
.lp-ring-leave-active {
    transition: opacity 0.2s;
}

.lp-ring-enter-from,
.lp-ring-leave-to {
    opacity: 0;
}
</style>
