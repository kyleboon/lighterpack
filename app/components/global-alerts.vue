<template>
    <div
        v-if="store.globalAlerts && store.globalAlerts.length"
        class="lp-global-alerts"
        role="status"
        aria-live="polite"
        aria-atomic="true"
    >
        <div v-for="alert in store.globalAlerts" :key="alert.message" class="lp-global-alert">
            <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M7 1.5L12.5 11H1.5L7 1.5Z" />
                <line x1="7" y1="5.5" x2="7" y2="8" />
                <circle cx="7" cy="9.5" r="0.75" fill="currentColor" stroke="none" />
            </svg>
            {{ alert.message }}
        </div>
    </div>
</template>

<script setup>
import { useLighterpackStore } from '../store/store';

defineOptions({ name: 'GlobalAlerts' });

const store = useLighterpackStore();
</script>

<style lang="scss">
.lp-global-alerts {
    left: 50%;
    max-width: min(480px, 90vw);
    position: fixed;
    top: 0;
    transform: translateX(-50%);
    width: max-content;
    z-index: 110;
}

.lp-global-alert {
    align-items: center;
    background: #fdf0d5;
    border: 0.5px solid #c07a0a;
    border-radius: 0 0 10px 10px;
    border-top: none;
    color: #8a520a;
    display: flex;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    gap: 8px;
    padding: 10px 16px;

    & + & {
        border-radius: 0;
        border-top: 0.5px solid rgb(192 122 10 / 30%);

        &:last-child {
            border-radius: 0 0 10px 10px;
        }
    }

    svg {
        flex-shrink: 0;
    }
}
</style>
