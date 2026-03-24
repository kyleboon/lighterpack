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

### List Header

The existing `<share>` component in `list.vue`'s header is replaced by a new `<list-actions>` component. The button is icon-only: a horizontal three-dot (ellipsis) icon (`⋯`), no label text. It has `aria-label="List actions"` and `title="List actions"` for accessibility.

**Button states:**

- **Default:** muted icon button (`#f3f2ee` background, `#8a8880` icon)
- **Hover:** slightly darker background (`#e8e7e1`), darker icon (`#1e1e1c`)
- **Post-copy:** green tint (`#e8fde8` background, `#5a9e6b` checkmark icon), reverts after 2 seconds

### Dropdown Menu

Clicking the button opens a dropdown (using the existing `Popover` component) aligned to the right edge of the button. The menu is divided into three labeled sections:

**Share**

- _Copy share link_ — copies the public share URL to the clipboard. If no `externalId` exists yet, calls `POST /api/external-id` first to generate one, then copies. On success, shows a toast and flips button to checkmark state for 2 seconds.

**Export**

- _Export to CSV_ — navigates to `/csv/:externalId` in a new tab (same behaviour as today). Generates `externalId` first if needed.

**Manage**

- _Copy this list_ — calls `store.showModal('copyList')`, opening the existing `copy-list.vue` modal (no changes to that modal).

### Toast Notification

On successful clipboard copy, a dark toast (`#1e1e1c` background, white text, green checkmark) appears at the bottom-center of the screen: **"Share link copied to clipboard"**. Uses the existing `globalAlerts` store mechanism with a success variant (auto-dismisses after 3 seconds).

If the clipboard API or `externalId` generation fails, show an error alert via the existing `_showError` store action.

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

---

## Behaviour Details

### Generating a share link on demand

The `externalId` may not exist when the user opens the menu. Both "Copy share link" and "Export to CSV" require it. The `list-actions` component should:

1. Check `list.externalId` — if present, proceed immediately
2. If absent, call `POST /api/external-id`, then call `store.setExternalId(...)` with the result
3. Only then copy to clipboard / open the CSV URL

This matches the logic already in `share.vue`'s `focusShare()` function — it moves into `list-actions.vue`.

### Dropdown close behaviour

The dropdown closes on:

- Clicking any menu item
- Clicking outside the popover
- Pressing Escape

Use `Popover` component (click-triggered, not hover) rather than `PopoverHover`.

---

## What Is Removed

- `share.vue` — deleted entirely
- Embed code feature — removed (no replacement)
- "+ Copy a list" from sidebar — moved to list actions menu
