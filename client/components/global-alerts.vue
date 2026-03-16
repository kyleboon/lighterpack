<template>
    <ul v-if="store.globalAlerts && store.globalAlerts.length" class="lpGlobalAlerts">
        <li v-for="alert in store.globalAlerts" :key="alert.message" class="lpGlobalAlert">
            {{ alert.message }}
        </li>
    </ul>
</template>

<script setup>
import { useLighterpackStore } from '../store/store.js';

defineOptions({ name: 'GlobalAlerts' });

const store = useLighterpackStore();
</script>

<style lang="scss">
@use '../css/globals' as *;

.lpGlobalAlerts {
    background: $yellow1;
    border: 1px solid $darkYellow;
    border-radius: 0 0 10px 10px;
    border-top: none;
    left: 50%;
    margin: 0;
    padding: 0;
    position: fixed;
    text-align: center;
    top: 0;
    transform: translateX(-50%);
    width: 50%;
    z-index: $aboveDialog;
}

.lpGlobalAlert {
    border-bottom: 1px solid $darkYellow;
    list-style-type: none;
    margin: 0;
    padding: $spacingMedium;

    &:last-child {
        border-bottom: none;
    }
}
</style>
