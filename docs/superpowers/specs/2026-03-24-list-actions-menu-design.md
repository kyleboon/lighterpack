# List Actions Menu — Design Spec

**Date:** 2026-03-24
**Status:** Approved

## Problem

List-level actions are split across two locations:

- **Sidebar** (`library-lists.vue`): "+ Copy a list", "+ Import CSV"
- **List header** (`share.vue`): Share URL input, Embed code, Export to CSV

This makes them hard to discover and visually inconsistent. The embed feature is also not one we want to support going forward.

## Goal

Consolidate all actions that operate on the currently selected list into one place in the list header. Keep sidebar actions that create new lists (Import CSV, Add new list) where they are.

## What's in Scope

Actions that act on the current list:

- Copy share link (formerly: Share URL input)
- Export to CSV
- Copy this list (formerly: "+ Copy a list" in sidebar)

Actions **out of scope** (stay in sidebar — they create new lists, not act on one):

-   - Add new list
-   - Import CSV

Removed entirely:

- Embed code (feature dropped)

---

## Design

### Authentication Guard

The `<list-actions>` component only renders when the user is authenticated (`v-if="isSignedIn"`), matching `share.vue`'s existing guard. In local-save / guest mode, no actions button is shown.

### List Header

The existing `<share>` component in `list.vue`'s header is replaced by a new `<list-actions>` component. The button is icon-only: a horizontal three-dot (ellipsis) icon, no label text. It has `aria-label="List actions"` and `title="List actions"` for accessibility.

Use the styleguide's `.lp-btn.lp-btn-icon` pattern (defined in `docs/styleguide/04-buttons.md`) — `transparent` background, `var(--color-text-muted)` icon, `var(--stone-200)` hover background. All color values must come from `tokens/tokens.css` custom properties; no hardcoded hex values.

**Button states:**

- **Default:** `background: transparent`, icon color `var(--charcoal-300)` — matches `.lp-btn-icon` base style
- **Hover:** `background: var(--stone-200)`, icon color `var(--color-text-primary)` — matches `.lp-btn-icon` hover
- **Post-copy:** amber tint (`var(--amber-50)` background, `var(--amber-400)` checkmark icon), reverts to default after 2 seconds via `setTimeout` — uses the system's only accent color per the "Amber accent only" rule

No toast is shown. The button's checkmark state is the sole success confirmation for clipboard copy — this avoids any changes to the `globalAlerts` system.

### Dropdown Menu

Clicking the button toggles `menuOpen` (a local `ref(false)`). When `menuOpen` is true, render a `<Popover :shown="menuOpen" @hide="menuOpen = false">`. The parent (`list-actions.vue`) is responsible for setting `menuOpen = false` after any menu item is clicked — the `Popover` component does not do this automatically.

**Alignment:** The default `Popover` CSS centers the panel under its trigger (`left: 50%; transform: translateX(-50%)`). The ellipsis button sits at the far right of the header, so a centered panel will overflow the viewport on narrow screens. Add a scoped CSS override on the popover content to right-align it: `right: 0; left: auto; transform: none`. The `::before` arrow caret is also positioned at `left: 50%` by default — override it too so it points at the button: `left: auto; right: 12px; margin-left: 0`.

The menu is divided into three labeled sections:

**Share**

- _Copy share link_ — copies the public share URL to the clipboard. See "Generating a share link on demand" below. On success, flips button to checkmark state for 2 seconds.

**Export**

- _Export to CSV_ — opens `/csv/:externalId` in a new tab. See "Generating a share link on demand" below.

**Manage**

- _Copy this list_ — calls `store.showModal('copyList')`, opening the existing `copy-list.vue` modal. No `externalId` needed; not affected by loading state.

### Loading State

Both "Copy share link" and "Export to CSV" require an `externalId`. If one doesn't exist, `list-actions.vue` must call `POST /api/external-id` first.

Track a local `loading = ref(false)` in `list-actions.vue`:

- Set `loading = true` before the API call; set `loading = false` when it resolves (success or error)
- While `loading` is true: disable the "Copy share link" and "Export to CSV" items (muted color, `cursor: not-allowed`, pointer-events off)
- Guard against re-entry: if `loading` is already true when an item is clicked, do nothing
- "Copy this list" is never disabled — it doesn't need `externalId`

Errors from the API call are shown via the existing `store._showError()` action (unchanged).

---

## Component Changes

| Component                          | Change                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `app/components/share.vue`         | **Deleted** — replaced by `list-actions.vue`                                                |
| `app/components/list-actions.vue`  | **New** — the `⋯` button + dropdown with all three actions                                  |
| `app/components/list.vue`          | **Updated** — swap `<share />` import/usage for `<list-actions />`                          |
| `app/components/library-lists.vue` | **Updated** — remove `+ Copy a list` button and `copyList()` handler                        |
| `app/components/copy-list.vue`     | **Unchanged** — modal still triggered via `store.showModal('copyList')`                     |
| `app/store/store.js`               | **Unchanged** — `globalAlerts`, `showModal`, `_showError`, `setExternalId` all reused as-is |
| `app/components/global-alerts.vue` | **Unchanged** — no success variant needed                                                   |

---

## Behaviour Details

### Generating a share link on demand

The `externalId` may not exist when the user opens the menu. Both "Copy share link" and "Export to CSV" require it. When either item is clicked:

1. Check `list.externalId` — if present, proceed immediately
2. If absent, set `loading = true`, call `POST /api/external-id`, then call `store.setExternalId(...)` with the result, set `loading = false`
3. Only then perform the action (copy to clipboard / open the CSV URL)
4. On API error, call `store._showError(...)` and set `loading = false`

This mirrors the logic in `share.vue`'s `focusShare()` function, which moves into `list-actions.vue`.

### Dropdown close behaviour

The dropdown closes on:

- Clicking any menu item (parent sets `menuOpen = false`)
- Clicking outside the popover (the `Popover` component emits `@hide`, parent handles it)
- Pressing Escape (handled by existing `Popover` component)

---

## What Is Removed

- `share.vue` — deleted entirely
- Embed code feature — removed (no replacement)
- "+ Copy a list" from sidebar — moved to list actions menu
