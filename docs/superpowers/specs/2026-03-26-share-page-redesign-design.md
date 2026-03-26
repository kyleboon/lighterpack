# Share Page Redesign: SSR Read-Only Index Components

**Date:** 2026-03-26
**Status:** Draft

## Problem

The share page (`app/pages/r/[id].vue`) is a monolithic 300-line component that duplicates the rendering logic of the index page's components (list, category, item, summary). It uses legacy SCSS with hardcoded hex colors and old font families, while the index page has been modernized with the design system. The two pages have drifted apart visually, and every future change to the index UI must be manually replicated on the share page.

## Solution

Replace the share page with a composition of the existing index page components (`list.vue`, `list-summary.vue`, `category.vue`, `item.vue`) running in a `readonly` mode. The share page becomes a thin orchestrator — no sidebar, no modals, data loaded via SSR — with a top bar for auth and a "Copy to my account" feature for logged-in viewers.

## Design

### Core Approach

The new `app/pages/r/[id].vue` renders:

```
┌─────────────────────────────────────────┐
│  Share top bar                          │
│  [LighterPack wordmark]   [Sign in]    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                         │
│  <list :readonly="true" />              │
│   (same content zone styling as index)  │
│                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  [Copy to my account] (if logged in)    │
└─────────────────────────────────────────┘
```

- No sidebar
- No modal overlays (image upload, link editor, CSV import, etc.)
- Data loaded via `useAsyncData` (SSR) and hydrated into the Pinia store
- Existing components render in readonly mode via a `readonly` prop

### The `readonly` Prop — Component by Component

**`list.vue`**

- List title: `<input>` becomes `<h1>` with the same `lp-list-title` styling
- Hide: header actions (share button, camera button), "Add new category" link, list description textarea, welcome message
- Show: rendered markdown description (using `marked()`, like the current share page)
- Skip: Sortable.js initialization, `useItemDrag()` setup
- Image strip: still visible (read-only thumbnails), clicks open lightbox viewer

**`list-summary.vue`**

- Color picker becomes a static color swatch (`<span>` with background color)
- Unit select dropdown becomes static text showing the unit
- Everything else renders identically

**`category.vue`**

- Category name: `<input>` becomes `<h2>`
- Hide: drag handle, remove button, camera button, "Add new item" link
- Image strip: visible but view-only
- Pass `readonly` down to child `item` components

**`item.vue`**

- Name/description: `<input>`s become `<span>`s (name wraps in `<a>` if URL exists)
- Hide: drag handle, camera/link/worn/consumable/star toggle buttons, remove button
- Show: static worn/consumable/star icons (visible when active, hidden when not)
- Weight unit: static text instead of dropdown

Prop propagation: `list.vue` receives `readonly` and passes it to `list-summary`, `category`, and `category` passes it to `item`. No global state — just props.

### Share Page Top Bar

- Horizontal bar with LighterPack wordmark on the left
- Right side: inline `SigninForm` if not authenticated, or user email if authenticated
- Styled with design tokens: `--font-ui`, `--stone-50` background, subtle bottom border

### Authentication Flow

- `SigninForm` gains a `callbackURL` prop (default `'/'`)
- On the share page, `callbackURL` is set to `/r/{shareId}`
- After clicking the magic link, Better Auth redirects back to the share page — now authenticated
- The "Copy to my account" button becomes visible

### "Copy to My Account" Feature

- Button visible only when viewer is authenticated
- Positioned below the list content
- Clicking shows a confirmation modal: "Copy '[List Name]' to your account? This will add [X] items to your library."
- On confirm: calls `POST /api/library/copy-list` with `{ externalId }`
- On success: redirects to the index page with the new list selected

### Copy API Endpoint

`POST /api/library/copy-list`

- Request body: `{ externalId: string }` (the share ID)
- Requires authentication (returns 401 if not logged in)
- Server-side: loads the shared list's data, creates new list/categories/items under the authenticated user's library
- Returns `{ listId }` (the new list's ID)

### SSR Compatibility

The share page uses SSR (`routeRules: '/r/**'`). Key points:

- In readonly mode, all SSR-unsafe code paths (Sortable, drag setup, DOM queries) are skipped entirely — they're behind `onMounted` or gated by editing-only logic
- `Sortable` import in `list.vue` must be changed to a dynamic import inside `onMounted` to prevent server-side module evaluation (Sortable references `window` at module level)
- Store hydration: `useAsyncData` fetches on the server, populates Pinia store via a new `loadShareData()` action. Nuxt automatically serializes and transfers Pinia state during hydration.

```js
// list.vue — dynamic import to prevent SSR breakage
onMounted(async () => {
    if (props.readonly) return;
    const { default: Sortable } = await import('sortablejs');
    // ... existing setup
});
```

### Store Changes

Add `loadShareData(libraryBlob)` action to `app/store/store.js`:

- Creates a `Library` instance from the blob
- Sets `store.library` and resolves `store.activeList`
- Does NOT trigger save/sync logic (share page is read-only)

## Files Changed

| File                                   | Change                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `app/pages/r/[id].vue`                 | Rewrite: compose existing components with readonly prop, add top bar with sign-in and copy button |
| `app/components/list.vue`              | Add `readonly` prop, conditional rendering for edit vs read-only, dynamic Sortable import         |
| `app/components/list-summary.vue`      | Add `readonly` prop, static swatch instead of color picker, static unit text                      |
| `app/components/category.vue`          | Add `readonly` prop, static name, hide edit affordances, pass readonly to items                   |
| `app/components/item.vue`              | Add `readonly` prop, static name/description, hide edit controls, show static icons               |
| `app/components/signin-form.vue`       | Add `callbackURL` prop (default `'/'`), use in magic link request                                 |
| `app/store/store.js`                   | Add `loadShareData()` action                                                                      |
| `server/api/library/copy-list.post.ts` | New endpoint: duplicate shared list into authenticated user's library                             |
| `app/assets/css/_share.scss`           | Delete (no longer needed)                                                                         |

## Files NOT Changed

- `server/api/share/[id].get.ts` — existing endpoint works as-is
- `server/utils/auth.ts` — no auth changes needed
- `app/pages/index.vue` — untouched
- `app/components/donut-chart.vue` — already works in both contexts

## What Gets Deleted

- ~200 lines of duplicate rendering logic in the current `r/[id].vue`
- `app/assets/css/_share.scss` (transition overrides, hover overrides)
