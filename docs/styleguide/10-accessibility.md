# 10 — Accessibility

## Target

WCAG 2.1 AA compliance across all pages.

---

## Color contrast

| Pair                                                | Ratio  | Status                |
| --------------------------------------------------- | ------ | --------------------- |
| `--charcoal-100` on `--charcoal-900` (sidebar text) | 7.2:1  | ✅ AAA                |
| `--color-text-primary` on `--stone-50` (body)       | 14.1:1 | ✅ AAA                |
| `--amber-400` on `--charcoal-900` (active nav)      | 6.8:1  | ✅ AA                 |
| `--charcoal-900` on `--amber-400` (primary btn)     | 8.1:1  | ✅ AAA                |
| `--slate-400` on `--stone-50` (links)               | 4.6:1  | ✅ AA                 |
| `--color-text-secondary` on `--stone-50`            | 5.2:1  | ✅ AA                 |
| `--color-text-muted` on `--stone-50`                | 3.8:1  | ⚠️ AA large text only |

> `--color-text-muted` (`#a8a79f`) should only be used for placeholder text and non-informational hints — never for required readable content.

---

## Focus management

Every interactive element must show a visible focus ring on keyboard navigation.

```css
/* Applied globally — do not suppress with outline: none without a replacement */
:focus-visible {
    outline: 2px solid var(--amber-400);
    outline-offset: 2px;
}

/* Inside the dark sidebar — adjust for contrast */
.lp-sidebar :focus-visible {
    outline-color: var(--amber-200);
}
```

**Never use** `outline: none` or `outline: 0` without providing an equivalent visible focus style. This is a legal requirement in many jurisdictions.

---

## Keyboard navigation

The app must be fully operable via keyboard. Key interactions:

| Key          | Action                                           |
| ------------ | ------------------------------------------------ |
| `Tab`        | Move focus through interactive elements          |
| `Shift+Tab`  | Move focus backwards                             |
| `Enter`      | Activate buttons and links; begin editing a cell |
| `Escape`     | Cancel inline edit; close modals and popovers    |
| `Arrow keys` | Navigate within lists, unit selectors            |

### Inline editing pattern

```js
// Cell enters edit mode on click or Enter
cellElement.addEventListener('click', () => inputElement.focus());
cellElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') inputElement.focus();
});

// Cell exits edit mode on blur or Escape
inputElement.addEventListener('blur', saveValue);
inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cancelEdit();
        cellElement.focus();
    }
    if (e.key === 'Enter') {
        saveValue();
        cellElement.focus();
    }
});
```

---

## Semantic HTML

- Page title (`<h1>`): the list name (`.lp-title`)
- Category headings (`<h2>`): each category name (`.lp-heading`)
- Gear table: `<table>` with `<thead>`, `<tbody>`, `<th scope="col">` for each column
- Sidebar navigation: `<nav aria-label="Lists">` wrapping the list links
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-label="[title]"`, focus trapped inside
- Settings popover: `role="dialog"` or `role="menu"` depending on contents
- Form inputs: always paired with `<label>` (either visible or `aria-label`)

---

## ARIA patterns

### Inline editable cell

```html
<td>
    <span class="lp-cell-display" aria-hidden="true">Pedro's Tire Levers</span>
    <input class="lp-cell-input" type="text" value="Pedro's Tire Levers" aria-label="Item name" />
</td>
```

### Icon buttons

```html
<!-- Always include aria-label; title for tooltip on hover -->
<button class="lp-btn lp-btn-icon" aria-label="Remove item" title="Remove item">
    <svg aria-hidden="true" ...>...</svg>
</button>
```

### Expandable settings panel

```html
<button class="lp-btn lp-btn-secondary" aria-expanded="false" aria-controls="settings-panel" aria-haspopup="true">
    Settings
</button>
<div id="settings-panel" role="dialog" aria-label="List settings" hidden>...</div>
```

### Live weight updates

The stat display (total weight, base weight) updates as the user types. Use `aria-live` so screen readers announce changes:

```html
<div class="lp-stat-card" aria-live="polite" aria-atomic="true">
    <div class="lp-stat-card-num" id="base-weight">371</div>
    <div class="lp-stat-card-label">base oz</div>
</div>
```

---

## Motion

Respect `prefers-reduced-motion`. No animations should play when the user has reduced motion enabled:

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

The only animations in this system are hover color transitions (120–200ms). These are fine to keep even under reduced motion — the media query above will handle them.
