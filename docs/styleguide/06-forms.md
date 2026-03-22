# 06 — Forms

## Inputs

### Text input

```css
.lp-input {
    width: 100%;
    height: 36px;
    font-family: var(--font-ui);
    font-size: var(--text-sm); /* 13px */
    color: var(--color-text-primary);
    background: #fff;
    border: 0.5px solid var(--stone-300);
    border-radius: var(--radius-md); /* 6px */
    padding: 0 10px;
    outline: none;
    transition: border-color var(--transition-fast);
}
.lp-input:hover {
    border-color: var(--stone-500);
}
.lp-input:focus {
    border-color: var(--amber-400);
}
.lp-input::placeholder {
    color: var(--color-text-muted);
}
```

```html
<input type="text" class="lp-input" placeholder="Item name" />
```

### Inline cell input (gear table)

The gear table uses direct click-to-edit. When a cell is in edit mode it becomes an input visually indistinguishable from a standard input, but without a surrounding border on initial render.

```css
/* Resting state — looks like plain text */
.lp-cell-input {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    background: transparent;
    border: 0.5px solid transparent;
    border-radius: var(--radius-sm);
    padding: 3px 6px;
    outline: none;
    width: 100%;
    cursor: text;
    transition:
        border-color var(--transition-fast),
        background var(--transition-fast);
}
/* Edit mode — triggered on click/focus */
.lp-cell-input:focus {
    background: #fff;
    border-color: var(--amber-400);
    cursor: text;
}
```

### Weight / number input

```css
/* Inherits from .lp-input; adds mono font and right-alignment */
.lp-input-weight {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    text-align: right;
    width: 72px;
    padding: 0 8px;
}
```

### Textarea

```css
.lp-textarea {
    width: 100%;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    background: #fff;
    border: 0.5px solid var(--stone-300);
    border-radius: var(--radius-md);
    padding: 8px 10px;
    outline: none;
    resize: vertical;
    min-height: 80px;
    line-height: 1.6;
    transition: border-color var(--transition-fast);
}
.lp-textarea:focus {
    border-color: var(--amber-400);
}
.lp-textarea::placeholder {
    color: var(--color-text-muted);
}
```

```html
<!-- List description field -->
<textarea class="lp-textarea" placeholder="List description (Markdown supported)"></textarea>
```

### Select / dropdown

```css
.lp-select {
    height: 30px;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    background: #fff;
    border: 0.5px solid var(--stone-300);
    border-radius: var(--radius-sm);
    padding: 0 6px;
    outline: none;
    cursor: pointer;
    transition: border-color var(--transition-fast);
}
.lp-select:focus {
    border-color: var(--amber-400);
}
```

```html
<!-- Unit selector in gear table row -->
<select class="lp-select" aria-label="Weight unit">
    <option value="oz">oz</option>
    <option value="lb">lb</option>
    <option value="g">g</option>
    <option value="kg">kg</option>
</select>
```

---

## Labels

```css
.lp-form-label {
    display: block;
    font-family: var(--font-ui);
    font-size: var(--text-xs); /* 11px */
    font-weight: 500;
    letter-spacing: 0.04em;
    color: var(--color-text-secondary);
    margin-bottom: 5px;
}
```

```html
<div class="lp-form-group">
    <label class="lp-form-label" for="username">Username</label>
    <input id="username" type="text" class="lp-input" />
</div>
```

---

## Checkboxes — settings panel

Used in the Settings dropdown (Item images, Item prices, Worn items, etc.).

```css
.lp-checkbox-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 4px 0;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    cursor: pointer;
    user-select: none;
}
.lp-checkbox {
    width: 15px;
    height: 15px;
    accent-color: var(--amber-400);
    flex-shrink: 0;
}
```

```html
<label class="lp-checkbox-row">
    <input type="checkbox" class="lp-checkbox" checked />
    Item images
</label>
<label class="lp-checkbox-row">
    <input type="checkbox" class="lp-checkbox" checked />
    Item prices
</label>
```

---

## Validation states

```css
/* Error */
.lp-input.error,
.lp-input[aria-invalid='true'] {
    border-color: #c05848;
}
.lp-form-error {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: #c05848;
    margin-top: 4px;
}

/* Success (use sparingly — only on account creation, not inline editing) */
.lp-input.success {
    border-color: #5a8c6a;
}
```

```html
<div class="lp-form-group">
    <label class="lp-form-label" for="email">Email</label>
    <input id="email" type="email" class="lp-input error" aria-invalid="true" aria-describedby="email-error" />
    <span id="email-error" class="lp-form-error">Enter a valid email address.</span>
</div>
```

---

## Share URL input

Styled differently — appears as a highlighted, copyable field, not a standard form input.

```css
.lp-share-input {
    width: 100%;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--slate-400);
    background: var(--slate-50);
    border: 1px solid var(--slate-200);
    border-radius: var(--radius-md);
    padding: 8px 10px;
    outline: none;
    cursor: text;
}
.lp-share-input:focus {
    border-color: var(--slate-400);
}
```

```html
<input
    type="text"
    class="lp-share-input"
    value="https://lighterpack.com/r/vf6tcz"
    readonly
    onclick="this.select()"
    aria-label="Share URL — click to select all"
/>
```

---

## Form layout rules

- **Labels above inputs**, never beside them (except in tight inline table contexts)
- **Error messages below the input**, never above
- **Form groups** use 14px vertical gap between them
- **Submit buttons** are always `lp-btn lp-btn-primary lp-btn-full` in modal/page contexts
- **Character currency field** (`$`, `£`, etc.) uses a plain text prefix — not an input addon pattern
