# Rebrand LighterPack → BaseWeight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the application from "LighterPack" to "BaseWeight" across the entire codebase — config, CSS, store, server, frontend, tests, and docs.

**Architecture:** Bottom-up rename in 8 atomic commits. Each layer is internally consistent before the next one changes. No logic changes — purely a rename. Bulk find-and-replace for the CSS class prefix (`lp-` → `bw-`, `lp` camelCase → `bw` camelCase) and store export (`useLighterpackStore` → `useBaseweightStore`).

**Tech Stack:** Nuxt 4, Vue 3, Pinia, Nitro, SQLite/Drizzle, Better Auth — all unchanged.

---

## File Structure

| Action | File                                                | Responsibility                                    |
| ------ | --------------------------------------------------- | ------------------------------------------------- |
| Modify | `package.json`                                      | Package name, description                         |
| Modify | `config/default.json`                               | Database path                                     |
| Modify | `drizzle.config.ts`                                 | Database path fallback                            |
| Modify | `nuxt.config.ts`                                    | Site name, title, rootId, CSS import              |
| Rename | `app/assets/css/lighterpack.css` → `baseweight.css` | Main CSS entry point                              |
| Modify | `app/assets/css/_common.css`                        | `#lp` selector → `#bw`                            |
| Modify | `app/assets/css/*.css` (all 7 files)                | `lp-` and `lp` camelCase class prefixes           |
| Modify | `app/components/*.vue` (all ~28 files)              | CSS classes, store imports, brand text            |
| Modify | `app/pages/*.vue` (3 files)                         | CSS classes, store imports, brand text, meta tags |
| Modify | `app/store/store.ts`                                | Store export and ID                               |
| Modify | `app/plugins/*.client.ts` (2 files)                 | Store import                                      |
| Modify | `app/middleware/auth.ts`                            | Store import                                      |
| Modify | `app/composables/useItemDrag.ts`                    | Store import                                      |
| Modify | `app/utils/focus.ts`                                | Store import                                      |
| Modify | `server/utils/auth.ts`                              | Email from, reply-to, subject, body               |
| Modify | `server/plugins/sqlite.ts`                          | Fallback DB path                                  |
| Modify | `public/dist/error.html`                            | Contact email, brand text                         |
| Modify | `public/dist/503.html`                              | Contact email, brand text                         |
| Modify | `test/e2e/*.spec.ts` (10 files)                     | Test email domains, assertions                    |
| Modify | `test/e2e/auth-utils.ts`                            | Test email domain                                 |
| Modify | `test/unit/**/*.spec.ts` (~20 files)                | Store import references                           |
| Modify | `test/unit/utils/csvParser.spec.ts`                 | Comment text                                      |
| Modify | `README.md`                                         | Project name, description                         |
| Modify | `CLAUDE.md`                                         | Project name, store reference                     |
| Modify | `docs/styleguide/*.md` (8 files)                    | Brand references                                  |
| Modify | `docs/*.md` (2 files)                               | Brand references                                  |
| Modify | `docs/superpowers/plans/*.md` (~8 files)            | Brand references                                  |
| Modify | `docs/superpowers/specs/*.md` (~6 files)            | Brand references                                  |
| Delete | `public/dist/` (built assets)                       | Stale compiled files                              |

---

### Task 1: Config & metadata

**Files:**

- Modify: `package.json:2,4,36`
- Modify: `config/default.json:8,9`
- Modify: `drizzle.config.ts:8`
- Modify: `nuxt.config.ts:14,17,20,62`

- [ ] **Step 1: Update package.json**

Change lines 2, 4, and 36:

```json
"name": "baseweight",
```

```json
"description": "BaseWeight is a web application for tracking gear weight for hiking, backpacking, and adventures.",
```

Update the repository URL on line 36 to point to the new repo name if applicable, or leave as-is if the GitHub repo hasn't been renamed yet.

- [ ] **Step 2: Update config/default.json**

Change line 8:

```json
"databaseUrl": "mongodb://localhost:27017/baseweight",
```

Change line 9:

```json
"databasePath": "./data/baseweight.db",
```

- [ ] **Step 3: Update drizzle.config.ts**

Change line 8:

```typescript
url: process.env.DATABASE_PATH ?? './data/baseweight.db',
```

