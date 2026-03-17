<template>
    <span class="headerItem hasPopover">
        <PopoverHover id="headerPopover">
            <template #target
                >Signed in as <span class="username">{{ username }}</span> <i class="lpSprite lpExpand"
            /></template>
            <template #content>
                <a class="lpHref accountSettings" @click="showAccount">Account Settings</a><br />
                <a class="lpHref" @click="showHelp">Help</a><br />
                <a class="lpHref signout" @click="signout">Sign Out</a>
            </template>
        </PopoverHover>
    </span>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLighterpackStore } from '../store/store.js';
import PopoverHover from './popover-hover.vue';

defineOptions({ name: 'AccountDropdown' });

const store = useLighterpackStore();
const router = useRouter();

const username = computed(() => store.loggedIn);

function showAccount() {
    store.showModal('account');
}

function showHelp() {
    store.showModal('help');
}

function signout() {
    store.signout();
    router.push('/signin');
}
</script>

<style lang="scss">
#headerPopover .lpContent {
    min-width: 9em;
}
</style>
