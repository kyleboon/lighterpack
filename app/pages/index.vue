<template>
    <div v-if="isLoaded" id="main" class="lpHasSidebar">
        <a href="#main-content" class="skip-link">Skip to main content</a>

        <div class="lp-mobile-topbar">
            <button class="lp-hamburger" aria-label="Toggle sidebar" @click="toggleSidebar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor" />
                    <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor" />
                    <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor" />
                </svg>
            </button>
            <span class="lp-mobile-wordmark">LighterPack</span>
        </div>

        <div class="lp-sidebar-backdrop" @click="closeSidebar" />
        <sidebar />

        <main id="main-content" class="lpList">
            <list />
        </main>

        <globalAlerts />
        <speedbump />
        <ImportCsv />
        <itemImage />
        <itemViewImage />
        <itemLink />
        <account />
        <accountDelete />

        <div id="lp-announce" class="visually-hidden" aria-live="polite" role="status" />
    </div>
</template>

<script setup>
import { ref, watch, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { useLighterpackStore } from '~/store/store';

defineOptions({ name: 'Dashboard' });

useHead({
    link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600&display=swap',
        },
    ],
});

const store = useLighterpackStore();
const router = useRouter();

const isLoaded = ref(false);

onBeforeMount(() => {
    if (!store.library) {
        router.push('/welcome');
    } else {
        isLoaded.value = true;
    }
});

function toggleSidebar() {
    const main = document.getElementById('main');
    if (main) {
        main.classList.toggle('lpSidebarOpen');
    }
}

function closeSidebar() {
    const main = document.getElementById('main');
    if (main) {
        main.classList.remove('lpSidebarOpen');
    }
}

// Close sidebar when the active list changes (user tapped a list link on mobile)
watch(
    () => store.library?.defaultListId,
    () => {
        if (window.matchMedia('(max-width: 899px)').matches) {
            closeSidebar();
        }
    },
);
</script>

<style></style>
