# 01 — Brand

## What LighterPack is

LighterPack is the gear nerd's spreadsheet. It does exactly one thing — tracks the weight and cost of gear across packing lists — and gets out of the way so you can get on the trail.

It was built in 2014 by a hiker, for hikers. The original jQuery site earned trust through function, not flair. Any redesign must honor that legacy: the brand is defined by **restraint**, not style.

---

## Brand personality

### Core attributes

| Attribute                   | What it means in practice                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Pragmatic, not precious** | Every element earns its place. No splash screens, no marketing copy inside the app UI, no onboarding wizards.                             |
| **Quietly nerdy**           | Ounce-level precision, base weight vs. total weight distinction, worn/consumable separation — the tool assumes you know why these matter. |
| **Community-native**        | Share URLs are front and center. Lists are meant to be published, linked, and debated on trail forums.                                    |
| **Low-ego, high-function**  | Help text is plain English. Error states are uncommon because the tool mostly just works.                                                 |

### Personality spectrum

```
Playful          ●━━━━━━━━━━━━━━━━━━━━━━━━━ Serious
Minimal          ━━━━━━━━━━━━━━●━━━━━━━━━━━ Detailed
Consumer         ━━━━━━━━━━━━━━━━━━━━●━━━━━ Power user
Opinionated      ●━━━━━━━━━━━━━━━━━━━━━━━━━ Flexible / neutral
Modern/polished  ━━━━━━━━●━━━━━━━━━━━━━━━━━ Functional / raw
```

---

## Voice and copy

### Principles

- **Direct.** "Add a link for this item" not "You can optionally provide a product URL."
- **Lowercase-comfortable.** UI labels and button text use sentence case, never ALL CAPS.
- **Metric-literate.** The audience understands oz, lb, base weight, consumable. Don't explain these.
- **No hype.** No exclamation points except genuine success moments (e.g. after account creation). Not "Amazing! Your list is ready!" — just "List created."
- **Community-minded.** Write as though talking to a trail forum regular, not a customer.

### Tone examples

| Context      | Wrong                                                                                                                                                         | Right                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Empty state  | "You don't have any lists yet! Create your first one to get started 🎒"                                                                                       | "No lists yet. Add one above."        |
| Button label | "CREATE NEW LIST"                                                                                                                                             | "Add new list"                        |
| Error        | "Oops! Something went wrong. Please try again."                                                                                                               | "Couldn't save. Try again."           |
| Help text    | "Quantity and worn values: If you have multiple quantity of an item and mark that item as worn, only the first quantity will count towards your worn weight." | Keep as-is — this is already correct. |
| Share prompt | "Share your amazing packing list with the world!"                                                                                                             | "Share your list"                     |

### The one-sentence pitch

> LighterPack helps you track the gear you bring on adventures.

This line (from the original site) is correct. Don't change it.

---

## What to preserve vs. what can evolve

### Preserve — these are load-bearing identity elements

- **Dark sidebar + light content area** — the two-zone layout is the most recognizable LighterPack signature
- **Amber/gold accent** — warm, outdoorsy, indie. Not a standard SaaS blue.
- **Donut chart as the hero** — the weight visualization is the emotional payoff of the tool
- **Inline click-to-edit** — click a cell to change it. No separate edit mode. No save button.
- **Weight density** — the table is dense by design. Gear obsessives want to see more rows, not more whitespace.
- **Plain, practical copy** — no lifestyle marketing language inside the app

### Can evolve

- Typography (the current font stack is visually dated)
- Spacing and visual rhythm (inconsistent in the original)
- Button styles and form elements
- Icon system
- Mobile layout and responsiveness
- Empty states and onboarding flow
- Chart interactivity

---

## Logo and wordmark

The wordmark is set in **DM Serif Display**, regular weight, ~19px in the sidebar context. No bold, no italic, no icon mark.

```html
<span class="lp-wordmark">LighterPack</span> <span class="lp-wordmark-beta">beta</span>
```

The `(beta)` label uses `var(--font-ui)`, 10px, uppercase, `var(--charcoal-500)`. It should feel parenthetical — subordinate to the wordmark, not a badge.

**Do not** create a logomark, icon, or symbol version. The wordmark alone is the brand identifier.
