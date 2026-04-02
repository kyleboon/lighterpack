# TypeScript Conversion Design

**Date:** 2026-04-02
**Status:** Approved

## Goal

Convert all remaining JavaScript source files (9) and test files (37) to TypeScript with proper types. The server is already 100% TypeScript.

## Scope

| Area           | Files             | Work                                                                  |
| -------------- | ----------------- | --------------------------------------------------------------------- |
| New file       | 1                 | `shared/types.ts` — shared interfaces                                 |
| Shared         | 3                 | `dataTypes`, `weight`, `color` → TS with proper types + named exports |
| App utils      | 4                 | `csrf`, `utils`, `csvParser`, `focus` → TS                            |
| App composable | 1                 | `useItemDrag` → TS                                                    |
| App store      | 1                 | `store` → TS                                                          |
| Vue components | ~30               | Import path updates only                                              |
| Test files     | 37                | Rename + import updates + type annotations                            |
| **Total**      | ~77 files touched |                                                                       |

## Design Decisions

### Extract interfaces to `shared/types.ts`

Define all core interfaces in a single shared types file so that components, the store, server code, and tests can import types without coupling to class implementations.

Key types:

- `RGB`, `HSV` — color utility types
- `WeightUnit` — `'oz' | 'lb' | 'g' | 'kg'`
- `ImageRecord` — `{ id: number; url: string; sort_order: number }`
- `CategoryItem` — `{ qty: number; worn: number; consumable: boolean; star: number; itemId: number; _isNew?: boolean }`
- `OptionalFields` — `{ images: boolean; price: boolean; worn: boolean; consumable: boolean; listDescription: boolean }`
- `IItem` — interface for the Item class
- `ICategory` — interface for the Category class
- `IList` — interface for the List class
- `ILibrary` — interface for the Library class

The classes in `shared/dataTypes.ts` implement these interfaces.

### Named exports for utility modules

`shared/utils/color.js` and `shared/utils/weight.js` currently use an IIFE pattern with a default export object. Convert to named exports:

```ts
// Before
const weightUtils = (function() { ... return { WeightToMg, MgToWeight }; })();
export default weightUtils;

// After
export function WeightToMg(value: number, unit: WeightUnit): number { ... }
export function MgToWeight(value: number, unit: WeightUnit, display?: boolean): number | string { ... }
```

All call sites change from `weightUtils.WeightToMg()` to `WeightToMg()` (and similarly for colorUtils).

### Properly typed (not just renamed)

- All `any` JSDoc annotations replaced with proper types
- Class constructor parameters typed
- Method signatures fully typed
- Store state, getters, and actions typed
- Vue directive parameters typed with Vue's `App` type
- Composable parameters typed (e.g., `Ref<IList>`)

## File-by-File Details

### `shared/types.ts` (new)

Central type definitions imported by all layers. Contains interfaces only, no runtime code.

### `shared/utils/color.ts`

Remove IIFE. Named exports for all functions: `getColor`, `hsvToRgb`, `rgbToHsv`, `rgbToString`, `stringToRgb`, `hexToRgb`, `rgbToHex`. Parameters and returns typed with `RGB` and `HSV`.

### `shared/utils/weight.ts`

Remove IIFE. Named exports: `WeightToMg`, `MgToWeight`. Unit parameter typed as `WeightUnit`.

### `shared/dataTypes.ts`

Classes (`Item`, `Category`, `List`, `Library`) implement the corresponding interfaces from `shared/types.ts`. All `any` annotations replaced. The `library` back-references in `Category` and `List` typed as `Library`. Keep both named exports and default export for compatibility.

### `app/utils/csrf.ts`

Trivial rename. Add return type `: string | null`.

### `app/utils/utils.ts`

- `lpError` class: typed constructor, typed properties (`message`, `statusCode`, `errors`, `id`, `metadata`)
- `fetchJson`: options parameter gets an interface, return type `Promise<any>`
- `displayWeight`, `displayPrice`: typed parameters and returns
- Window globals: add `declare global` block for `window.readCookie`, `window.createCookie`, `window.getElementIndex`, `window.arrayMove`

### `app/utils/csvParser.ts`

- Define `CSVRow` interface for parsed row data
- Type `fullUnitToUnit` as `Record<string, WeightUnit>`
- Type all helper functions (`parseTruthy`, `parsePrice`, `isHeaderRow`, etc.)

### `app/utils/focus.ts`

- `registerDirectives(app: App)` using Vue's `App` type
- Directive binding parameters typed

### `app/composables/useItemDrag.ts`

- `setup(list: Ref<IList>)` parameter typed
- Sortable event handlers typed
- Store reference typed

### `app/store/store.ts`

- State: `library: Library | false`, other state properties typed
- Getters: return types added
- Actions: all parameter types and return types
- Helper functions (`addItemToLibrary`, `addCategoryToLibrary`, `addListToLibrary`) typed with proper parameters

### Vue components (~30 files)

Import path updates only — change `.js` extensions to `.ts` (or remove extensions).

### Test files (37 `.spec.js` → `.spec.ts`)

- Rename files
- Update import paths
- Add type annotations to test variables
- Use type assertions for partial/mock data (e.g., `as Partial<IItem>`)
- No changes to test logic or assertions

## Import Path Strategy

Update imports from `.js` to drop extensions entirely (Vite/Nuxt resolves them). For example:

```ts
// Before
import weightUtils from '#shared/utils/weight.js';
import { useLighterpackStore } from '../store/store.js';

// After
import { WeightToMg, MgToWeight } from '#shared/utils/weight';
import { useLighterpackStore } from '../store/store';
```

## What's Not Changing

- No logic changes — this is a type-only conversion
- No restructuring of files or modules
- No new features or behavior changes
- Vue components stay as `.vue` files (already have `<script>` or `<script setup>` sections)
- Server files already TypeScript — untouched
