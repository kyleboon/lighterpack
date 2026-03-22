# 02 — Design Tokens

All tokens live in `tokens/tokens.css` as CSS custom properties. This is the **single source of truth**. Never hardcode a hex value in a component file.

---

## Color

### Charcoal Trail — sidebar and dark chrome

Warmer than pure black. Closer to weathered graphite than tech-dark. Prevents the sidebar from reading as generic developer dark mode.

| Token            | Value     | Usage                                          |
| ---------------- | --------- | ---------------------------------------------- |
| `--charcoal-950` | `#1e1e1c` | Deepest dark, footer background                |
| `--charcoal-900` | `#252523` | **Sidebar background** (primary dark surface)  |
| `--charcoal-800` | `#2f2f2c` | Hover state on sidebar items, topbar in mock   |
| `--charcoal-700` | `#3b3b37` | Dividers on dark bg, secondary dark surfaces   |
| `--charcoal-500` | `#5a5954` | **Body text secondary**, muted sidebar text    |
| `--charcoal-300` | `#8a8880` | Sidebar nav items (inactive), placeholder text |
| `--charcoal-100` | `#c8c6bc` | **Sidebar primary text**, wordmark color       |

### Amber Pine — primary accent

The existing gold evolved: slightly more saturated and sun-warm. Evokes pine sap, trail markers, topo map lines. This is the **only accent color** in the system.

| Token         | Value     | Usage                                                         |
| ------------- | --------- | ------------------------------------------------------------- |
| `--amber-50`  | `#FDF0D5` | Ghost button hover background, icon backgrounds               |
| `--amber-200` | `#F5C842` | Hero headline italic, high-contrast display use               |
| `--amber-400` | `#E8A220` | **Primary CTA background**, active nav item, `+` action links |
| `--amber-600` | `#C07A0A` | CTA hover state, link hover on amber elements                 |
| `--amber-800` | `#8A520A` | Text on amber-50 backgrounds (badges, tags)                   |

### Stone White — content area

Off-white with a warm gray undertone. Removes the clinical brightness of pure white while keeping the content area airy.

| Token         | Value     | Usage                                  |
| ------------- | --------- | -------------------------------------- |
| `--stone-50`  | `#FAFAF7` | **Page background**, content area base |
| `--stone-100` | `#F3F2EE` | **Surface / card background**          |
| `--stone-200` | `#E8E7E2` | **Table row dividers**, card borders   |
| `--stone-300` | `#D0CFC9` | Form input borders, strong dividers    |
| `--stone-500` | `#A8A79F` | Muted text on stone backgrounds        |

### Slate Blue — links and interactive states

Muted blue — overcast mountain sky. Cooler and less vivid than Bootstrap blue.

| Token         | Value     | Usage                                           |
| ------------- | --------- | ----------------------------------------------- |
| `--slate-50`  | `#E8F0F8` | Link hover background (subtle)                  |
| `--slate-200` | `#97B8D8` | Light link decoration, avatar borders           |
| `--slate-400` | `#4D84B4` | **Standard link color**, linked gear item names |
| `--slate-600` | `#2E5F88` | Link hover state                                |
| `--slate-800` | `#1A3D5C` | Link active/pressed state                       |

### Data / chart colors — topo palette

Used exclusively for the category donut chart and legend. All muted — no neons, no pure primaries. Based on USGS topo map and cartographic conventions.

| Token             | Value     | Category                |
| ----------------- | --------- | ----------------------- |
| `--data-bike`     | `#4D84B4` | Bike / transportation   |
| `--data-shelter`  | `#C05848` | Shelter / tent / sleep  |
| `--data-food`     | `#E8A220` | Food prep / consumables |
| `--data-clothing` | `#5A8C6A` | Clothing / worn items   |
| `--data-sleep`    | `#7B6EA8` | Sleep system            |
| `--data-other`    | `#8C7B5C` | Other / miscellaneous   |

> **Note for Claude Code:** Chart categories are user-defined. These six are the default assignment order. If a user has more than six categories, cycle back through the palette. Never use amber-400 as a chart color — it's reserved for UI accent.

### Semantic aliases

These are the tokens you should use in components 90% of the time:

| Token                    | Resolves to          | Usage                     |
| ------------------------ | -------------------- | ------------------------- |
| `--color-bg-page`        | `--stone-50`         | Page-level background     |
| `--color-bg-surface`     | `--stone-100`        | Cards, panels, table rows |
| `--color-bg-sidebar`     | `--charcoal-900`     | Sidebar panel             |
| `--color-text-primary`   | `#1e1e1c`            | All primary body text     |
| `--color-text-secondary` | `#5a5954`            | Labels, secondary info    |
| `--color-text-muted`     | `#a8a79f`            | Placeholders, hints       |
| `--color-text-inverse`   | `#e8e4d8`            | Text on dark backgrounds  |
| `--color-border`         | `rgba(30,30,28,.10)` | Default borders           |
| `--color-border-strong`  | `rgba(30,30,28,.20)` | Emphasized borders        |
| `--color-accent`         | `--amber-400`        | Primary accent            |
| `--color-accent-hover`   | `--amber-600`        | Accent hover              |
| `--color-link`           | `--slate-400`        | Link color                |
| `--color-link-hover`     | `--slate-600`        | Link hover                |

---

## Typography tokens

| Token            | Value                                |
| ---------------- | ------------------------------------ |
| `--font-display` | `'DM Serif Display', Georgia, serif` |
| `--font-ui`      | `'Figtree', system-ui, sans-serif`   |
| `--font-mono`    | `'DM Mono', 'Fira Mono', monospace`  |

### Type scale

| Token         | Value  | Common usage                         |
| ------------- | ------ | ------------------------------------ |
| `--text-xs`   | `11px` | Labels, uppercase utility text       |
| `--text-sm`   | `13px` | Secondary body, table cells, most UI |
| `--text-base` | `15px` | Primary body text                    |
| `--text-lg`   | `17px` | Section headings (Figtree)           |
| `--text-xl`   | `20px` | Page/list titles (DM Serif Display)  |
| `--text-2xl`  | `26px` | Large display (DM Serif Display)     |
| `--text-3xl`  | `34px` | Hero headline                        |

---

## Spacing

Based on a 4px base unit.

| Token        | Value  | Usage                             |
| ------------ | ------ | --------------------------------- |
| `--space-1`  | `4px`  | Icon gaps, tight internal padding |
| `--space-2`  | `8px`  | Gap between icon and label        |
| `--space-3`  | `12px` | Internal card padding (tight)     |
| `--space-4`  | `16px` | Standard internal padding         |
| `--space-5`  | `20px` | Section sub-divisions             |
| `--space-6`  | `24px` | Card padding                      |
| `--space-8`  | `32px` | Section gaps                      |
| `--space-10` | `40px` | Large section padding             |

---

## Border radius

| Token           | Value   | Usage                           |
| --------------- | ------- | ------------------------------- |
| `--radius-sm`   | `4px`   | Small tags, table cell rounding |
| `--radius-md`   | `6px`   | Buttons, form inputs            |
| `--radius-lg`   | `10px`  | Cards, panels                   |
| `--radius-xl`   | `14px`  | Large modals, the share card    |
| `--radius-pill` | `999px` | Pills, badges                   |

---

## Motion

| Token               | Value        | Usage                            |
| ------------------- | ------------ | -------------------------------- |
| `--transition-fast` | `120ms ease` | Hover color changes, icon states |
| `--transition-base` | `200ms ease` | Panel opens, card transitions    |

> **Rule:** No animation on page load. Motion is only for direct user interaction responses (hover, click, focus). The tool should feel instant, not theatrical.
