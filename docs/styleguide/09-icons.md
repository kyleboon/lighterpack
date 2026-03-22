# 09 — Icons

## System

Use **inline SVG only**. No icon font libraries (they cause flash-of-unstyled-content and are hard to customise). No emoji.

All icons are 16×16 in gear table rows and UI chrome. Decorative/feature icons on the landing page may be up to 24×24.

```css
/* Standard size in UI */
.lp-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: block;
}

/* Landing page feature icons */
.lp-icon-lg {
    width: 20px;
    height: 20px;
}
```

## Style rules

- `stroke-width: 1.5` on all path/line strokes (not 1, not 2)
- `stroke-linecap: round`
- `stroke-linejoin: round`
- `fill: none` unless the icon is explicitly filled (e.g. a solid dot)
- Color is always `currentColor` — icons inherit from their parent text color

```html
<!-- Correct pattern — color inherits from button/link -->
<button class="lp-btn lp-btn-icon" aria-label="Add a link for this item">
    <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" />
        <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" />
    </svg>
</button>
```

## Icon inventory

| Icon                    | Usage                                  | SVG path sketch                     |
| ----------------------- | -------------------------------------- | ----------------------------------- |
| Link (chain)            | Add a URL to a gear item               | Two linked chain segments           |
| Shirt / worn            | Mark item as worn                      | Simple shirt silhouette             |
| Fork-knife / consumable | Mark item as consumable                | Fork and knife crossed              |
| Star                    | Favorite / star item                   | 5-point star                        |
| Camera / image          | Upload item image                      | Camera body with lens circle        |
| Share                   | Share list                             | Three connected dots                |
| Settings (gear)         | Settings panel                         | Gear cog                            |
| Chevron down ▾          | Unit selector, expand                  | `M3 6l5 5 5-5`                      |
| × (close/remove)        | Remove item, close modal               | Diagonal cross `M4 4l8 8M12 4l-8 8` |
| Upload                  | Import CSV                             | Arrow pointing up into tray         |
| Download                | Export CSV                             | Arrow pointing down from tray       |
| Copy                    | Copy a list                            | Two overlapping rects               |
| Drag handle             | Reorder items (three horizontal lines) | `M4 8h8 M4 12h8 M4 4h8` with dots   |

## Accessibility

Every icon button must have an `aria-label` or `title` that describes the action, not the icon:

```html
<!-- WRONG -->
<button aria-label="link icon">...</button>

<!-- CORRECT -->
<button aria-label="Add a link for this item">...</button>
<button aria-label="Mark as worn">...</button>
<button aria-label="Remove item">...</button>
```

Decorative icons (e.g. the icon next to a feature card title on the landing page) should have `aria-hidden="true"`:

```html
<div class="feature-icon" aria-hidden="true">
    <svg ...>...</svg>
</div>
<div class="feature-title">Unlimited gear lists</div>
```
