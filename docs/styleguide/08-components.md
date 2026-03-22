# 08 — Components

## Stat cards

Compact metric display used in the chart legend area and wherever summary numbers appear.

```css
.lp-stat-card {
    background: var(--stone-100);
    border-radius: var(--radius-md);
    padding: 10px 14px;
}

.lp-stat-card-num {
    font-family: var(--font-mono);
    font-size: var(--text-xl); /* 20px */
    font-weight: 500;
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
    line-height: 1;
}

.lp-stat-card-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: 3px;
}
```

```html
<div class="lp-stat-card">
    <div class="lp-stat-card-num">371</div>
    <div class="lp-stat-card-label">base oz</div>
</div>
```

Stat cards are displayed in a 3-column grid in the app header:

```html
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
    <div class="lp-stat-card">...</div>
    <div class="lp-stat-card">...</div>
    <div class="lp-stat-card">...</div>
</div>
```

---

## Donut chart

The donut chart is rendered as an SVG `<circle>` with `stroke-dasharray` / `stroke-dashoffset` for each segment, or via a charting library. The hole is always 38–40% of the diameter (the white circle inside).

### Color assignment

Categories are assigned colors from the data palette in order:

```js
const DATA_COLORS = [
    'var(--data-bike)', // first category
    'var(--data-shelter)', // second
    'var(--data-food)', // third
    'var(--data-clothing)', // fourth
    'var(--data-sleep)', // fifth
    'var(--data-other)', // sixth and beyond (cycle)
];
```

### Legend

```html
<table class="lp-chart-legend">
    <tbody>
        <tr>
            <td>
                <span
                    style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--data-bike);margin-right:6px"
                ></span
                >Bike
            </td>
            <td>$13.00</td>
            <td class="legend-weight">350 oz</td>
        </tr>
        <tr>
            <td><span style="...background:var(--data-shelter)"></span>Shelter</td>
            <td>$0.00</td>
            <td class="legend-weight">32 oz</td>
        </tr>
        <!-- ... -->
        <tr class="legend-total">
            <td colspan="2">Total</td>
            <td class="legend-weight">382 oz ▾</td>
        </tr>
        <tr class="legend-base">
            <td colspan="2">Consumable</td>
            <td class="legend-weight">8 oz</td>
        </tr>
        <tr class="legend-base">
            <td colspan="2">Worn</td>
            <td class="legend-weight">3 oz</td>
        </tr>
        <tr>
            <td colspan="2"><strong>Base Weight</strong></td>
            <td class="legend-weight"><strong>371 oz</strong></td>
        </tr>
    </tbody>
</table>
```

---

## Gear table row

Each gear item row supports inline editing. Every editable cell becomes an `.lp-cell-input` on click.

```html
<tr class="lp-gear-row">
    <!-- Image (optional, shown if item has one) -->
    <td class="lp-col-image">
        <img src="..." alt="" width="40" height="40" style="border-radius:4px;object-fit:cover;" />
    </td>

    <!-- Name + description (inline edit) -->
    <td class="lp-col-name">
        <input class="lp-cell-input" type="text" value="Pedro's Tire Levers" aria-label="Item name" />
        <input
            class="lp-cell-input lp-cell-description"
            type="text"
            value="Description"
            aria-label="Item description"
        />
    </td>

    <!-- Action icons -->
    <td class="lp-col-actions">
        <div style="display:flex;gap:2px;align-items:center;">
            <button class="lp-btn lp-btn-icon" title="Add a link for this item" aria-label="Add a link for this item">
                <!-- link icon 16×16 -->
            </button>
            <button class="lp-btn lp-btn-icon" title="Mark as worn" aria-label="Mark as worn">
                <!-- worn icon 16×16 -->
            </button>
            <button class="lp-btn lp-btn-icon" title="Mark as consumable" aria-label="Mark as consumable">
                <!-- consumable icon 16×16 -->
            </button>
            <button class="lp-btn lp-btn-icon" title="Star item" aria-label="Star item">
                <!-- star icon 16×16 -->
            </button>
        </div>
    </td>

    <!-- Price (inline edit) -->
    <td class="lp-col-price">
        <input
            class="lp-cell-input lp-input-weight"
            type="number"
            value="6.50"
            min="0"
            step="0.01"
            aria-label="Price"
        />
    </td>

    <!-- Weight (inline edit + unit select) -->
    <td class="lp-col-weight">
        <input class="lp-cell-input lp-input-weight" type="number" value="3" min="0" step="0.1" aria-label="Weight" />
        <select class="lp-select" aria-label="Weight unit">
            <option value="oz" selected>oz</option>
            <option value="lb">lb</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
        </select>
    </td>

    <!-- Quantity (stepper) -->
    <td class="lp-col-qty">
        <input class="lp-cell-input lp-input-weight" type="number" value="2" min="1" step="1" aria-label="Quantity" />
    </td>

    <!-- Remove -->
    <td class="lp-col-remove">
        <button class="lp-btn lp-btn-icon" aria-label="Remove item">×</button>
    </td>
</tr>
```

