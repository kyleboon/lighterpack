<template>
    <span class="lp-spinner" role="status" aria-label="Loading">
        <span class="lp-spinner-ring" />
    </span>
</template>

<script setup>
defineOptions({ name: 'Spinner' });
</script>

<style lang="scss">
@keyframes lp-spin {
    to {
        transform: rotate(360deg);
    }
}

.lp-spinner {
    align-items: center;
    display: inline-flex;
    justify-content: center;
}

.lp-spinner-ring {
    animation: lp-spin 0.65s linear infinite;
    border: 1.5px solid rgba(232, 162, 32, 0.25);
    border-radius: 50%;
    border-top-color: #e8a220;
    display: block;
    height: 18px;
    width: 18px;

    @media (prefers-reduced-motion: reduce) {
        animation-duration: 2s;
    }
}

/* Inside a button — white ring on amber background */
.lp-btn .lp-spinner {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);

    .lp-spinner-ring {
        border-color: rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        height: 14px;
        width: 14px;
    }
}
</style>
