# 04 — Buttons

There are exactly **five button variants** in the system. Do not create new ones.

---

## Base styles

All buttons share these properties:

```css
.lp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2); /* 8px between icon and label */
    font-family: var(--font-ui);
    font-size: var(--text-sm); /* 13px */
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    border: none;
    outline: none;
    text-decoration: none;
    border-radius: var(--radius-md); /* 6px */
    padding: 8px 14px;
    height: 34px;
    transition:
        background-color var(--transition-fast),
        color var(--transition-fast),
        border-color var(--transition-fast),
        transform var(--transition-fast);
}

.lp-btn:focus-visible {
    outline: 2px solid var(--amber-400);
    outline-offset: 2px;
}

.lp-btn:active {
    transform: scale(0.98);
}

.lp-btn:disabled,
.lp-btn[aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
}
```

---

## Variants

### 1. Primary — amber CTA

Use for the most important action on a surface. Only one primary button per view.

**Usage:** Share list, Register, Sign in, Save settings

```css
.lp-btn-primary {
    background-color: var(--amber-400);
    color: var(--charcoal-900);
    font-weight: 600;
}
.lp-btn-primary:hover {
    background-color: var(--amber-600);
    color: #fff;
}
```

```html
<button class="lp-btn lp-btn-primary">Share list</button>
<a href="/register" class="lp-btn lp-btn-primary">Get started free</a>
```

---

### 2. Secondary — outlined

Use for secondary actions alongside a primary button, or as the sole action when amber would be too prominent.

**Usage:** Settings, Import CSV, Copy a list, Cancel

```css
.lp-btn-secondary {
    background-color: transparent;
    color: var(--color-text-primary);
    border: 0.5px solid var(--color-border-strong);
}
.lp-btn-secondary:hover {
    background-color: var(--stone-100);
    border-color: var(--stone-300);
}
```

```html
<button class="lp-btn lp-btn-secondary">Settings</button> <button class="lp-btn lp-btn-secondary">Import CSV</button>
```

---

### 3. Ghost — inline additive action

Use for `+` style actions that live inline with content, not in a toolbar.

**Usage:** + Add new item, + Add new list, + Add new category

```css
.lp-btn-ghost {
    background-color: transparent;
    color: var(--amber-400);
    padding: 6px 4px;
    height: auto;
    border-radius: var(--radius-sm);
}
.lp-btn-ghost:hover {
    color: var(--amber-600);
    background-color: var(--amber-50);
}
```

```html
<!-- Ghost buttons always use the prefix "+" in the label -->
<button class="lp-btn lp-btn-ghost">+ Add new item</button>
<button class="lp-btn lp-btn-ghost">+ Add new list</button>
```

> **Note:** The `+` is part of the button label text, not a separate icon element.

---

### 4. Danger — destructive actions

Use only for actions that delete or permanently remove data. Always pair with a confirmation step for irreversible actions.

**Usage:** Delete list, Remove item, Clear all

```css
.lp-btn-danger {
    background-color: transparent;
    color: #c05848;
    border: 0.5px solid rgba(192, 88, 72, 0.3);
}
.lp-btn-danger:hover {
    background-color: rgba(192, 88, 72, 0.08);
    border-color: rgba(192, 88, 72, 0.5);
}
```

```html
<button class="lp-btn lp-btn-danger">Remove item</button>
```

---

### 5. Sidebar — on dark background

Use exclusively inside the dark sidebar panel. Do not use on light content backgrounds.

**Usage:** Import CSV, Copy a list (in the sidebar dropdown)

```css
.lp-btn-sidebar {
    background-color: transparent;
    color: var(--charcoal-100);
    border: 0.5px solid rgba(200, 198, 188, 0.15);
}
.lp-btn-sidebar:hover {
    background-color: var(--charcoal-800);
    border-color: rgba(200, 198, 188, 0.25);
}
```

```html
<button class="lp-btn lp-btn-sidebar">Import CSV</button>
```

---

## Icon button

For the small square icon buttons in gear table rows (link, worn, consumable, star, remove).

```css
.lp-btn-icon {
    width: 30px;
    height: 30px;
    padding: 0;
    border-radius: var(--radius-md);
    background-color: transparent;
    color: var(--color-text-muted);
    border: none;
}
.lp-btn-icon:hover {
    background-color: var(--stone-200);
    color: var(--color-text-primary);
}
```

```html
<button class="lp-btn lp-btn-icon" aria-label="Add a link for this item">
    <!-- 16×16 SVG icon -->
    <svg width="16" height="16" ...></svg>
</button>
```

---

## Size modifiers

```css
/* Small — use in tight spaces, dropdowns */
.lp-btn-sm {
    font-size: var(--text-xs); /* 11px */
    padding: 5px 10px;
    height: 26px;
    border-radius: var(--radius-sm);
}

/* Large — use for primary CTA on landing / register page */
.lp-btn-lg {
    font-size: var(--text-base); /* 15px */
    padding: 11px 20px;
    height: 42px;
    font-weight: 600;
    border-radius: var(--radius-lg);
}

/* Full width */
.lp-btn-full {
    width: 100%;
}
```

---

## Composition rules

- **One primary button per view.** If a view has multiple CTAs, one is primary and the rest are secondary or ghost.
- **Labels are sentence case.** "Add new list" not "Add New List" not "ADD NEW LIST".
- **Ghost buttons always start with `+`.** This is the visual language for additive inline actions.
- **Icon buttons always have `aria-label`.** The label describes the action, not the icon ("Add a link for this item" not "link icon").
- **Never use a button where a link is appropriate.** Navigation goes in `<a>` tags. Mutations (add, remove, save) go in `<button>` tags.

## Tailwind class equivalents

```js
// Base (always include first):
'inline-flex items-center justify-center gap-2 font-ui text-lp-sm font-medium leading-none whitespace-nowrap cursor-pointer rounded-lp-md px-[14px] h-[34px] transition-all duration-lp-fast outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none';

// + variant:
'bg-amber-400 text-charcoal-900 font-semibold hover:bg-amber-600 hover:text-white'; // primary
'bg-transparent border border-lp border-charcoal-500/30 hover:bg-stone-100'; // secondary
'bg-transparent text-amber-400 px-1 h-auto rounded-lp-sm hover:text-amber-600 hover:bg-amber-50'; // ghost
'bg-transparent text-[#C05848] border border-lp border-[#C05848]/30 hover:bg-[#C05848]/10'; // danger
'bg-transparent text-charcoal-100 border border-lp border-charcoal-100/15 hover:bg-charcoal-800'; // sidebar
```
