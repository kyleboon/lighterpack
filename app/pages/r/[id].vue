<template>
    <div v-if="library && list" class="lp-share-page">
        <!-- ── Top bar: wordmark + sign-in / copy ──── -->
        <header class="lp-share-topbar">
            <NuxtLink to="/welcome" class="lp-share-wordmark">LighterPack</NuxtLink>
            <div class="lp-share-topbar-right">
                <template v-if="loggedIn">
                    <button class="lp-share-copy-btn" @click="showCopyConfirm = true">Copy to my account</button>
                </template>
                <ClientOnly v-else>
                    <signin-form :callback-u-r-l="`/r/${route.params.id}`" class="lp-share-signin" />
                </ClientOnly>
            </div>
        </header>

        <!-- ── Main content ──── -->
        <div class="lpList">
            <ListComponent :readonly="true" />
        </div>

        <!-- ── Copy confirmation modal ──── -->
        <div v-if="showCopyConfirm" class="lp-copy-overlay" @click.self="showCopyConfirm = false">
            <div class="lp-copy-modal">
                <h3>Copy this list?</h3>
                <p>
                    Copy <strong>{{ list.name || 'this list' }}</strong> to your account? This will add {{ totalItems }}
                    {{ totalItems === 1 ? 'item' : 'items' }} to your library.
                </p>
                <div class="lp-copy-modal-actions">
                    <button class="lp-copy-modal-cancel" @click="showCopyConfirm = false">Cancel</button>
                    <button class="lp-copy-modal-confirm" :disabled="copying" @click="copyList">
                        <template v-if="copying">Copying…</template>
                        <template v-else>Copy list</template>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- ── Error state ──── -->
    <div v-else-if="error" class="lp-share-page lp-share-error">
        <p>{{ error.message || 'List not found.' }}</p>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLighterpackStore } from '~/store/store';
import ListComponent from '~/components/list.vue';
import SigninForm from '~/components/signin-form.vue';

defineOptions({ name: 'SharePage' });

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

const route = useRoute();
const router = useRouter();
const store = useLighterpackStore();

const showCopyConfirm = ref(false);
const copying = ref(false);

// ── SSR data loading ────────────────────────────────────────────────────
// Fetch share data (runs on both server and client via useAsyncData).
// Hydrate the Pinia store client-side only — Library class instances
// can't be serialized by devalue for SSR payload transfer.
const { data: shareData, error } = await useAsyncData('share', () => $fetch(`/api/share/${route.params.id}`));

if (import.meta.client && shareData.value) {
    store.loadShareData(shareData.value.library, shareData.value.externalId);
}

onMounted(() => {
    if (shareData.value && !store.library) {
        store.loadShareData(shareData.value.library, shareData.value.externalId);
    }
});

// ── Computed properties ─────────────────────────────────────────────────
const library = computed(() => store.library || null);
const list = computed(() => store.activeList);
const loggedIn = computed(() => store.loggedIn);

const totalItems = computed(() => {
    if (!list.value) return 0;
    const cats = list.value.categoryIds.map((id) => library.value.getCategoryById(id)).filter(Boolean);
    return cats.reduce((sum, c) => sum + (c.categoryItems?.length || 0), 0);
});

// ── SEO meta ────────────────────────────────────────────────────────────
// Use shareData directly for SSR meta (avoids needing Library in Pinia during SSR)
const shareListName = computed(() => {
    if (list.value?.name) return list.value.name;
    // Fallback to raw share data for SSR
    if (!shareData.value) return 'Shared List';
    const lists = shareData.value.library?.lists || [];
    const match = lists.find((l) => l.external_id === shareData.value.externalId);
    return match?.name || 'Shared List';
});

const shareItemCount = computed(() => {
    if (!shareData.value) return 0;
    const cats = shareData.value.library?.categories || [];
    const items = shareData.value.library?.categoryItems || [];
    const listObj = (shareData.value.library?.lists || []).find((l) => l.external_id === shareData.value.externalId);
    if (!listObj) return 0;
    const catIds = new Set(cats.filter((c) => c.list_id === listObj.id).map((c) => c.id));
    return items.filter((i) => catIds.has(i.category_id)).length;
});

const shareCategoryCount = computed(() => {
    if (!shareData.value) return 0;
    const cats = shareData.value.library?.categories || [];
    const listObj = (shareData.value.library?.lists || []).find((l) => l.external_id === shareData.value.externalId);
    if (!listObj) return 0;
    return cats.filter((c) => c.list_id === listObj.id).length;
});

const shareDescription = computed(() => {
    const items = shareItemCount.value;
    if (items === 0) return 'A gear list shared on LighterPack.';
    return `A ${items}-item gear list shared on LighterPack.`;
});

