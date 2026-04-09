<template>
    <div class="lp-modal-container">
        <transition name="lp-modal" @after-enter="onAfterEnter" @after-leave="onAfterLeave">
            <div
                v-if="shown"
                ref="modalRef"
                :id="id"
                class="lp-modal"
                role="dialog"
                aria-modal="true"
                :aria-labelledby="labelId"
            >
                <slot />
            </div>
        </transition>
        <transition name="lp-modal">
            <div
                v-if="shown"
                class="lp-modal-overlay"
                :class="{ 'is-transparent': transparentOverlay }"
                @click="hide"
            />
        </transition>
    </div>
</template>

<script setup>
import { ref, onBeforeMount, onBeforeUnmount } from 'vue';
import { useFocusTrap } from '../composables/useFocusTrap';

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
    labelId: {
        type: String,
        default: undefined,
    },
});

const emit = defineEmits(['hide']);
const modalRef = ref(null);
const focusTrap = useFocusTrap();

function hide() {
    emit('hide');
}

function onAfterEnter() {
    if (modalRef.value) {
        focusTrap.activate(modalRef.value);
    }
}

function onAfterLeave() {
    focusTrap.deactivate();
}

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
   Modal
   Tokens follow docs/styleguide/tokens/tokens.css
   ================================================================ */

.lp-modal {
    --stone-50: #fafaf7;
    --stone-300: #d0cfc9;
    --font-ui: 'Figtree', system-ui, sans-serif;
    --font-display: 'DM Serif Display', georgia, serif;
    --radius-xl: 14px;
    --space-8: 32px;

    background: var(--stone-50);
    border: 0.5px solid var(--stone-300);
    border-radius: var(--radius-xl);
    left: 50%;
    max-height: calc(90vh - 64px);
    overflow-y: auto;
    padding: var(--space-8);
    position: fixed;
    text-align: left;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    width: 420px;
    z-index: 100;

    h2 {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 400;
        letter-spacing: -0.01em;
        margin: 0 0 20px;
    }

    p {
        color: #5a5954;
        font-family: var(--font-ui);
        font-size: 13px;
        line-height: 1.6;
        margin: 0 0 12px;
    }

    ul {
        padding-left: 16px;
    }
}

.lp-modal-overlay {
    background: rgb(30 30 28 / 50%);
    height: 100%;
    inset: 0;
    position: fixed;
    z-index: 90;

    &.is-transparent {
        background: rgb(30 30 28 / 1%);
    }
}

/* ── Transition ─────────────────────────────────────────────── */
.lp-modal-enter-active,
.lp-modal-leave-active {
    transition: opacity 160ms ease;

    &.lp-modal {
        transition:
            opacity 160ms ease,
            transform 160ms ease;
    }

    @media (prefers-reduced-motion: reduce) {
        transition-duration: 0.01ms !important;
    }
}

.lp-modal-enter-from,
.lp-modal-leave-to {
    opacity: 0;

    &.lp-modal {
        transform: translateX(-50%) translateY(-50%) scale(0.97);
    }
}

/* ── Legacy class forwarding (used by child modal components) ── */
.lpFields {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;

    input,
    select,
    textarea {
        background: #fafaf7;
        border: 0.5px solid #d0cfc9;
        border-radius: 6px;
        color: #1e1e1c;
        font-family: Figtree, system-ui, sans-serif;
        font-size: 13px;
        height: 36px;
        outline: none;
        padding: 0 10px;
        transition: border-color 120ms ease;
        width: 100%;

        &:focus {
            border-color: #e8a220;
        }

        &::placeholder {
            color: #a8a79f;
        }
    }

    textarea {
        height: auto;
        min-height: 80px;
        padding: 8px 10px;
        resize: vertical;
    }
}

.lpButtons {
    align-items: center;
    display: flex;
    gap: 12px;
    margin-top: 20px;
}

.lpButton {
    align-items: center;
    background: #e8a220;
    border: none;
    border-radius: 6px;
    color: #1e1e1c;
    cursor: pointer;
    display: inline-flex;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    height: 34px;
    justify-content: center;
    padding: 0 16px;
    transition: background-color 120ms ease;

    &:hover {
        background: #c07a0a;
        color: #fff;
    }

    &:focus-visible {
        outline: 2px solid #e8a220;
        outline-offset: 2px;
    }

    &:active {
        transform: scale(0.98);
    }

    &.lpButtonDisabled,
    &[disabled] {
        background: #e8e7e2;
        color: #a8a79f;
        cursor: not-allowed;
        pointer-events: none;
    }
}

.lpWarning {
    background: #fdf0d5;
    border: 0.5px solid #c07a0a;
    border-radius: 6px;
    color: #8a520a;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 13px;
    margin-bottom: 14px;
    padding: 10px 12px;
}

.lpHref {
    color: #4d84b4;
    cursor: pointer;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 13px;
    text-decoration: none;
    transition: color 120ms ease;

    &:hover {
        color: #2e5f88;
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}
</style>
