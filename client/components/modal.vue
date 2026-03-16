<template>
    <div class="lpModalContainer">
        <transition name="lpModal">
            <div v-if="shown" :id="id" class="lpModal">
                <slot />
            </div>
        </transition>
        <transition name="lpModal">
            <div
                v-if="shown"
                :class="{ lpModalOverlay: true, lpBlackout: blackout, lpTransparent: transparentOverlay }"
                @click="hide"
            />
        </transition>
    </div>
</template>

<script setup>
import { onBeforeMount, onBeforeUnmount } from 'vue';

defineOptions({ name: 'Modal' });

const props = defineProps({
    id: {
        type: String,
        default: null,
    },
    shown: {
        type: Boolean,
        required: true,
    },
    blackout: {
        type: Boolean,
        default: false,
    },
    transparentOverlay: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['hide']);

function hide() {
    emit('hide');
}

function closeOnEscape(evt) {
    if (props.shown && evt.keyCode === 27) {
        hide();
    }
}

onBeforeMount(() => window.addEventListener('keyup', closeOnEscape));
onBeforeUnmount(() => window.removeEventListener('keyup', closeOnEscape));
</script>

<style lang="scss">
@use '../css/globals' as *;

.lpModal {
    background: $background1;
    box-shadow: 0 0 30px rgb(0 0 0 / 25%);
    left: 50%;
    max-height: calc(90% - (#{$spacingLarge} * 2));
    overflow-y: auto;
    padding: $spacingLarge;
    position: fixed;
    text-align: left;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    transition: all $transitionDuration;
    width: 420px;
    z-index: $dialog;

    .lpHalf {
        padding: 0 20px;

        &:first-child {
            padding-left: 0;
        }

        &:last-child {
            padding-right: 0;
        }
    }

    p {
        margin: 5px 0 10px;
    }

    ul {
        padding-left: 15px;
    }

    .lpContent {
        max-height: 400px;
        overflow-y: scroll;
    }
}

.lpModalHeader {
    align-items: baseline;
    display: flex;
    justify-content: space-between;
}

.lpModalOverlay {
    background: rgb(0 0 0 / 50%);
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    transition: all $transitionDuration;
    width: 100%;
    z-index: $belowDialog;

    &.lpBlackout {
        animation: none;
        background: url('/images/lp_bg2.jpg') 50% 50%;
        background-size: cover;
        opacity: 1;
    }

    &.lpTransparent {
        background: rgb(0 0 0 / 1%);
    }
}

.lpModal-enter,
.lpModal-leave-active {
    opacity: 0;

    &.lpModal {
        transform: translateX(-50%) translateY(-50%) scale(0.95);
    }
}
</style>
