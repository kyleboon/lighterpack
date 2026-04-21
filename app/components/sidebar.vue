<template>
    <aside id="sidebar" aria-label="Navigation sidebar">
        <div id="scrollable">
            <libraryLists />
            <libraryItems />
        </div>

        <footer v-if="isSignedIn" class="lp-sidebar-footer">
            <button class="lp-sidebar-footer-link" @click="showAccount">Account settings</button>
            <button class="lp-sidebar-footer-link lp-sidebar-footer-signout" @click="signout">Sign out</button>
        </footer>
    </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLighterpackStore } from '../store/store';
import libraryItems from './library-items.vue';
import libraryLists from './library-lists.vue';

defineOptions({ name: 'Sidebar' });

const store = useLighterpackStore();
const router = useRouter();

const isSignedIn = computed(() => store.loggedIn);

function showAccount() {
    store.showModal('account');
}

function signout() {
    store.signout();
    router.push('/welcome');
}
</script>

<style>
/* ================================================================
   Sidebar shell
   Tokens follow docs/styleguide/tokens/tokens.css
   ================================================================ */

#sidebar {
    /* ── Design tokens ──────────────────────────────────────── */
    --charcoal-900: #252523;
    --charcoal-800: #2f2f2c;
    --charcoal-700: #3b3b37;
    --charcoal-500: #5a5954;
    --charcoal-300: #8a8880;
    --charcoal-100: #c8c6bc;
    --amber-400: #e8a220;
    --amber-600: #c07a0a;
    --font-ui: 'Figtree', system-ui, sans-serif;
    --font-display: 'DM Serif Display', georgia, serif;
    --font-mono: 'DM Mono', 'Fira Mono', monospace;
    --radius-md: 6px;
    --radius-sm: 4px;
    --transition-fast: 120ms ease;

    /* ── Layout ─────────────────────────────────────────────── */
    background: var(--charcoal-900);
    border-right: 0.5px solid var(--charcoal-700);
    color: var(--charcoal-100);
    display: flex;
    flex-direction: column;
    height: 100vh;
    left: 0;
    position: fixed;
    top: 0;
    transform: translateX(-280px);
    transition: transform 240ms ease;
    width: 280px;
    z-index: 20;

    .lpHasSidebar & {
        transform: translateX(0);
    }
}

/* ── Scrollable inner ───────────────────────────────────────── */
#scrollable {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 28px;
    min-height: 0;
    overflow-y: auto;
    padding: 20px 16px 16px;
    scrollbar-color: var(--charcoal-700) transparent;
    scrollbar-width: thin;
}

/* ── Footer ─────────────────────────────────────────────────── */
.lp-sidebar-footer {
    border-top: 0.5px solid var(--charcoal-700);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 1px;
    padding: 10px 10px 14px;
}

.lp-sidebar-footer-link {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--charcoal-500);
    cursor: pointer;
    display: flex;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 400;
    padding: 5px 8px;
    text-align: left;
    transition:
        color var(--transition-fast),
        background-color var(--transition-fast);
    width: 100%;

    &:hover {
        background-color: var(--charcoal-800);
        color: var(--charcoal-300);
    }

    &:focus-visible {
        outline: 2px solid var(--amber-400);
        outline-offset: 2px;
    }

    &.lp-sidebar-footer-signout:hover {
        color: #c87171;
    }
}

/* ── Responsive: sidebar drawer ────────────────────────────────── */
@media only screen and (width < 900px) {
    #sidebar {
        z-index: 40;

        .lpHasSidebar & {
            transform: translateX(-280px);
        }

        .lpSidebarOpen & {
            transform: translateX(0);
        }
    }

    /* Hide gear library on mobile — desktop only feature */
    .lp-library-section {
        display: none;
    }
}
</style>
