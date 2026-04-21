<template>
    <span class="headerItem hasPopover">
        <PopoverHover id="headerPopover">
            <template #target>
                Signed in as <span class="bw-username">{{ username }}</span>
                <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <path d="M1 1l4 4 4-4" />
                </svg>
            </template>
            <template #content>
                <nav class="bw-account-nav">
                    <a class="bw-account-link" @click="showAccount">Account Settings</a>
                    <a class="bw-account-link" @click="showHelp">Help</a>
                    <a class="bw-account-link bw-account-link--signout" @click="signout">Sign Out</a>
                </nav>
            </template>
        </PopoverHover>
    </span>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBaseweightStore } from '../store/store';
import PopoverHover from './popover-hover.vue';

defineOptions({ name: 'AccountDropdown' });

const store = useBaseweightStore();
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
    router.push('/welcome');
}
</script>

<style>
#headerPopover .bw-popover-content,
#headerPopover .bwContent {
    min-width: 9em;
}

.bw-username {
    font-weight: 600;
}

.bw-account-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.bw-account-link {
    border-radius: 6px;
    color: #5a5954;
    cursor: pointer;
    display: block;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 13px;
    padding: 5px 8px;
    text-decoration: none;
    transition:
        background 120ms ease,
        color 120ms ease;
    white-space: nowrap;

    &:hover {
        background: #f3f2ee;
        color: #1e1e1c;
    }

    &.bw-account-link--signout {
        margin-top: 4px;

        &:hover {
            background: #fef2f0;
            color: #c05848;
        }
    }
}
</style>
