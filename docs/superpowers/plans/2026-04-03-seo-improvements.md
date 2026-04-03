# SEO Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive SEO support (sitemap, robots.txt, OG images, structured data, canonical links, meta tags) using the `@nuxtjs/seo` module suite.

**Architecture:** Install `@nuxtjs/seo` which bundles sitemap, robots, og-image, schema-org, and link-checker. Make `/welcome` SSR. Add dynamic OG image generation for share pages. Add structured data via `nuxt-schema-org` composables.

**Tech Stack:** `@nuxtjs/seo`, `nuxt-og-image` (Satori), `nuxt-schema-org`, Nuxt 4, Vue 3, Drizzle ORM/SQLite

---

### Task 1: Install `@nuxtjs/seo` and configure `nuxt.config.ts`

**Files:**

- Modify: `package.json`
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Install the module**

Run:

```bash
npm install @nuxtjs/seo
```

- [ ] **Step 2: Update `nuxt.config.ts` — add module, site config, welcome SSR rule, global head meta**

Replace the current `nuxt.config.ts` content with:

```typescript
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
    runtimeConfig: {
        enableTestEndpoints: process.env.ENABLE_TEST_ENDPOINTS === 'true',
        disableRateLimiting: process.env.DISABLE_RATE_LIMITING === 'true',
    },
    modules: ['@pinia/nuxt', '@nuxtjs/seo'],
    site: {
        url: process.env.PUBLIC_URL || 'http://localhost:3000',
        name: 'LighterPack',
    },
    app: {
        rootId: 'lp',
        head: {
            title: 'LighterPack',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'description', content: 'Track your gear weight for hiking, backpacking, and adventures' },
            ],
        },
    },
    robots: {
        disallow: ['/', '/signin', '/api/'],
        allow: ['/welcome', '/r/'],
    },
    sitemap: {
        excludeAppSources: true,
    },
    ogImage: {
        defaults: {
            width: 1200,
            height: 630,
        },
    },
    nitro: {
        alias: {
            '#shared': resolve(__dirname, 'shared'),
        },
        externals: {
            external: ['better-sqlite3'],
        },
    },
    vite: {
        resolve: {
            alias: {
                '#shared': resolve(__dirname, 'shared'),
            },
        },
    },
    ssr: true,
    routeRules: {
        '/welcome': { ssr: true },
        '/r/**': { ssr: true },
        '/**': { ssr: false },
    },
    css: ['~/assets/css/lighterpack.css'],
    typescript: {
        tsConfig: {
            compilerOptions: {
                noUncheckedIndexedAccess: false,
            },
        },
    },
});
```

Key changes from the original:

- Added `'@nuxtjs/seo'` to modules
- Added `site` config with `url` and `name`
- Added `charset`, `viewport`, and `description` to global head meta
- Added `robots` config to disallow auth pages and API, allow public pages
- Added `sitemap` config with `excludeAppSources: true` (we provide URLs manually via a server endpoint)
- Added `ogImage` defaults
- Added `/welcome` SSR route rule (before the `/**` catch-all)

- [ ] **Step 3: Verify the app starts**

Run:

```bash
npm run dev
```

Expected: App starts without errors. Visit `http://localhost:3000/robots.txt` — should return robots.txt content.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json nuxt.config.ts
git commit -m "feat: install @nuxtjs/seo and configure module with robots, sitemap, og-image settings"
```

---

### Task 2: Create dynamic sitemap source endpoint

**Files:**

- Create: `server/api/__sitemap__/urls.ts`

- [ ] **Step 1: Create the sitemap URL source**

Create `server/api/__sitemap__/urls.ts`:

```typescript
import { getDb } from '../../db.js';
import * as schema from '../../schema.js';
import { defineSitemapEventHandler } from '#imports';

export default defineSitemapEventHandler(async () => {
    const db = getDb();

    const allLists = await db.select({ externalId: schema.lists.external_id }).from(schema.lists);

    const shareUrls = allLists.map((row) => ({
        loc: `/r/${row.externalId}`,
        changefreq: 'weekly' as const,
    }));

    return [
        {
            loc: '/welcome',
            changefreq: 'monthly' as const,
            priority: 1.0,
        },
        ...shareUrls,
    ];
});
```

- [ ] **Step 2: Verify the sitemap**

Run:

```bash
npm run dev
```

Visit `http://localhost:3000/sitemap.xml`. Expected: XML sitemap containing `/welcome` and any `/r/[id]` URLs from the database.

- [ ] **Step 3: Commit**

```bash
git add server/api/__sitemap__/urls.ts
git commit -m "feat: add dynamic sitemap source endpoint for share pages and welcome"
```

---

### Task 3: Add SEO meta and structured data to the welcome page

**Files:**