- [ ] **Step 4: Update nuxt.config.ts**

Change line 14:

```typescript
name: 'BaseWeight',
```

Change line 17:

```typescript
rootId: 'bw',
```

Change line 20:

```typescript
title: 'BaseWeight',
```

Change line 62:

```typescript
css: ['~/assets/css/baseweight.css'],
```

- [ ] **Step 5: Run typecheck to verify config changes**

Run: `npm run typecheck`
Expected: PASS (warnings about localhost URL and robots are pre-existing, ignore them)

- [ ] **Step 6: Commit**

```bash
git add package.json config/default.json drizzle.config.ts nuxt.config.ts
git commit -m "chore: rebrand config and metadata — LighterPack to BaseWeight"
```

---

### Task 2: CSS file rename and class prefix rename

**Files:**

- Rename: `app/assets/css/lighterpack.css` → `app/assets/css/baseweight.css`
- Modify: `app/assets/css/_common.css:114` — `#lp` → `#bw`
- Modify: All `.css` files in `app/assets/css/` — `lp-` → `bw-`, `lp` camelCase → `bw` camelCase
- Modify: All `.vue` files in `app/components/` and `app/pages/` — same class prefix rename

There are ~200 unique CSS class names using the `lp` prefix in two patterns:

- Hyphenated: `lp-wordmark`, `lp-hero`, `lp-modal`, etc. (~140 classes)
- CamelCase: `lpList`, `lpRow`, `lpCell`, `lpFooter`, etc. (~100 classes)

- [ ] **Step 1: Rename the main CSS file**

```bash
git mv app/assets/css/lighterpack.css app/assets/css/baseweight.css
```

- [ ] **Step 2: Rename `#lp` root ID selector**

In `app/assets/css/_common.css`, change line 114:

```css
#bw {
    background: inherit;
}
```

- [ ] **Step 3: Bulk rename hyphenated `lp-` classes to `bw-`**

Use sed across all CSS and Vue files. The pattern is simple: `lp-` → `bw-` (only as a class prefix, not in the middle of words).

```bash
find app/assets/css app/components app/pages -type f \( -name '*.css' -o -name '*.vue' \) \
  -exec sed -i '' 's/lp-/bw-/g' {} +
```

Verify no false positives — `lp-` only appears as a class prefix in this codebase, never in content text or URLs.

- [ ] **Step 4: Bulk rename camelCase `lp` classes to `bw`**

The camelCase pattern is `lp[A-Z]` — the `lp` prefix followed by an uppercase letter. Replace `lp` with `bw` in these cases:

```bash
find app/assets/css app/components app/pages -type f \( -name '*.css' -o -name '*.vue' \) \
  -exec sed -i '' 's/\blp\([A-Z]\)/bw\1/g' {} +
```

Also handle CSS selectors where `lpActive` etc. appear with a dot prefix (`.lpList`). The `\b` word boundary handles this.

- [ ] **Step 5: Verify no `lp-` or `.lp` class references remain**

```bash
grep -rn 'lp-\|\.lp[A-Z]' app/assets/css/ app/components/ app/pages/ --include='*.css' --include='*.vue' | grep -v node_modules
```

Expected: No matches (or only false positives unrelated to CSS classes — inspect any matches).

- [ ] **Step 6: Run lint to catch formatting issues**

```bash
npm run lint:css
npm run lint:js
```

Expected: PASS (or only pre-existing warnings)

- [ ] **Step 7: Commit**

```bash
git add app/assets/css/ app/components/ app/pages/
git commit -m "chore: rename CSS prefix lp- to bw- and rename lighterpack.css to baseweight.css"
```

---

### Task 3: Store rename

**Files:**

- Modify: `app/store/store.ts:113` — export and store ID
- Modify: ~28 component/page files that import `useLighterpackStore`
- Modify: `app/plugins/session.client.ts`, `app/plugins/store-global.client.ts`
- Modify: `app/middleware/auth.ts`
- Modify: `app/composables/useItemDrag.ts`
- Modify: `app/utils/focus.ts`
- Modify: ~20 test files that import `useLighterpackStore`

- [ ] **Step 1: Update the store definition**

In `app/store/store.ts`, change line 113:

```typescript
export const useBaseweightStore = defineStore('baseweight', {
```

