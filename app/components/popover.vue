<template>
    <div
        v-click-outside="hide"
        :id="id"
        :class="{ 'lp-popover': true, lpPopover: true, 'is-shown': shown, lpPopoverShown: shown }"
    >
        <div class="lp-popover-target lpTarget">
            <slot name="target" />
        </div>
        <div
            ref="contentRef"
            class="lp-popover-content lpContent"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="labelId"
        >
            <slot name="content" />
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onBeforeMount, onBeforeUnmount } from 'vue';
import { useFocusTrap } from '../composables/useFocusTrap';

defineOptions({ name: 'Popover' });

const props = defineProps({
    id: {
        type: String,
        default: null,
    },
    shown: {
        type: Boolean,
        required: true,
    },
    labelId: {
        type: String,
        default: undefined,
    },
});

const emit = defineEmits(['hide']);
const contentRef = ref(null);
const focusTrap = useFocusTrap();

function hide() {
    emit('hide');
}

watch(
    () => props.shown,
    (val) => {
        if (val && contentRef.value) {
            focusTrap.activate(contentRef.value);
        } else if (!val) {
            focusTrap.deactivate();
        }
    },
);

function closeOnEscape(evt) {
    if (props.shown && evt.keyCode === 27) {
        hide();
    }
}

onBeforeMount(() => window.addEventListener('keyup', closeOnEscape));
onBeforeUnmount(() => window.removeEventListener('keyup', closeOnEscape));
</script>

<style>
/* ================================================================
   Popover — floating content panel anchored to a trigger
   ================================================================ */

.lp-popover {
    display: block;
    position: relative;
}

.lp-popover-target {
    cursor: default;
    display: inline-block;

    /* Extend hit area downward to cover the gap to the panel */
    margin-bottom: -8px;
    padding-bottom: 8px;
    position: relative;
}

.lp-popover-content {
    background: #fafaf7;
    border: 0.5px solid #d0cfc9;
    border-radius: 10px;
    left: 50%;
    min-width: 100%;
    opacity: 0;
    padding: 12px;
    pointer-events: none;
    position: absolute;
    top: calc(100% + 8px);
    transform: translateX(-50%) translateY(-4px);
    transition:
        opacity 140ms ease,
        transform 140ms ease;
    white-space: nowrap;
    z-index: 100;

    /* Upward-pointing arrow */
    &::before {
        background: #fafaf7;
        border-left: 0.5px solid #d0cfc9;
        border-top: 0.5px solid #d0cfc9;
        content: '';
        display: block;
        height: 8px;
        left: 50%;
        margin-left: -4px;
        position: absolute;
        top: -4.5px;
        transform: rotate(45deg);
        width: 8px;
    }

    > *:first-child {
        margin-top: 0;
    }

    > *:last-child {
        margin-bottom: 0;
    }
}

/* Shown state */
.lp-popover.is-shown {
    .lp-popover-target {
        z-index: 101;
    }

    .lp-popover-content {
        opacity: 1;
        pointer-events: all;
        transform: translateX(-50%) translateY(0);
    }
}
</style>
