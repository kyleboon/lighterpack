<template>
    <Popover id="lpPickerContainer" :shown="shown" @hide="shown = false">
        <template #target>
            <button
                class="lp-color-swatch"
                :style="{ backgroundColor: color }"
                :title="`Change color (${color})`"
                aria-label="Change category color"
                @click="shown = true"
            />
        </template>
        <template #content>
            <input type="color" class="lp-color-input" :value="color" @input="onColorChange" />
        </template>
    </Popover>
</template>

<script setup>
import { ref } from 'vue';
import Popover from './popover.vue';

defineOptions({ name: 'ColorPicker' });

defineProps({
    color: {
        type: String,
        default: null,
    },
});

const emit = defineEmits(['colorChange']);

const shown = ref(false);

function onColorChange(evt) {
    emit('colorChange', evt.target.value);
}

defineExpose({ shown, onColorChange });
</script>

<style lang="scss">
.lp-color-swatch {
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: inline-block;
    flex-shrink: 0;
    height: 12px;
    outline: 2px solid transparent;
    outline-offset: 1px;
    padding: 0;
    transition:
        outline-color 120ms ease,
        transform 120ms ease;
    width: 12px;

    &:hover {
        outline-color: #8a8880;
        transform: scale(1.15);
    }

    &:focus-visible {
        outline-color: #e8a220;
    }
}

/* Also style the old .lpLegend class used by list-summary */
.lpLegend {
    @extend .lp-color-swatch;
}

.lp-color-input {
    cursor: pointer;
    height: 32px;
    padding: 0;
    width: 80px;
}
</style>