- [ ] **Step 2: Bulk rename all imports and usages**

```bash
find app/ test/ -type f \( -name '*.ts' -o -name '*.vue' \) \
  -exec sed -i '' 's/useLighterpackStore/useBaseweightStore/g' {} +
```

- [ ] **Step 3: Verify no references to `useLighterpackStore` remain in app/ and test/**

```bash
grep -rn 'useLighterpackStore' app/ test/ --include='*.ts' --include='*.vue'
```

Expected: No matches.

- [ ] **Step 4: Run unit tests to verify**

```bash
npm run test:unit
```

Expected: All 400 tests pass.

- [ ] **Step 5: Run server tests to verify**

```bash
npm run test:server
```

Expected: All 124 tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/ test/
git commit -m "chore: rename useLighterpackStore to useBaseweightStore"
```

---

### Task 4: Server — auth emails, DB path, error pages

**Files:**

- Modify: `server/utils/auth.ts:23-27`
- Modify: `server/plugins/sqlite.ts:26`
- Modify: `public/dist/error.html`
- Modify: `public/dist/503.html`

- [ ] **Step 1: Update auth email configuration**

In `server/utils/auth.ts`, change lines 23-27:

```typescript
await mg.messages.create(config.get('mailgunDomain'), {
    from: 'BaseWeight <noreply@mg.baseweight.pro>',
    to: email,
    'h:Reply-To': 'BaseWeight <info@baseweight.pro>',
    subject: 'Sign in to BaseWeight',
    text: `Click the link below to sign in to BaseWeight. This link expires in 5 minutes.\n\n${url}`,
});
```

- [ ] **Step 2: Update SQLite plugin fallback path**

In `server/plugins/sqlite.ts`, change line 26:

```typescript
const dbPath = process.env.DATABASE_PATH ?? config.get<string>('databasePath') ?? './data/baseweight.db';
```

- [ ] **Step 3: Update error.html**

Replace the full content of `public/dist/error.html`:

```html
<!doctype html>
<html class="bw">
    <head>
        <title>oops....</title>
        <link rel="stylesheet" href="/public/common.css" />
    </head>
    <body>
        <h1>Aw Snap!</h1>
        <p>Something went terribly wrong.</p>

        <h2>BaseWeight is <b>Down</b></h2>
        <p>If this persists, please email me at: <a href="mailto:info@baseweight.pro">info@baseweight.pro</a></p>
    </body>
</html>
```

- [ ] **Step 4: Update 503.html**

Replace the full content of `public/dist/503.html`:

```html
<!doctype html>
<html class="bw">
    <head>
        <title>BaseWeight</title>
        <link rel="stylesheet" href="/public/common.css" />
    </head>
    <body>
        <h1>Aw Snap!</h1>
        <p>Something went terribly wrong.</p>

        <h2>BaseWeight is <b>Down</b></h2>
        <p>If this persists, please email me at: <a href="mailto:info@baseweight.pro">info@baseweight.pro</a></p>
    </body>
</html>
```

- [ ] **Step 5: Run server tests to verify**

```bash
npm run test:server
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/utils/auth.ts server/plugins/sqlite.ts public/dist/error.html public/dist/503.html
git commit -m "chore: rebrand server emails and error pages to BaseWeight"
```

---

### Task 5: Frontend — user-facing brand text and meta tags

**Files:**

- Modify: `app/pages/welcome.vue:8,17,44,59,232,247,255`
- Modify: `app/pages/r/[id].vue:5`
- Modify: `app/pages/index.vue:13`
- Modify: `app/components/list.vue:44`
- Modify: `app/components/OgImage/OgImageDefault.satori.vue:29,92`

- [ ] **Step 1: Update welcome.vue brand text**

In `app/pages/welcome.vue`, make the following changes:

Line 8 — update wordmark to use two-tone brand pattern:

```html
<span class="bw-wordmark"
    ><span class="bw-wordmark-base">Base</span><span class="bw-wordmark-weight">Weight</span></span
>
```

Line 17:

```html
<p class="bw-hero-body">BaseWeight helps you track the gear you bring on adventures.</p>
```

Line 44:

```html
<h2>Welcome to BaseWeight!</h2>
```

Line 59:

```html
<div class="bw-mockup-wordmark">BaseWeight</div>
```

Line 232:

```typescript
title: 'BaseWeight — Track Your Gear Weight',
```

Line 247:

```typescript
name: 'BaseWeight',
```

Line 255:

```typescript
title: 'BaseWeight',
```

- [ ] **Step 2: Update share page (r/[id].vue)**

Line 5 — update wordmark:

```html
<NuxtLink to="/welcome" class="bw-share-wordmark"
    ><span class="bw-wordmark-base">Base</span><span class="bw-wordmark-weight">Weight</span></NuxtLink
>
```

Also update any meta tag references to "LighterPack" in this file's `useHead`/`useSeoMeta` section.

- [ ] **Step 3: Update index.vue mobile wordmark**

Line 13:

```html
<span class="bw-mobile-wordmark"
    ><span class="bw-wordmark-base">Base</span><span class="bw-wordmark-weight">Weight</span></span
>
```

- [ ] **Step 4: Update list.vue welcome message**

Line 44:

```html
<h2>Welcome to BaseWeight!</h2>
```

- [ ] **Step 5: Update OG image component**

In `app/components/OgImage/OgImageDefault.satori.vue`:

Line 29 — change template text from `LighterPack` to `BaseWeight`.

Line 92 — change default prop:

```typescript
default: 'BaseWeight',
```

- [ ] **Step 6: Verify all user-facing LighterPack references are gone**

```bash
grep -rn 'LighterPack\|Lighterpack' app/ --include='*.vue' --include='*.ts'
```

Expected: No matches.

- [ ] **Step 7: Commit**

```bash
git add app/pages/ app/components/
git commit -m "chore: rebrand user-facing text and meta tags to BaseWeight"
```

---

### Task 6: Tests — email domains and assertions

**Files:**

- Modify: `test/e2e/auth.spec.ts:8,28,41`
- Modify: `test/e2e/list.spec.ts:11,27`
- Modify: `test/e2e/drag.spec.ts:7`
- Modify: `test/e2e/import-csv.spec.ts:7`
- Modify: `test/e2e/export-import.spec.ts:9`
- Modify: `test/e2e/items.spec.ts:9,199`
- Modify: `test/e2e/auth-utils.ts:9`
- Modify: `test/e2e/share.spec.ts:13`
- Modify: `test/e2e/list-management.spec.ts:9`
- Modify: `test/e2e/list-settings.spec.ts:9`
- Modify: `test/unit/utils/csvParser.spec.ts`

- [ ] **Step 1: Bulk rename email domains in E2E tests**

```bash
find test/e2e -type f \( -name '*.ts' \) \
  -exec sed -i '' 's/@lighterpack\.com/@baseweight.pro/g' {} +
find test/e2e -type f \( -name '*.ts' \) \
  -exec sed -i '' 's/@test\.lighterpack\.com/@test.baseweight.pro/g' {} +
```

- [ ] **Step 2: Update auth.spec.ts assertions**

In `test/e2e/auth.spec.ts`:

Line 8 — update title regex:

```typescript
await expect(page).toHaveTitle(/BaseWeight/);
```

Line 28 — update welcome text assertion:

```typescript
await expect(page.getByText('Welcome to BaseWeight!')).toBeVisible();
```

- [ ] **Step 3: Update csvParser.spec.ts comment**

In `test/unit/utils/csvParser.spec.ts`, update the comment on line 40 from "lighterpack CSV" to "baseweight CSV" (or similar).

- [ ] **Step 4: Run unit tests**

```bash
npm run test:unit
```

Expected: All 400 tests pass.

- [ ] **Step 5: Run server tests**

```bash
npm run test:server
```

Expected: All 124 tests pass.

- [ ] **Step 6: Commit**

```bash
git add test/
git commit -m "chore: rebrand test email domains and assertions to BaseWeight"
```

---

### Task 7: Docs — README, CLAUDE.md, styleguide, plans, specs

**Files:**

- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `docs/styleguide/01-brand.md` and other styleguide files
- Modify: `docs/passwordless-auth-plan.md`
- Modify: `docs/phase-5-ssr-plan.md`
- Modify: `docs/superpowers/plans/*.md`
- Modify: `docs/superpowers/specs/*.md`

- [ ] **Step 1: Bulk rename across all docs**

```bash
find . -name '*.md' -not -path './node_modules/*' \
  -exec sed -i '' 's/LighterPack/BaseWeight/g' {} +
find . -name '*.md' -not -path './node_modules/*' \
  -exec sed -i '' 's/Lighterpack/Baseweight/g' {} +
find . -name '*.md' -not -path './node_modules/*' \
  -exec sed -i '' 's/lighterpack\.com/baseweight.pro/g' {} +
find . -name '*.md' -not -path './node_modules/*' \
  -exec sed -i '' 's/lighterpack/baseweight/g' {} +
```

Note: Run the most specific patterns first (domain, proper case) before the catch-all lowercase pattern.

- [ ] **Step 2: Update CLAUDE.md store reference**

Verify that `CLAUDE.md` now references `useBaseweightStore` instead of `useLighterpackStore`. The bulk sed should have caught this, but double-check:

```bash
grep -n 'lighterpack\|LighterPack' CLAUDE.md
```

Expected: No matches.

- [ ] **Step 3: Update README.md project title and description**

Verify the README title is now `# BaseWeight` and the description references the new name. The git clone URL may still reference the old repo — leave it if the GitHub repo hasn't been renamed yet.

- [ ] **Step 4: Run prettier on modified docs**

```bash
npx prettier --write '**/*.md' --ignore-path .gitignore
```

- [ ] **Step 5: Commit**

```bash
git add '*.md' docs/
git commit -m "chore: rebrand documentation to BaseWeight"
```

---

### Task 8: Cleanup — delete stale dist, regenerate lock, verify

**Actions:**

- Delete: `public/dist/` compiled assets (except error.html and 503.html already updated)
- Regenerate: `package-lock.json`
- Verify: full test suite, grep for remaining references

- [ ] **Step 1: Delete stale built assets**

Remove the old compiled JS/CSS files that contain "lighterpack" in their filenames. Keep `error.html`, `503.html`, and `assets.json`:

```bash
rm -f public/dist/lighterpack.*.js public/dist/lighterpack.*.css public/dist/share.*.css public/dist/share.*.js
rm -f public/dist/assets.json
```

- [ ] **Step 2: Regenerate package-lock.json**

```bash
npm install
```

This regenerates the lock file with the new package name `baseweight`.

- [ ] **Step 3: Run full lint**

```bash
npm run lint:js
npm run lint:css
```

Expected: PASS

- [ ] **Step 4: Run all unit tests**

```bash
npm run test:unit
```

Expected: All tests pass.

- [ ] **Step 5: Run all server tests**

```bash
npm run test:server
```

Expected: All tests pass.

- [ ] **Step 6: Grep for any remaining "lighterpack" references**

```bash
grep -rni 'lighterpack' --include='*.ts' --include='*.vue' --include='*.css' --include='*.json' --include='*.html' . | grep -v node_modules | grep -v package-lock | grep -v '.output/' | grep -v 'docs/'
```

Expected: No matches in source code. (Docs may still have historical references in plan/spec filenames — that's fine.)

Also check for remaining `lp-` or camelCase `lp` CSS classes:

```bash
grep -rn 'lp-\|\.lp[A-Z]\|"lp[A-Z]' app/ --include='*.css' --include='*.vue'
```

Expected: No matches.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: cleanup stale dist assets and regenerate package-lock for baseweight"
```

---

## Summary

| Task | Layer             | Commit message                                                                     |
| ---- | ----------------- | ---------------------------------------------------------------------------------- |
| 1    | Config & metadata | `chore: rebrand config and metadata — LighterPack to BaseWeight`                   |
| 2    | CSS rename        | `chore: rename CSS prefix lp- to bw- and rename lighterpack.css to baseweight.css` |
| 3    | Store rename      | `chore: rename useLighterpackStore to useBaseweightStore`                          |
| 4    | Server            | `chore: rebrand server emails and error pages to BaseWeight`                       |
| 5    | Frontend text     | `chore: rebrand user-facing text and meta tags to BaseWeight`                      |
| 6    | Tests             | `chore: rebrand test email domains and assertions to BaseWeight`                   |
| 7    | Docs              | `chore: rebrand documentation to BaseWeight`                                       |
| 8    | Cleanup           | `chore: cleanup stale dist assets and regenerate package-lock for baseweight`      |