useSeoMeta({
    title: () => `${shareListName.value} - LighterPack`,
    description: shareDescription,
    ogType: 'website',
    ogTitle: () => `${shareListName.value} - LighterPack`,
    ogDescription: shareDescription,
    twitterCard: 'summary_large_image',
    twitterTitle: () => `${shareListName.value} - LighterPack`,
    twitterDescription: shareDescription,
});

useSchemaOrg([
    defineItemList({
        name: shareListName,
        numberOfItems: shareItemCount,
    }),
]);

defineOgImage('OgImageDefault', {
    title: shareListName,
    description: shareDescription,
    itemCount: shareItemCount,
    categoryCount: shareCategoryCount,
});

// ── Copy list to authenticated user's account ───────────────────────────
async function copyList() {
    copying.value = true;
    try {
        await $fetch('/api/library/copy-list', {
            method: 'POST',
            body: { externalId: route.params.id },
        });
        await store._reloadLibrary();
        router.push('/');
    } catch (err) {
        store.globalAlerts.push({ message: err?.data?.message || 'Failed to copy list.' });
    } finally {
        copying.value = false;
        showCopyConfirm.value = false;
    }
}
</script>

<style>
.lp-share-page {
    --amber-400: #e8a220;
    --amber-600: #c07a0a;
    --stone-50: #fafaf7;
    --stone-100: #f3f2ee;
    --stone-200: #e8e7e2;
    --stone-300: #d0cfc9;
    --font-display: 'DM Serif Display', georgia, serif;
    --font-ui: 'Figtree', system-ui, sans-serif;

    background: var(--stone-50);
    min-height: 100vh;
}

/* ── Top bar ───────────────────────────────────────────────────────────── */
.lp-share-topbar {
    align-items: center;
    background: #fff;
    border-bottom: 1px solid var(--stone-200);
    display: flex;
    justify-content: space-between;
    padding: 10px 24px;
}

.lp-share-wordmark {
    color: #1e1e1c;
    font-family: var(--font-display);
    font-size: 20px;
    text-decoration: none;

    &:hover {
        color: var(--amber-600);
    }
}

.lp-share-topbar-right {
    align-items: center;
    display: flex;
    gap: 12px;
}

/* Compact inline sign-in form in topbar */
.lp-share-signin {
    .signin {
        align-items: center;
        flex-direction: row;
        gap: 8px;
    }

    .lpFields {
        margin: 0;
    }

    .email {
        font-size: 13px;
        padding: 6px 10px;
        width: 200px;
    }

    .lpButtons {
        margin: 0;
    }

    .lpButton {
        font-size: 13px;
        padding: 6px 14px;
        white-space: nowrap;
    }

    .lpSuccess {
        font-size: 12px;
        padding: 6px 10px;
    }
}

.lp-share-copy-btn {
    background: var(--amber-400);
    border: none;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    white-space: nowrap;

    &:hover {
        background: var(--amber-600);
    }
}

/* ── Main content area ─────────────────────────────────────────────────── */
.lp-share-page > .lpList {
    margin: 0 auto;
    max-width: 960px;
    padding: 24px 16px;
}

/* ── Copy confirmation modal ───────────────────────────────────────────── */
.lp-copy-overlay {
    align-items: center;
    background: rgb(0 0 0 / 40%);
    display: flex;
    inset: 0;
    justify-content: center;
    position: fixed;
    z-index: 100;
}

.lp-copy-modal {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgb(0 0 0 / 18%);
    max-width: 400px;
    padding: 28px 32px;
    width: 90%;

    h3 {
        font-family: var(--font-display);
        font-size: 20px;
        margin: 0 0 8px;
    }

    p {
        color: #555;
        font-family: var(--font-ui);
        font-size: 14px;
        line-height: 1.5;
        margin: 0 0 20px;
    }
}

.lp-copy-modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.lp-copy-modal-cancel {
    background: transparent;
    border: 1px solid var(--stone-300);
    border-radius: 6px;
    color: #555;
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 13px;
    padding: 8px 16px;

    &:hover {
        background: var(--stone-100);
    }
}

.lp-copy-modal-confirm {
    background: var(--amber-400);
    border: none;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;

    &:hover {
        background: var(--amber-600);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
}

/* ── Error state ───────────────────────────────────────────────────────── */
.lp-share-error {
    align-items: center;
    display: flex;
    font-family: var(--font-ui);
    justify-content: center;
    min-height: 60vh;

    p {
        color: #555;
        font-size: 16px;
    }
}

@media only screen and (width < 600px) {
    .lp-share-topbar {
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 12px;
    }

    .lp-share-page > .lpList {
        padding: 16px 12px;
    }

    .lp-copy-modal {
        max-height: 80vh;
        overflow-y: auto;
        width: calc(100vw - 24px);
    }
}
</style>
