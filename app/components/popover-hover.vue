<template>
    <Popover :shown="shown" @mouseenter="show" @mouseleave="startHideTimeout">
        <template #target>
            <slot name="target" />
        </template>
        <template #content>
            <slot name="content" />
        </template>
    </Popover>
</template>

<script setup>
import { ref } from 'vue';
import Popover from './popover.vue';

defineOptions({ name: 'PopoverHover' });

const emit = defineEmits(['shown', 'hidden']);

const shown = ref(false);
let hideTimeout = null;

function show() {
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
    shown.value = true;
    emit('shown');
}

function hide() {
    shown.value = false;
    emit('hidden');
}

function startHideTimeout() {
    hideTimeout = setTimeout(hide, 50);
}

defineExpose({ shown, show, hide, startHideTimeout });
</script>
