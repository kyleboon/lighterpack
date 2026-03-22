# 07 — Layout

## Page structure

The app has a two-zone layout: a persistent dark sidebar on the left, and a light content area on the right. This is the defining structural signature of LighterPack and must be preserved.

```
┌─────────────────────────────────────────────────────────┐
│ nav (56px, sticky, charcoal-900) — app topbar           │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   Sidebar    │   Content area                          │
│  200px wide  │   flex: 1                               │
│  charcoal-   │   stone-50 background                   │
│  900 bg      │                                          │
│              │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### App shell CSS

```css
.lp-app {
    display: flex;
    min-height: 100vh;
}

/* Sidebar */
.lp-sidebar {
    width: 200px;
    flex-shrink: 0;
    background: var(--charcoal-900);
    padding: 20px 14px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    position: sticky;
    top: 0;
    height: 100vh;
}

/* Main content */
.lp-content {
    flex: 1;
    min-width: 0; /* prevents flex blowout */
    background: var(--stone-50);
    overflow-y: auto;
}

/* Content inner — provides padding and max-width */
.lp-content-inner {
    max-width: 1100px;
    padding: 32px 36px;
}
```

---

## Sidebar anatomy

```
.lp-sidebar
├── .lp-wordmark + .lp-wordmark-beta   (logo)
├── [nav section]
│   ├── .lp-label-xs                   ("Lists")
│   ├── .lp-nav-link.active            (active list)
│   ├── .lp-nav-link                   (other lists)
│   └── .lp-action-link                ("+ Add new list")
├── [gear section]
│   ├── .lp-label-xs                   ("Gear")
│   ├── input.lp-input                 (gear search)
│   └── [gear library items]
└── [footer — pushed to bottom]
    ├── .lp-link-subtle                ("Account settings")
    ├── .lp-link-subtle                ("Help")
    └── .lp-link-subtle                ("Sign out")
```

The sidebar footer is pushed to the bottom with `margin-top: auto` on a wrapper div.

---

## Content area — list view

```
.lp-content-inner
├── .lp-content-header
│   ├── .lp-title                      (list name — DM Serif Display)
│   └── [Share, Settings, User nav]    (right-aligned controls)
├── .lp-chart-block                    (donut + legend + stats table)
├── .lp-list-description               (markdown textarea)
└── [categories]
    └── .lp-category (repeated)
        ├── .lp-heading                (category name)
        ├── .lp-gear-table             (items table)
        └── .lp-action-link            ("+ Add new item")
```

### Content header

```css
.lp-content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-4);
    border-bottom: 0.5px solid var(--stone-200);
}

.lp-header-controls {
    display: flex;
    align-items: center;
    gap: var(--space-4);
}
```

---

## Gear table layout

The gear table is the most important component in the app. It must be dense, scannable, and support inline editing on every cell.

```
┌────────────────────────────────────────────────────────┬────────┬──────────┬─────┐
│ Name                          [actions]                │ Price  │ Weight   │ qty │
├────────────────────────────────────────────────────────┼────────┼──────────┼─────┤
│ Park Tool GP-2 Super Patch Kit  [icon][icon]           │  0.00  │  6 oz ▾  │  1  │
│ Pedro's Tire Levers             [icon][icon]           │  6.50  │  3 oz ▾  │  2  │
│ Lezyne Micro Floor Drive HV     [icon]                 │  0.00  │  2 oz ▾  │  1  │
├────────────────────────────────────────────────────────┼────────┼──────────┼─────┤
│ + Add new item                                         │ $13.00 │ 350 oz   │  6  │
└────────────────────────────────────────────────────────┴────────┴──────────┴─────┘
```

Column widths:

- Name + description: `flex: 1` (takes all remaining space)
- Action icons: `auto` (only as wide as the icons)
- Price: `72px`
- Weight: `90px` (value + unit selector)
- Qty: `56px` (value + stepper)
- Remove (`×`): `24px`

```css
.lp-gear-table {
    width: 100%;
    border-collapse: collapse;
}

.lp-gear-table th {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-align: right;
    padding: 0 8px 8px;
    border-bottom: 0.5px solid var(--stone-300);
}
.lp-gear-table th:first-child {
    text-align: left;
    padding-left: 0;
}

.lp-gear-table td {
    padding: 6px 8px;
    border-bottom: 0.5px solid var(--stone-200);
    vertical-align: middle;
}
.lp-gear-table td:first-child {
    padding-left: 0;
}

/* Right-align numeric columns */
.lp-col-price,
.lp-col-weight,
.lp-col-qty {
    text-align: right;
    white-space: nowrap;
}

/* Row hover */
.lp-gear-table tr:hover td {
    background: var(--stone-100);
}
```

---

## Donut chart block

```css
.lp-chart-block {
    display: flex;
    align-items: center;
    gap: 32px;
    margin-bottom: var(--space-8);
}

.lp-chart-donut {
    width: 180px;
    height: 180px;
    flex-shrink: 0;
}

.lp-chart-legend {
    flex: 1;
}

.lp-chart-legend table {
    width: 100%;
    border-collapse: collapse;
}

.lp-chart-legend td {
    padding: 4px 8px;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
}

.lp-chart-legend .legend-weight {
    font-family: var(--font-mono);
    text-align: right;
    color: var(--color-text-secondary);
}

.lp-chart-legend .legend-total {
    font-weight: 600;
    border-top: 0.5px solid var(--stone-200);
}

.lp-chart-legend .legend-base {
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
}
```

---

## Modals and overlays

Do not use `position: fixed` for modals — it causes issues in embedded contexts. Use a full-height overlay div instead.

```css
.lp-overlay {
    position: absolute;
    inset: 0;
    background: rgba(30, 30, 28, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
}

.lp-modal {
    background: var(--stone-50);
    border-radius: var(--radius-xl);
    border: 0.5px solid var(--stone-300);
    padding: var(--space-8);
    max-width: 480px;
    width: 100%;
}

.lp-modal-title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    margin-bottom: var(--space-4);
}
```

---

## Responsive breakpoints

LighterPack is a power-user tool — mobile is secondary. Design desktop-first.

| Breakpoint | Width         | Behavior                                                 |
| ---------- | ------------- | -------------------------------------------------------- |
| Desktop    | `≥ 900px`     | Full two-zone layout (sidebar + content)                 |
| Tablet     | `600px–899px` | Sidebar collapses to icon-only or hidden; hamburger menu |
| Mobile     | `< 600px`     | Single column; sidebar becomes bottom sheet or top nav   |

```css
@media (max-width: 900px) {
    .lp-app {
        flex-direction: column;
    }
    .lp-sidebar {
        width: 100%;
        height: auto;
        position: static;
        flex-direction: row;
    }
}

@media (max-width: 600px) {
    .lp-content-inner {
        padding: 16px;
    }
    .lp-chart-block {
        flex-direction: column;
    }
}
```

---

## Spacing rules

- Content inner padding: `32px 36px` on desktop, `16px` on mobile
- Section gap (between chart and first category): `var(--space-8)` (32px)
- Category gap (between gear tables): `var(--space-10)` (40px)
- Sidebar section gap: `var(--space-5)` (20px)
- Sidebar padding: `20px 14px`
