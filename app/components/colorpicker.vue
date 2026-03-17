<template>
    <Popover id="lpPickerContainer" :shown="shown" @hide="shown = false">
        <template #target>
            <span class="lpLegend" :style="{ 'background-color': color }" @click="shown = true" />
        </template>
        <template #content>
            <input type="color" :value="color" @input="onColorChange" />
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

<style lang="scss"></style>