- Modify: `app/pages/welcome.vue:220-229`

- [ ] **Step 1: Replace the `useHead` block in `welcome.vue`**

Replace the existing `useHead` call (lines 220–229):

```javascript
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
```

With:

```javascript
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

useSeoMeta({
    title: 'LighterPack — Track Your Gear Weight',
    description:
        'LighterPack helps you track the gear you bring on adventures. Enter packing lists, visualize pack weight, and share with the community.',
    ogType: 'website',
    ogTitle: 'LighterPack — Track Your Gear Weight',
    ogDescription:
        'LighterPack helps you track the gear you bring on adventures. Enter packing lists, visualize pack weight, and share with the community.',
    twitterCard: 'summary_large_image',
    twitterTitle: 'LighterPack — Track Your Gear Weight',
    twitterDescription:
        'LighterPack helps you track the gear you bring on adventures. Enter packing lists, visualize pack weight, and share with the community.',
});

useSchemaOrg([
    defineWebApplication({
        name: 'LighterPack',
        description:
            'Track the gear you bring on adventures. Enter packing lists, visualize pack weight, and share with the community.',
        applicationCategory: 'Utility',
    }),
]);

defineOgImage({
    title: 'LighterPack',
    description: 'Every ounce accounted for.',
});
```

Also add the imports at the top of the `<script setup>` block. The `useSeoMeta`, `useSchemaOrg`, `defineWebApplication`, and `defineOgImage` composables are auto-imported by Nuxt/the SEO module — no explicit import needed. Keep the existing imports as-is.

- [ ] **Step 2: Verify welcome page meta tags**

Run:

```bash
npm run dev
```

Visit `http://localhost:3000/welcome` and view page source. Expected: `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:type">`, `<meta name="twitter:card">`, and JSON-LD script tag with `WebApplication` schema should all be present in the HTML.

- [ ] **Step 3: Commit**

```bash
git add app/pages/welcome.vue
git commit -m "feat: add SEO meta tags, structured data, and OG image to welcome page"
```

---

### Task 4: Enhance share page SEO meta and structured data

**Files:**

- Modify: `app/pages/r/[id].vue:100-116`

- [ ] **Step 1: Compute dynamic description values**

In `app/pages/r/[id].vue`, after the existing `shareListName` computed (line 109), add these computed properties:

```javascript
const shareItemCount = computed(() => {
    if (!shareData.value) return 0;
    const cats = shareData.value.library?.categories || [];
    const items = shareData.value.library?.categoryItems || [];
    const listCats = cats.filter((c) => {
        const listObj = (shareData.value.library?.lists || []).find(
            (l) => l.external_id === shareData.value.externalId,
        );
        return listObj && c.list_id === listObj.id;
    });
    const catIds = new Set(listCats.map((c) => c.id));
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
```

- [ ] **Step 2: Replace the existing `useSeoMeta` call**

Replace the existing `useSeoMeta` block (lines 111–116):

```javascript
useSeoMeta({
    title: shareListName,
    ogTitle: shareListName,
    description: 'A gear list shared on LighterPack',
    ogDescription: 'A gear list shared on LighterPack',
});
```

With:

```javascript
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

defineOgImage({
    title: shareListName,
    description: shareDescription,
    itemCount: shareItemCount,
    categoryCount: shareCategoryCount,
});
```

The `defineItemList` composable is auto-imported by `nuxt-schema-org`. The `defineOgImage` composable is auto-imported by `nuxt-og-image`.

- [ ] **Step 3: Verify share page meta**

Run:

```bash
npm run dev
```

Visit a share page URL (e.g., `http://localhost:3000/r/<some-id>`) and view page source. Expected: dynamic title with list name, dynamic description with item count, OG tags, Twitter tags, and JSON-LD `ItemList` schema in the HTML.

- [ ] **Step 4: Commit**

```bash
git add app/pages/r/[id].vue
git commit -m "feat: enhance share page with full SEO meta, structured data, and OG image"
```

---

### Task 5: Create the branded OG image component

**Files:**

- Create: `app/components/OgImage/OgImageDefault.vue`

- [ ] **Step 1: Create the OG image Vue component**

Create `app/components/OgImage/OgImageDefault.vue`:

