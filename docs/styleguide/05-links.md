# 05 — Links

Seven link patterns cover every use case in the app and landing page. Each is tied to a specific context — do not substitute patterns.

---

## Standard link

General-purpose inline links within prose or descriptions.

```css
.lp-link {
    color: var(--slate-400);
    text-decoration: none;
    transition: color var(--transition-fast);
}
.lp-link:hover {
    color: var(--slate-600);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
}
.lp-link:focus-visible {
    outline: 2px solid var(--amber-400);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
}
```

```html
<a href="/community" class="lp-link">LighterPack community</a>
```

---

## Gear item link

Used for gear names in table rows that link to a product page or description. Bold enough to be scannable, subtle enough not to distract from weight values.

```css
.lp-link-item {
    color: var(--slate-400);
    text-decoration: none;
    font-weight: 500;
}
.lp-link-item:hover {
    color: var(--slate-600);
    text-decoration: underline;
    text-underline-offset: 2px;
}
```

```html
<a href="https://pedros.com/tire-levers" class="lp-link-item">Pedro's Tire Levers</a>
```

---

## Share URL link

Monospace, copyable. Used in the "Share your list" input and anywhere the share URL appears as readable text.

```css
.lp-link-url {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--slate-400);
    text-decoration: none;
    word-break: break-all;
}
.lp-link-url:hover {
    color: var(--slate-600);
    text-decoration: underline;
    text-underline-offset: 3px;
}
```

```html
<a href="https://lighterpack.com/r/vf6tcz" class="lp-link-url"> https://lighterpack.com/r/vf6tcz </a>
```

---

## Action link — additive

Used for "Add new list" and "Add new item" type actions that appear inline with content, not in a toolbar. These always begin with `+`.

```css
.lp-action-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--amber-400);
    text-decoration: none;
    cursor: pointer;
    transition: color var(--transition-fast);
}
.lp-action-link:hover {
    color: var(--amber-600);
}
```

```html
<!-- Note: the + is part of the visible text, not a pseudo-element -->
<a href="#" class="lp-action-link">+ Add new list</a>
<button class="lp-action-link">+ Add new item</button>
```

---

## Navigation link — sidebar

Links inside the dark sidebar panel. Hover adds a subtle background fill; active state turns the text amber.

```css
.lp-nav-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 5px 8px;
    border-radius: var(--radius-md);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--charcoal-300);
    text-decoration: none;
    transition:
        background-color var(--transition-fast),
        color var(--transition-fast);
}
.lp-nav-link:hover {
    color: var(--charcoal-100);
    background-color: var(--charcoal-800);
}
.lp-nav-link.active {
    color: var(--amber-400);
    font-weight: 500;
}
.lp-nav-link.active:hover {
    background-color: rgba(232, 162, 32, 0.08);
}
```

```html
<nav>
    <a href="/list/bike-camping" class="lp-nav-link active">Bike Camping</a>
    <a href="/list/bird-watching" class="lp-nav-link">Bird Watching</a>
</nav>
```

---

## Subtle link — secondary navigation

For low-priority links like "Forgot username/password?", "Help", "Sign out", "Skip registration".

```css
.lp-link-subtle {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
}
.lp-link-subtle:hover {
    color: var(--color-text-secondary);
    text-decoration: underline;
    text-underline-offset: 3px;
}
```

```html
<a href="/forgot" class="lp-link-subtle">Forgot username/password?</a>
<a href="/help" class="lp-link-subtle">Help</a>
<a href="/signout" class="lp-link-subtle">Sign out</a>
```

---

## Utility link — with leading icon

For export/import actions that sit below content (e.g. "Export to CSV" below the list table).

```css
.lp-link-utility {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--slate-400);
    text-decoration: none;
    transition: color var(--transition-fast);
}
.lp-link-utility:hover {
    color: var(--slate-600);
}
```

```html
<a href="/list/export.csv" class="lp-link-utility">
    <!-- 16×16 download icon -->
    <svg width="16" height="16" ...></svg>
    Export to CSV
</a>
```

---

## Rules

- **`<a>` for navigation, `<button>` for actions.** A link that navigates somewhere is `<a>`. A link that triggers a mutation (add, remove, save) should be a `<button>` with `lp-action-link` styling.
- **Never underline by default.** Underline appears only on hover (or on `.lp-link-url`, which inherits it).
- **Active nav items never show underline** — color alone signals the active state.
- **Sentence case always.** "Add new list" not "Add New List".
- **All links need `:focus-visible` styles.** The default amber outline ring covers this if you use the classes above.
