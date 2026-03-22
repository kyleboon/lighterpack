<template>
    <select
        class="lp-unit-select"
        :value="unit"
        :aria-label="`Weight unit: ${unit}`"
        @change="handleChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
    >
        <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
    </select>
</template>

<script setup>
import { ref } from 'vue';

defineOptions({ name: 'UnitSelect' });

const props = defineProps({
    weight: {
        type: Number,
        default: 0,
    },
    unit: {
        type: String,
        default: null,
    },
    onChange: {
        type: Function,
        default: null,
    },
});

const units = ['oz', 'lb', 'g', 'kg'];
const isOpen = ref(false);
const isFocused = ref(false);

function handleChange(evt) {
    if (typeof props.onChange === 'function') {
        props.onChange(evt.target.value);
    }
}

/* Keep stubs for any test/external code that calls these */
function open() {
    isOpen.value = true;
}
function close() {
    isOpen.value = false;
}
function select(u) {
    if (typeof props.onChange === 'function') props.onChange(u);
}

defineExpose({ isOpen, isFocused, select, close, open });
</script>

<style lang="scss">
.lp-unit-select {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #5a5954;
    cursor: pointer;
    font-family: 'DM Mono', 'Fira Mono', monospace;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    outline: none;
    padding: 1px 2px;
    transition:
        color 120ms ease,
        background-color 120ms ease;

    &:hover {
        color: #1e1e1c;
    }

    &:focus-visible {
        background: #f3f2ee;
        border-radius: 4px;
        color: #1e1e1c;
        outline: 2px solid #e8a220;
        outline-offset: 1px;
    }

    option {
        font-family: 'DM Mono', monospace;
    }
}

/* Legacy selector still used by some global CSS */
.lpUnit {
    @extend .lp-unit-select;
}
</style>