```vue
<template>
    <div
        :style="{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: '#252523',
            fontFamily: 'sans-serif',
            padding: '60px',
        }"
    >
        <!-- Wordmark -->
        <div
            :style="{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                marginBottom: '40px',
            }"
        >
            <span
                :style="{
                    color: '#c8c6bc',
                    fontSize: '28px',
                    fontWeight: 400,
                }"
            >
                LighterPack
            </span>
        </div>

        <!-- Title -->
        <div
            :style="{
                display: 'flex',
                flexDirection: 'column',
                flex: '1',
                justifyContent: 'center',
            }"
        >
            <div
                :style="{
                    color: '#fafaf7',
                    fontSize: '56px',
                    fontWeight: 700,
                    lineHeight: 1.15,
                    marginBottom: '16px',
                }"
            >
                {{ title }}
            </div>
            <div
                v-if="description"
                :style="{
                    color: '#8a8880',
                    fontSize: '28px',
                    lineHeight: 1.4,
                }"
            >
                {{ description }}
            </div>
        </div>

        <!-- Stats bar (only shown when itemCount > 0) -->
        <div
            v-if="itemCount > 0"
            :style="{
                display: 'flex',
                gap: '32px',
                borderTop: '1px solid #3b3b37',
                paddingTop: '24px',
                marginTop: '24px',
            }"
        >
            <div :style="{ display: 'flex', alignItems: 'baseline', gap: '8px' }">
                <span :style="{ color: '#e8a220', fontSize: '32px', fontWeight: 700 }">{{ itemCount }}</span>
                <span :style="{ color: '#8a8880', fontSize: '20px' }">items</span>
            </div>
            <div v-if="categoryCount > 0" :style="{ display: 'flex', alignItems: 'baseline', gap: '8px' }">
                <span :style="{ color: '#e8a220', fontSize: '32px', fontWeight: 700 }">{{ categoryCount }}</span>
                <span :style="{ color: '#8a8880', fontSize: '20px' }">categories</span>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        default: 'LighterPack',
    },
    description: {
        type: String,
        default: '',
    },
    itemCount: {
        type: Number,
        default: 0,
    },
    categoryCount: {
        type: Number,
        default: 0,
    },
});
</script>
```

This component uses only flexbox and inline styles — compatible with Satori's rendering constraints. The color scheme matches the app's charcoal/amber design tokens.

- [ ] **Step 2: Verify OG image generation**

Run:

```bash
npm run dev
```

Visit `http://localhost:3000/__og-image__/image/welcome/og.png` — should render a branded card with "LighterPack" title and "Every ounce accounted for." description.

If a share page exists, visit `http://localhost:3000/__og-image__/image/r/<some-id>/og.png` — should show the list name, description, and item/category counts.

- [ ] **Step 3: Commit**

```bash
git add app/components/OgImage/OgImageDefault.vue
git commit -m "feat: add branded OG image component for Satori-based social media previews"
```

---

### Task 6: Run linting and type checks

**Files:** None new — validation only.

- [ ] **Step 1: Run ESLint**

```bash
npm run lint:js
```

Expected: No errors (auto-fix applied). If there are errors in modified files, fix them.

- [ ] **Step 2: Run Stylelint**

```bash
npm run lint:css
```

Expected: No errors.

- [ ] **Step 3: Run TypeScript type check**

```bash
npm run typecheck
```

Expected: No type errors. If there are errors related to the new SEO composables (`defineOgImage`, `useSchemaOrg`, `defineWebApplication`, `defineItemList`), the `@nuxtjs/seo` module should auto-register their types. If not, check that the module is properly listed in `nuxt.config.ts` modules.

- [ ] **Step 4: Run unit tests**

```bash
npm run test:unit
```

Expected: All existing tests pass.

- [ ] **Step 5: Run server tests**

```bash
npm run test:server
```

Expected: All existing tests pass.

- [ ] **Step 6: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: fix lint issues from SEO implementation"
```

(Only if there were fixes needed.)

---

### Task 7: Manual smoke test

- [ ] **Step 1: Build and start production**

```bash
npm run start
```

Expected: Build completes, server starts.

- [ ] **Step 2: Verify robots.txt**

Visit `http://localhost:3000/robots.txt`.
Expected content includes:

```
User-agent: *
Disallow: /
Disallow: /signin
Disallow: /api/
Allow: /welcome
Allow: /r/
Sitemap: <site-url>/sitemap.xml
```

- [ ] **Step 3: Verify sitemap.xml**

Visit `http://localhost:3000/sitemap.xml`.
Expected: Valid XML with `/welcome` and `/r/[id]` URLs.

- [ ] **Step 4: Verify welcome page SEO**

Visit `http://localhost:3000/welcome` and view page source.
Expected: SSR-rendered HTML with `<title>`, `<meta name="description">`, OG tags, Twitter tags, canonical link, and `WebApplication` JSON-LD.

- [ ] **Step 5: Verify share page SEO**

Visit a share page and view page source.
Expected: Dynamic title, description, OG tags, Twitter tags, canonical link, and `ItemList` JSON-LD.

- [ ] **Step 6: Verify OG image**

Visit `http://localhost:3000/__og-image__/image/welcome/og.png`.
Expected: Rendered PNG image with branded LighterPack design.
