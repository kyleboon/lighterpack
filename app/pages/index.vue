<template>
    <div v-if="isLoaded" id="main" class="lpHasSidebar">
        <a href="#main-content" class="skip-link">Skip to main content</a>
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
import { ref, onBeforeMount } from 'vue';
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
</script>

<style></style>
