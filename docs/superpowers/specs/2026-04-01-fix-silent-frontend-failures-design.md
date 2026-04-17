# Fix Silent Frontend Failures — Design Spec

## Problem

15 `.catch(() => {})` blocks in `app/store/store.js` silently swallow API errors. The user gets no feedback when saves fail, and the UI shows state that isn't actually persisted to the server.

## Scope

All changes are in `app/store/store.js`. No new files, components, or dependencies.

## Categories of Silent Catches

### 1. Library Settings Patches (7 catches) — Add rollback + error toast

These are optimistic updates to library preferences. The UI updates immediately, then a PATCH fires in the background. Currently, failures are silent.

**Fix:** Capture the old value before the optimistic update. On failure, revert to the old value and call `_showError()`.

| Action                 | Line | Old value to capture                                      | Revert target                                |
| ---------------------- | ---- | --------------------------------------------------------- | -------------------------------------------- |
| `toggleSidebar`        | 150  | `!this.library.showSidebar` (pre-toggle)                  | `this.library.showSidebar`                   |
| `setDefaultList`       | 157  | `this.library.defaultListId` (before assignment)          | `this.library.defaultListId`                 |
| `setTotalUnit`         | 163  | `this.library.totalUnit` (before assignment)              | `this.library.totalUnit`                     |
| `toggleOptionalField`  | 181  | `this.library.optionalFields[optionalField]` (pre-toggle) | `this.library.optionalFields[optionalField]` |
| `updateCurrencySymbol` | 188  | `this.library.currencySymbol` (before assignment)         | `this.library.currencySymbol`                |
| `updateItemUnit`       | 194  | `this.library.itemUnit` (before assignment)               | `this.library.itemUnit`                      |

Error message for all: `'Failed to save setting.'`

For `toggleSidebar`, reverting the boolean also means the sidebar visually closes/opens again — acceptable since it accurately reflects the persisted state.

For `setDefaultList`, reverting also requires recalculating totals on the restored default list.

For `toggleOptionalField`, reverting means toggling the boolean back. The column will disappear/reappear — acceptable.

### 2. Sort Order Batch Updates (3 catches) — Reload + error toast

When reordering lists, categories, or items via drag-and-drop, the store fires N parallel PATCH calls (one per item). Currently, failures are silent.

**Fix:** Wrap the batch of PATCH calls in `Promise.all()`. On failure, call `_reloadLibrary()` to restore consistent state, then `_showError()`.

| Action                                       | Lines   | Error message                      |
| -------------------------------------------- | ------- | ---------------------------------- |
| `reorderLists` (list sort_order)             | 265-267 | `'Failed to save list order.'`     |
| `reorderCategories` (category sort_order)    | 373-375 | `'Failed to save category order.'` |
| `dropItem` (item sort_order within category) | 442-446 | `'Failed to save item order.'`     |

### 3. `opt_images` Enable Patches (3 catches) — Add error toast only

These fire `PATCH /api/library { opt_images: 1 }` after a successful image save. The primary operation (image upload/URL save) already succeeded and has its own error handling. The `opt_images` call just ensures the images column is visible.

**Fix:** Add `_showError('Failed to enable images setting.')` — no rollback needed since the image was saved successfully.

| Location             | Line |
| -------------------- | ---- |
| `saveItemImageUrl`   | 601  |
| `uploadImage`        | 634  |
| `saveEntityImageUrl` | 670  |

### 4. Intentionally Silent (2 catches) — No change

| Action                        | Line | Reason                                                                   |
| ----------------------------- | ---- | ------------------------------------------------------------------------ |
| `signout()`                   | 84   | Session clears locally regardless; server session expires on its own     |
| `_reloadLibrary` initial load | 805  | 401 or network error means user isn't logged in — app shows welcome page |

## Error Display

Uses the existing `_showError(message)` method which pushes to `this.globalAlerts`. The existing `lpAlert` component renders these as dismissable banners at the top of the page. No changes needed to the alert system.

## Testing

- Existing E2E tests cover the happy paths for all affected actions
- No new unit tests needed — the changes are mechanical (add catch handler calling existing `_showError`)
- E2E tests should continue to pass since the error paths only trigger on API failure
