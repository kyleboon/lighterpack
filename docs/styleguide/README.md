# LighterPack Design System

This style guide is the source of truth for the LighterPack redesign. It is written for both humans and Claude Code — every section includes rationale, implementation rules, and copy-paste-ready code.

## Directory structure

```
styleguide/
├── README.md                  ← this file (overview + rules for Claude Code)
├── 01-brand.md                ← brand voice, personality, dos and don'ts
├── 02-tokens.md               ← color, typography, spacing, radius, motion
├── 03-typography.md           ← type scale, usage rules, CSS classes
├── 04-buttons.md              ← all button variants, states, Tailwind classes
├── 05-links.md                ← link variants, nav patterns
├── 06-forms.md                ← inputs, labels, validation states
├── 07-layout.md               ← grid, sidebar, page structure
├── 08-components.md           ← gear table, stat cards, donut chart, modals
├── 09-icons.md                ← icon system, sizing, usage rules
├── 10-accessibility.md        ← WCAG targets, focus states, ARIA patterns
├── tokens/
│   ├── tokens.css             ← CSS custom properties (single source of truth)
│   └── tailwind.config.js     ← Tailwind theme extension
```

---

## How to use this with Claude Code

When asking Claude Code to implement a component or page, include this instruction at the top of your prompt:

```
Read the LighterPack style guide at styleguide/README.md before writing any code.
Follow all rules in the relevant sections. Do not introduce colors, fonts, spacing,
or component patterns that are not defined in the style guide.
```

### What Claude Code should always do

- Pull color values exclusively from `tokens/tokens.css` custom properties — never hardcode hex values
- Use `font-family: var(--font-display)` for page/list titles, `var(--font-ui)` for all UI text, `var(--font-mono)` for weights, prices, and URLs
- Use class names prefixed with `lp-` for all custom styles
- Check `08-components.md` before building any gear-related UI — the table, stat card, and donut chart patterns are already defined
- Follow the sidebar-dark / content-light two-zone layout defined in `07-layout.md`
- Never introduce a new button variant — use the five defined in `04-buttons.md`

### What Claude Code should never do

- Introduce new accent colors (the palette is fixed — see `02-tokens.md`)
- Use Inter, Roboto, Arial, or any system sans as a primary font
- Use `font-weight: 700` or `800` — the system uses `400`, `500`, and `600` only
- Add drop shadows or gradients to UI surfaces (chart gradients are the only exception)
- Create modal dialogs with `position: fixed` (use the layout pattern in `07-layout.md`)
- Add a global `box-shadow` to cards — borders only

---

## Quick-reference: the five non-negotiables

These rules must be followed in every file, every component, every PR.

| Rule                         | Detail                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Amber accent only**        | `var(--amber-400)` for CTAs, active states, and `+` actions. No other accent color.                  |
| **Dark sidebar**             | Left panel is always `var(--charcoal-900)`. Content area is `var(--stone-50)` or `var(--stone-100)`. |
| **Three fonts, three roles** | Display → headings/titles. UI → all interface text. Mono → numbers/weights/URLs.                     |
| **Inline editing**           | Click-to-edit everywhere in the app. No separate edit mode. No save button.                          |
| **Weight in DM Mono**        | Every oz, lb, and price value uses `font-family: var(--font-mono)` with `tabular-nums`.              |
