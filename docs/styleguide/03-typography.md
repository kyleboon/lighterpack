# 03 — Typography

## Font stack

Three fonts, three roles. Never mix these up.

| Font                 | Role                                          | Import                             |
| -------------------- | --------------------------------------------- | ---------------------------------- |
| **DM Serif Display** | Display headings, page/list titles, wordmark  | `family=DM+Serif+Display:ital@0;1` |
| **Figtree**          | All UI text, body, labels, buttons, nav       | `family=Figtree:wght@400;500;600`  |
| **DM Mono**          | Weight values, prices, share URLs, quantities | `family=DM+Mono:wght@400;500`      |

```html
<!-- Add to <head> of every page -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
    href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600&display=swap"
    rel="stylesheet"
/>
```

---

## Font weights

Only three weights are used in the system. Never use 700 or 800.

| Weight | Name     | Usage                                                      |
| ------ | -------- | ---------------------------------------------------------- |
| `400`  | Regular  | Body text, nav links (inactive), DM Serif Display headings |
| `500`  | Medium   | Labels, DM Mono stat numbers, nav links (active)           |
| `600`  | Semibold | Section headings, button labels, table column headers      |

> **Why no 700?** At the densities LighterPack operates (small sidebar text, 13px table cells), 700 weight reads as aggressive. 600 provides clear hierarchy without shouting.

---

## Type scale and classes

### Display — DM Serif Display

Used for the wordmark, page titles, list names, and landing page headlines. Always `font-weight: 400` — DM Serif Display has no bold weight in the Google Fonts subset.

```css
/* Hero / marketing headlines */
.lp-display-xl {
    font-family: var(--font-display);
    font-size: var(--text-3xl); /* 34px */
    line-height: 1.1;
    font-weight: 400;
    letter-spacing: -0.02em;
}

/* Section titles on landing page */
.lp-display-lg {
    font-family: var(--font-display);
    font-size: var(--text-2xl); /* 26px */
    line-height: 1.2;
    font-weight: 400;
    letter-spacing: -0.015em;
}

/* List / page title — primary app usage */
.lp-title {
    font-family: var(--font-display);
    font-size: var(--text-xl); /* 20px */
    line-height: 1.25;
    font-weight: 400;
}
```

**Italic usage:** DM Serif Display italic is permitted for emphasis in marketing copy (e.g. "Every ounce _accounted for_"). Never use italic in the app UI.

### Section / category headings — Figtree

```css
/* Category name above a gear table (e.g. "Bike", "Shelter") */
.lp-heading {
    font-family: var(--font-ui);
    font-size: var(--text-lg); /* 17px */
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.01em;
}

/* Sub-section label */
.lp-subheading {
    font-family: var(--font-ui);
    font-size: var(--text-base); /* 15px */
    font-weight: 600;
    line-height: 1.4;
}
```

### Body text — Figtree

```css
/* Primary body / descriptions */
.lp-body {
    font-family: var(--font-ui);
    font-size: var(--text-base); /* 15px */
    font-weight: 400;
    line-height: 1.65;
}

/* Table cells, secondary copy */
.lp-body-sm {
    font-family: var(--font-ui);
    font-size: var(--text-sm); /* 13px */
    font-weight: 400;
    line-height: 1.6;
}
```

### Labels and UI chrome — Figtree

```css
/* Form labels, column headers, dropdown items */
.lp-label {
    font-family: var(--font-ui);
    font-size: var(--text-sm); /* 13px */
    font-weight: 500;
    color: var(--color-text-secondary);
}

/* Uppercase category labels ("Lists", "Gear") in sidebar */
.lp-label-xs {
    font-family: var(--font-ui);
    font-size: var(--text-xs); /* 11px */
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
}
```

### Data / weight values — DM Mono

**Every weight, price, quantity, and share URL must use DM Mono.** This is non-negotiable — it keeps table columns aligned and signals that these are precise numerical values.

```css
/* Stat cards — base weight display, total weight */
.lp-data-lg {
    font-family: var(--font-mono);
    font-size: var(--text-xl); /* 20px */
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}

/* Standard table weight cells */
.lp-data {
    font-family: var(--font-mono);
    font-size: var(--text-base); /* 15px */
    font-weight: 400;
    font-variant-numeric: tabular-nums;
}

/* Small table cells, legend values */
.lp-data-sm {
    font-family: var(--font-mono);
    font-size: var(--text-sm); /* 13px */
    font-weight: 400;
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
}
```

### Sidebar text — Figtree on dark background

```css
/* Primary text on charcoal sidebar */
.lp-sidebar-text {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--charcoal-100);
}

/* Muted / secondary text on sidebar */
.lp-sidebar-muted {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--charcoal-300);
}

/* Wordmark */
.lp-wordmark {
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 400;
    color: var(--charcoal-100);
    letter-spacing: -0.01em;
    user-select: none;
}

.lp-wordmark-beta {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--charcoal-500);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    vertical-align: middle;
    margin-left: 4px;
}
```

---

## Hierarchy rules

1. Only one `.lp-title` or larger per page view
2. Category headings (`.lp-heading`) should appear above each gear table section
3. Every weight/price/quantity in a table row must use `font-family: var(--font-mono)`
4. Sidebar section labels (`Lists`, `Gear`) always use `.lp-label-xs` — uppercase, 11px, muted
5. Do not use `font-style: italic` anywhere in the app UI — italic is reserved for DM Serif Display on the marketing/landing pages only

## Tailwind class equivalents

```js
// In tailwind.config.js, these fontFamily keys are available:
// font-display → DM Serif Display
// font-ui      → Figtree
// font-mono    → DM Mono

// Usage in className:
'font-display text-lp-xl font-normal tracking-tight'; // → .lp-title
'font-ui text-lp-lg font-semibold'; // → .lp-heading
'font-mono text-lp-base tabular-nums'; // → .lp-data
'font-ui text-lp-xs font-medium uppercase tracking-wider text-charcoal-300'; // → .lp-label-xs
```