---

## Settings panel (dropdown)

Triggered by the Settings button in the content header. Renders as a popover below the trigger.

```html
<div class="lp-settings-panel" role="dialog" aria-label="List settings">
    <label class="lp-checkbox-row"> <input type="checkbox" class="lp-checkbox" checked /> Item images </label>
    <label class="lp-checkbox-row"> <input type="checkbox" class="lp-checkbox" checked /> Item prices </label>
    <label class="lp-checkbox-row"> <input type="checkbox" class="lp-checkbox" checked /> Worn items </label>
    <label class="lp-checkbox-row"> <input type="checkbox" class="lp-checkbox" checked /> Consumable items </label>
    <label class="lp-checkbox-row"> <input type="checkbox" class="lp-checkbox" checked /> List descriptions </label>
    <div
        style="border-top: 0.5px solid var(--stone-200); margin-top: 8px; padding-top: 10px; display: flex; align-items: center; gap: 8px;"
    >
        <label class="lp-form-label" style="margin:0">Currency:</label>
        <input type="text" class="lp-input" value="$" style="width:48px;text-align:center;" />
    </div>
</div>
```

```css
.lp-settings-panel {
    background: #fff;
    border: 0.5px solid var(--stone-300);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    min-width: 200px;
    box-shadow: none; /* no drop shadows in this system */
}
```

---

## Share panel (popover)

```html
<div class="lp-share-panel" role="dialog" aria-label="Share your list">
    <div class="lp-label" style="margin-bottom:6px">Share your list</div>
    <input
        class="lp-share-input"
        type="text"
        value="https://lighterpack.com/r/vf6tcz"
        readonly
        onclick="this.select()"
    />

    <div class="lp-label" style="margin: 12px 0 6px">Embed your list</div>
    <textarea class="lp-textarea" readonly rows="2" style="font-family:var(--font-mono);font-size:11px">
&lt;script src="https://lighterpack.com/e/vf6tcz"&gt;&lt;/script&gt;
&lt;div id="vf6tcz"&gt;&lt;/div&gt;
  </textarea
    >

    <a href="/list/export.csv" class="lp-link-utility" style="margin-top:10px;display:inline-flex">
        <!-- download icon -->
        Export to CSV
    </a>
</div>
```

---

## User account menu

Triggered by "Signed in as [username]" in the topbar.

```html
<div class="lp-user-menu" role="menu">
    <a href="/settings" class="lp-nav-link" role="menuitem">Account settings</a>
    <a href="/help" class="lp-nav-link" role="menuitem">Help</a>
    <a href="/signout" class="lp-nav-link" role="menuitem">Sign out</a>
</div>
```

```css
.lp-user-menu {
    background: var(--charcoal-900);
    border: 0.5px solid rgba(200, 198, 188, 0.12);
    border-radius: var(--radius-lg);
    padding: 6px;
    min-width: 180px;
}
```

---

## Help modal

Full-page overlay (not a small popover). Content is plain text — no icons, no decorative elements.

```html
<div class="lp-overlay">
    <div class="lp-modal" style="max-width:640px">
        <h2 class="lp-title" style="margin-bottom:var(--space-5)">Help</h2>

        <p class="lp-label" style="margin-bottom:8px">Getting started</p>
        <ol class="lp-body-sm" style="padding-left:20px;line-height:2">
            <li>Click on things to edit them. Give your list and category a name.</li>
            <li>Add new categories and items to your list.</li>
            <li>When you're done, share your list with others!</li>
        </ol>

        <hr style="border:none;border-top:0.5px solid var(--stone-200);margin:20px 0" />

        <p class="lp-subheading" style="margin-bottom:8px">Quantity and worn values</p>
        <p class="lp-body-sm">
            If you have multiple quantity of an item and mark that item as worn, only the first quantity will count
            towards your worn weight...
        </p>

        <hr style="border:none;border-top:0.5px solid var(--stone-200);margin:20px 0" />

        <p class="lp-subheading" style="margin-bottom:8px">Items in multiple lists</p>
        <p class="lp-body-sm">
            If you copy your list or drag an item from the gear library into a second list, those items are now
            <strong>linked</strong>...
        </p>

        <p style="margin-top:20px">
            <a href="mailto:help@lighterpack.com" class="lp-link">More help available via email.</a>
        </p>
    </div>
</div>
```

---

## Category header row

```html
<div class="lp-category-header">
    <input class="lp-cell-input lp-heading" type="text" value="Bike" aria-label="Category name" />
    <!-- category-level controls (reorder handle, delete) -->
</div>
```

```css
.lp-category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-2);
}
```

---

## Image upload trigger

Small image icon in the leftmost column of a gear table row. Clicking opens a file picker.

```css
.lp-img-cell {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--stone-200);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    flex-shrink: 0;
}
.lp-img-cell:hover {
    background: var(--stone-300);
}
.lp-img-cell img {
    width: 40px;
    height: 40px;
    object-fit: cover;
}
```
