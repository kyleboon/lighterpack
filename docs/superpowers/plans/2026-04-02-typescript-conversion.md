# TypeScript Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all 9 remaining JS source files and 37 test files to properly typed TypeScript.

**Architecture:** Create a shared types file (`shared/types.ts`) with interfaces for all data models, then convert files bottom-up from shared utilities → data types → app utilities → store → tests. Each task converts one file (or a small batch), updates all import sites, and verifies with tests.

**Tech Stack:** TypeScript, Vue 3, Pinia, Vitest, Nuxt 4

---

### Task 1: Create `shared/types.ts`

**Files:**

- Create: `shared/types.ts`

- [ ] **Step 1: Create the shared types file**

```ts
// shared/types.ts

// ── Color utility types ─────────────────────────────────────────────────────

export interface RGB {
    r: number;
    g: number;
    b: number;
}

export interface HSV {
    h: number;
    s: number;
    v: number;
}

// ── Weight utility types ────────────────────────────────────────────────────

export type WeightUnit = 'oz' | 'lb' | 'g' | 'kg';

// ── Data model types ────────────────────────────────────────────────────────

export interface ImageRecord {
    id: number;
    url: string;
    sort_order: number;
}

export interface CategoryItem {
    qty: number;
    worn: number;
    consumable: boolean;
    star: number;
    itemId: number;
    _isNew?: boolean;
}

export interface OptionalFields {
    images: boolean;
    price: boolean;
    worn: boolean;
    consumable: boolean;
    listDescription: boolean;
}

export interface IItem {
    id: number;
    name: string;
    description: string;
    weight: number;
    authorUnit: string;
    price: number;
    url: string;
    images: ImageRecord[];
}

export interface ICategory {
    id: number;
    name: string;
    categoryItems: CategoryItem[];
    images: ImageRecord[];
    subtotalWeight: number;
    subtotalWornWeight: number;
    subtotalConsumableWeight: number;
    subtotalPrice: number;
    subtotalConsumablePrice: number;
    subtotalQty: number;
    displayColor?: string;
    color?: RGB;
    _isNew?: boolean;
}

export interface ChartPoint {
    value: number;
    id: number;
    name: string;
    color: RGB;
    percent: number;
    parent?: ChartCategory;
}

export interface ChartCategory {
    points: Record<string, ChartPoint>;
    color: RGB;
    id: number;
    name: string;
    total: number;
    percent: number;
    visiblePoints: boolean;
    parent?: ChartData;
}

export interface ChartData {
    points: Record<string, ChartCategory>;
    total: number;
}

export interface IList {
    id: number;
    name: string;
    categoryIds: number[];
    chart: ChartData | null;
    description: string;
    externalId: string;
    images: ImageRecord[];
    totalWeight: number;
    totalWornWeight: number;
    totalConsumableWeight: number;
    totalBaseWeight: number;
    totalPackWeight: number;
    totalPrice: number;
    totalConsumablePrice: number;
    totalQty: number;
}

export interface ILibrary {
    version: string;
    idMap: Record<number, IItem | ICategory | IList>;
    itemsMap: Record<number, IItem>;
    categoriesMap: Record<number, ICategory>;
    listsMap: Record<number, IList>;
    items: IItem[];
    categories: ICategory[];
    lists: IList[];
    sequence: number;
    defaultListId: number;
    totalUnit: string;
    itemUnit: string;
    showSidebar: boolean;
    showImages: boolean;
    optionalFields: OptionalFields;
    currencySymbol: string;
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx nuxi typecheck`
Expected: No new errors (existing warnings are OK).

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add shared TypeScript interfaces for data models"
```

---

### Task 2: Convert `shared/utils/weight.ts`

**Files:**

- Rename: `shared/utils/weight.js` → `shared/utils/weight.ts`
- Modify: `shared/dataTypes.js` (update import)
- Modify: `server/routes/csv/[id].get.ts` (update import)
- Modify: `app/store/store.js` (update import)
- Modify: `app/utils/utils.js` (update import)
- Modify: `app/components/library-items.vue` (update import + call sites)
- Modify: `app/components/category.vue` (update import + call sites)
- Modify: `app/components/list-summary.vue` (update import + call sites)
- Modify: `app/components/donut-chart.vue` (update import + call sites)
- Modify: `app/components/item.vue` (update import + call sites)
- Rename: `test/unit/utils/weight.spec.js` → `test/unit/utils/weight.spec.ts`

- [ ] **Step 1: Run existing tests to confirm baseline**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: 37 passed

- [ ] **Step 2: Rename and rewrite `weight.ts`**

Delete `shared/utils/weight.js` and create `shared/utils/weight.ts`:

```ts
import type { WeightUnit } from '../types';

export function WeightToMg(value: number, unit: WeightUnit): number {
    if (unit === 'g') return value * 1000;
    if (unit === 'kg') return value * 1000000;
    if (unit === 'oz') return value * 28349.5;
    if (unit === 'lb') return value * 453592;
    return 0;
}

export function MgToWeight(value: number, unit: WeightUnit, display: boolean = false): number | string {
    if (unit === 'g') return Math.round((100 * value) / 1000.0) / 100;
    if (unit === 'kg') return Math.round((100 * value) / 1000000.0) / 100;
    if (unit === 'oz') return Math.round((100 * value) / 28349.5) / 100;
    if (unit === 'lb') {
        if (display) {
            const poundsFloat = value / 453592.0;
            const pounds = Math.floor(poundsFloat);
            const oz = Math.round((poundsFloat % 1) * 16 * 100) / 100;
            let out = '';
            if (pounds) {
                out += `${pounds}lb`;
                if (pounds > 1) out += 's';
            }
            if (oz || !pounds) {
                if (out) out += ' ';
                out += `${oz}oz`;
            }
            return out;
        }
        return Math.round((100 * value) / 453592.0) / 100;
    }
    return 0;
}
```

- [ ] **Step 3: Update import in `shared/dataTypes.js`**

Change line 4:

```ts
// Before
import weightUtils from './utils/weight.js';
// After
import { WeightToMg, MgToWeight } from './utils/weight';
```

Update the one call site at line 283:

```ts
// Before
return `${name}: ${weightUtils.MgToWeight(valueMg, unit)} ${unit}`;
// After
return `${name}: ${MgToWeight(valueMg, unit)} ${unit}`;
```

- [ ] **Step 4: Update import in `server/routes/csv/[id].get.ts`**

Change line 6:

```ts
// Before
import weightUtils from '#shared/utils/weight.js';
// After
import { MgToWeight } from '#shared/utils/weight';
```

Update call site at line 75:

```ts
// Before
`${weightUtils.MgToWeight(item.weight, item.authorUnit)}`,
// After
`${MgToWeight(item.weight, item.authorUnit)}`,
```

- [ ] **Step 5: Update import in `app/store/store.js`**

Change line 2:

```ts
// Before
import weightUtils from '#shared/utils/weight.js';
// After
import { WeightToMg } from '#shared/utils/weight';
```

Update call sites at lines 751 and 779:

```ts
// Before
item.weight = weightUtils.WeightToMg(parseFloat(row.weight), row.unit);
// After
item.weight = WeightToMg(parseFloat(row.weight), row.unit);
```

(Same pattern for both lines.)

- [ ] **Step 6: Update import in `app/utils/utils.js`**

Change line 1:

```ts
// Before
import weightUtils from '#shared/utils/weight.js';
// After
import { MgToWeight } from '#shared/utils/weight';
```

Update call site at line 104:

```ts
// Before
return weightUtils.MgToWeight(mg, unit) || 0;
// After
return MgToWeight(mg, unit) || 0;
```

- [ ] **Step 7: Update imports in Vue components**

**`app/components/library-items.vue`** — Change import and call site:

```ts
// Before
import weightUtils from '#shared/utils/weight.js';
// After
import { MgToWeight } from '#shared/utils/weight';
```

Update line 146: `weightUtils.MgToWeight(mg, unit)` → `MgToWeight(mg, unit)`

**`app/components/category.vue`** — Same pattern:

```ts
import { MgToWeight } from '#shared/utils/weight';
```

Update line 153: `weightUtils.MgToWeight(mg, unit)` → `MgToWeight(mg, unit)`

**`app/components/list-summary.vue`** — Change import:

```ts
import { MgToWeight } from '#shared/utils/weight';
```

Update line 151: `weightUtils.MgToWeight(mg, unit)` → `MgToWeight(mg, unit)`

**`app/components/donut-chart.vue`** — Change import:

```ts
import { MgToWeight } from '#shared/utils/weight';
```

Update lines 121 and 144: `weightUtils.MgToWeight(...)` → `MgToWeight(...)`

**`app/components/item.vue`** — Change import:

```ts
import { WeightToMg, MgToWeight } from '#shared/utils/weight';
```

Update lines 384, 405, 517, 518, 530, 531: `weightUtils.WeightToMg(...)` → `WeightToMg(...)` and `weightUtils.MgToWeight(...)` → `MgToWeight(...)`

- [ ] **Step 8: Convert weight test file**

Rename `test/unit/utils/weight.spec.js` → `test/unit/utils/weight.spec.ts` and update imports:

```ts
// Before
import weightUtils from '../../../shared/utils/weight.js';
// After
import { WeightToMg, MgToWeight } from '../../../shared/utils/weight';
```

Update all test call sites from `weightUtils.WeightToMg(...)` → `WeightToMg(...)` and `weightUtils.MgToWeight(...)` → `MgToWeight(...)`.

- [ ] **Step 9: Run tests**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All 37 test files pass, 323 tests pass.

Run: `npm run test:server 2>&1 | tail -5`
Expected: 13 files pass, 94 tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: convert shared/utils/weight to TypeScript with named exports"
```

---

### Task 3: Convert `shared/utils/color.ts`

**Files:**

- Rename: `shared/utils/color.js` → `shared/utils/color.ts`
- Modify: `shared/dataTypes.js` (update import + call sites)
- Modify: `app/components/list-summary.vue` (update import + call sites)
- Modify: `app/components/donut-chart.vue` (update import + call sites)
- Rename: `test/unit/utils/color.spec.js` → `test/unit/utils/color.spec.ts`

- [ ] **Step 1: Rename and rewrite `color.ts`**

Delete `shared/utils/color.js` and create `shared/utils/color.ts`:

```ts
import type { RGB, HSV } from '../types';

const DEFAULT_COLORS: RGB[] = [
    { r: 27, g: 119, b: 211 },
    { r: 206, g: 24, b: 54 },
    { r: 242, g: 208, b: 0 },
    { r: 122, g: 179, b: 23 },
    { r: 130, g: 33, b: 198 },
    { r: 232, g: 110, b: 28 },
    { r: 220, g: 242, b: 51 },
    { r: 86, g: 174, b: 226 },
    { r: 226, g: 86, b: 174 },
    { r: 226, g: 137, b: 86 },
    { r: 86, g: 226, b: 207 },
];

export function getColor(index: number, baseColor?: RGB): RGB {
    if (baseColor) {
        const hsv = rgbToHsv(baseColor);
        hsv.s -= Math.round((hsv.s / 10) * (index % 10));
        hsv.v += Math.round(((100 - hsv.v) / 10) * (index % 10));
        return hsvToRgb(hsv);
    }
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function hsvToRgb(hsv: HSV): RGB {
    let r = 0;
    let g = 0;
    let b = 0;
    let i: number;
    let f: number;
    let p: number;
    let q: number;
    let t: number;
    const h = hsv.h / 360;
    const s = hsv.s / 100;
    const v = hsv.v / 100;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255),
    };
}

export function rgbToHsv(rgb: RGB): HSV {
    let rr: number;
    let gg: number;
    let bb: number;
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    let h = 0;
    let s = 0;
    const v = Math.max(r, g, b);
    const diff = v - Math.min(r, g, b);
    const diffc = function (c: number): number {
        return (v - c) / 6 / diff + 1 / 2;
    };

    if (diff === 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        } else if (g === v) {
            h = 1 / 3 + rr - bb;
        } else if (b === v) {
            h = 2 / 3 + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100),
    };
}

export function rgbToString(rgb: RGB): string {
    return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

export function stringToRgb(rgbString: string): RGB {
    const trimmed = rgbString.substring(4, rgbString.length - 1);
    const split = trimmed.split(',');
    return {
        r: parseInt(split[0]),
        g: parseInt(split[1]),
        b: parseInt(split[2]),
    };
}

export function hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

export function rgbToHex(rgb: RGB): string {
    return `#${componentToHex(rgb.r)}${componentToHex(rgb.g)}${componentToHex(rgb.b)}`;
}

function componentToHex(c: number): string {
    const hex = c.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
}
```

- [ ] **Step 2: Update import in `shared/dataTypes.js`**

Change line 3:

```ts
// Before
import colorUtils from './utils/color.js';
// After
import { getColor, rgbToString } from './utils/color';
```

Update call sites at lines 305, 306, 315:

```ts
// Line 305: colorUtils.getColor(+i) → getColor(+i)
// Line 306: colorUtils.rgbToString(tempColor) → rgbToString(tempColor)
// Line 315: colorUtils.getColor(+j, tempColor) → getColor(+j, tempColor)
```

- [ ] **Step 3: Update imports in Vue components**

**`app/components/list-summary.vue`** — Change import (line 121):

```ts
// Before
import colorUtils from '#shared/utils/color.js';
// After
import { getColor, rgbToString, hexToRgb, rgbToHex, stringToRgb } from '#shared/utils/color';
```

Update lines 145, 164, 168: remove `colorUtils.` prefix from all calls.

**`app/components/donut-chart.vue`** — Change import (line 54):

```ts
// Before
import colorUtils from '#shared/utils/color.js';
// After
import { getColor, rgbToString } from '#shared/utils/color';
```

Update lines 117, 118, 133, 141: remove `colorUtils.` prefix from all calls.

- [ ] **Step 4: Convert color test file**

Rename `test/unit/utils/color.spec.js` → `test/unit/utils/color.spec.ts` and update imports:

```ts
// Before
import colorUtils from '../../../shared/utils/color.js';
// After
import {
    getColor,
    rgbToHex,
    hexToRgb,
    rgbToString,
    stringToRgb,
    hsvToRgb,
    rgbToHsv,
} from '../../../shared/utils/color';
```

Update all test call sites: remove `colorUtils.` prefix.

- [ ] **Step 5: Run tests**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All 37 test files pass, 323 tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: convert shared/utils/color to TypeScript with named exports"
```

---

### Task 4: Convert `shared/dataTypes.ts`

**Files:**

- Rename: `shared/dataTypes.js` → `shared/dataTypes.ts`
- Rename: `test/unit/dataTypes/item.spec.js` → `test/unit/dataTypes/item.spec.ts`
- Rename: `test/unit/dataTypes/category.spec.js` → `test/unit/dataTypes/category.spec.ts`
- Rename: `test/unit/dataTypes/list.spec.js` → `test/unit/dataTypes/list.spec.ts`
- Rename: `test/unit/dataTypes/library.spec.js` → `test/unit/dataTypes/library.spec.ts`
- Modify: `app/store/store.js` (update import path)
- Modify: `server/routes/csv/[id].get.ts` (update import path)

- [ ] **Step 1: Rename `dataTypes.js` → `dataTypes.ts` and add types**

This is the largest conversion. Key changes:

1. Remove `// @ts-check` and all JSDoc type annotations
2. Import types from `./types`
3. Add TypeScript type annotations to all class members and methods
4. Replace all `any` with proper types

Top of file:

```ts
import { getColor, rgbToString } from './utils/color';
import { MgToWeight } from './utils/weight';
import type { RGB, ImageRecord, CategoryItem, OptionalFields, ChartData, ChartPoint } from './types';
```

**Item class** — add types to constructor and properties:

```ts
class Item {
    id: number;
    name: string;
    description: string;
    weight: number;
    authorUnit: string;
    price: number;
    url: string;
    images: ImageRecord[];

    constructor({ id, unit }: { id: number; unit?: string }) {
        this.id = id;
        this.name = '';
        this.description = '';
        this.weight = 0;
        this.authorUnit = unit || 'oz';
        this.price = 0.0;
        this.url = '';
        this.images = [];
    }

    save(): this {
        return this;
    }

    load(input: Record<string, unknown>): void {
        Object.assign(this, input);
        if (typeof this.price === 'string') {
            this.price = parseFloat(this.price);
        }
    }
}
```

**Category class** — add types:

```ts
class Category {
    library: Library;
    id: number;
    name: string;
    categoryItems: CategoryItem[];
    images: ImageRecord[];
    subtotalWeight: number;
    subtotalWornWeight: number;
    subtotalConsumableWeight: number;
    subtotalPrice: number;
    subtotalConsumablePrice: number;
    subtotalQty: number;
    displayColor?: string;
    color?: RGB;
    _isNew?: boolean;

    constructor({ library, id, _isNew }: { library: Library; id: number; _isNew?: boolean }) {
        this.library = library;
        this.id = id;
        this.name = '';
        this.categoryItems = [];
        this.images = [];
        this.subtotalWeight = 0;
        this.subtotalWornWeight = 0;
        this.subtotalConsumableWeight = 0;
        this.subtotalPrice = 0;
        this.subtotalConsumablePrice = 0;
        this.subtotalQty = 0;
        this._isNew = _isNew;
    }

    addItem(partialCategoryItem: Partial<CategoryItem>): void {
        const tempCategoryItem: CategoryItem = {
            qty: 1,
            worn: 0,
            consumable: false,
            star: 0,
            itemId: 0,
            _isNew: false,
        };
        Object.assign(tempCategoryItem, partialCategoryItem);
        this.categoryItems.push(tempCategoryItem);
    }

    updateCategoryItem(categoryItem: Partial<CategoryItem>): void {
        const oldCategoryItem = this.getCategoryItemById(categoryItem.itemId!);
        if (oldCategoryItem) Object.assign(oldCategoryItem, categoryItem);
    }

    removeItem(itemId: number): void {
        const categoryItem = this.getCategoryItemById(itemId);
        const index = this.categoryItems.indexOf(categoryItem as CategoryItem);
        this.categoryItems.splice(index, 1);
    }

    calculateSubtotal(): void {
        // body unchanged
    }

    getCategoryItemById(id: number): CategoryItem | null {
        for (const categoryItem of this.categoryItems) {
            if (categoryItem.itemId === id) return categoryItem;
        }
        return null;
    }

    getExtendedItemByIndex(index: number): Record<string, unknown> {
        const categoryItem = this.categoryItems[index];
        const item = this.library.getItemById(categoryItem.itemId);
        const extendedItem = Object.assign({}, item);
        Object.assign(extendedItem, categoryItem);
        return extendedItem;
    }

    save(): Record<string, unknown> {
        const out = Object.assign({}, this) as Record<string, unknown>;
        delete out.library;
        delete out.template;
        delete out._isNew;
        return out;
    }

    load(input: Record<string, unknown>): void {
        delete input._isNew;
        Object.assign(this, input);
        this.categoryItems.forEach((categoryItem, index) => {
            delete categoryItem._isNew;
            if ('price' in categoryItem) {
                delete (categoryItem as Record<string, unknown>).price;
            }
            if (!categoryItem.star) {
                categoryItem.star = 0;
            }
            if (!this.library.getItemById(categoryItem.itemId)) {
                this.categoryItems.splice(index, 1);
            }
        });
    }
}
```

**List class** — add types:

```ts
class List {
    library: Library;
    id: number;
    name: string;
    categoryIds: number[];
    chart: ChartData | null;
    description: string;
    externalId: string;
    images: ImageRecord[];
    totalWeight: number;
    totalWornWeight: number;
    totalConsumableWeight: number;
    totalBaseWeight: number;
    totalPackWeight: number;
    totalPrice: number;
    totalConsumablePrice: number;
    totalQty: number;

    constructor({ id, library }: { id: number; library: Library }) {
        this.library = library;
        this.id = id;
        this.name = '';
        this.categoryIds = [];
        this.chart = null;
        this.description = '';
        this.externalId = '';
        this.images = [];
        this.totalWeight = 0;
        this.totalWornWeight = 0;
        this.totalConsumableWeight = 0;
        this.totalBaseWeight = 0;
        this.totalPackWeight = 0;
        this.totalPrice = 0;
        this.totalConsumablePrice = 0;
        this.totalQty = 0;
    }

    addCategory(categoryId: number): void {
        this.categoryIds.push(categoryId);
    }

    removeCategory(categoryId: number): boolean {
        const catId = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
        let index = this.categoryIds.indexOf(catId);
        if (index === -1) {
            console.warn(`Unable to delete category, it does not exist in this list:${catId}`);
            return false;
        }
        this.categoryIds.splice(index, 1);
        return true;
    }

    renderChart(type: string, linkParent: boolean = true): ChartData | false {
        // body unchanged — method returns ChartData or false
    }

    calculateTotals(): void {
        // body unchanged
    }

    save(): Record<string, unknown> {
        const out = Object.assign({}, this) as Record<string, unknown>;
        delete out.library;
        delete out.chart;
        return out;
    }

    load(input: Record<string, unknown>): void {
        Object.assign(this, input);
        this.calculateTotals();
    }
}
```

**Library class** — add types:

```ts
class Library {
    version: string;
    idMap: Record<number, Item | Category | List>;
    itemsMap: Record<number, Item>;
    categoriesMap: Record<number, Category>;
    listsMap: Record<number, List>;
    items: Item[];
    categories: Category[];
    lists: List[];
    sequence: number;
    defaultListId: number;
    totalUnit: string;
    itemUnit: string;
    showSidebar: boolean;
    showImages: boolean;
    optionalFields: OptionalFields;
    currencySymbol: string;

    constructor() {
        this.version = '0.3';
        this.idMap = {};
        this.itemsMap = {};
        this.categoriesMap = {};
        this.listsMap = {};
        this.items = [];
        this.categories = [];
        this.lists = [];
        this.sequence = 0;
        this.defaultListId = 1;
        this.totalUnit = 'oz';
        this.itemUnit = 'oz';
        this.showSidebar = true;
        this.showImages = false;
        this.optionalFields = { ...defaultOptionalFields };
        this.currencySymbol = '$';
        this.firstRun();
    }

    // All method signatures typed — bodies unchanged:
    firstRun(): void {
        /* ... */
    }
    newItem({ category, _isNew }: { category?: Category; _isNew?: boolean }): Item {
        /* ... */
    }
    updateItem(item: Partial<Item> & { id: number }): Item {
        /* ... */
    }
    removeItem(id: number): boolean {
        /* ... */
    }
    newCategory({ list, _isNew }: { list?: List; _isNew?: boolean }): Category {
        /* ... */
    }
    removeCategory(id: number, force?: boolean): boolean {
        /* ... */
    }
    newList(): List {
        /* ... */
    }
    removeList(id: number): void {
        /* ... */
    }
    copyList(id: number): List | undefined {
        /* ... */
    }
    renderChart(type: string): ChartData | false {
        /* ... */
    }
    getCategoryById(id: number): Category {
        /* ... */
    }
    getItemById(id: number): Item {
        /* ... */
    }
    getListById(id: number): List {
        /* ... */
    }
    getItemsInCurrentList(): number[] {
        /* ... */
    }
    findCategoryWithItemById(itemId: number, listId?: number): Category | undefined {
        /* ... */
    }
    findListWithCategoryById(id: number): List | undefined {
        /* ... */
    }
    nextSequence(): number {
        /* ... */
    }
    save(): Record<string, unknown> {
        /* ... */
    }
    load(serializedLibrary: Record<string, unknown>): void {
        /* ... */
    }
    // upgrade methods — parameter typed as Record<string, unknown>
    upgrade01to02(serializedLibrary: Record<string, unknown>): void {
        /* ... */
    }
    upgrade02to03(serializedLibrary: Record<string, unknown>): void {
        /* ... */
    }
    sequenceShouldBeCorrect(serializedLibrary: Record<string, unknown>): void {
        /* ... */
    }
    idsShouldBeInts(serializedLibrary: Record<string, unknown>): void {
        /* ... */
    }
    renameCategoryIds(serializedLibrary: Record<string, unknown>): void {
        /* ... */
    }
    fixDuplicateIds(serializedLibrary: Record<string, unknown>): void {
        /* ... */
    }
    updateListId(serializedLibrary: Record<string, unknown>, list: Record<string, unknown>, newId: number): void {
        /* ... */
    }
    updateCategoryId(
        serializedLibrary: Record<string, unknown>,
        category: Record<string, unknown>,
        newId: number,
    ): void {
        /* ... */
    }
    updateItemId(serializedLibrary: Record<string, unknown>, item: Record<string, unknown>, newId: number): void {
        /* ... */
    }
}
```

Keep both named and default exports:

```ts
export { Library, List, Category, Item };
export default { Library, List, Category, Item };
```

- [ ] **Step 2: Update import paths in consumers**

**`app/store/store.js`** line 3:

```ts
// Before
import dataTypes from '#shared/dataTypes.js';
// After
import dataTypes from '#shared/dataTypes';
```

**`server/routes/csv/[id].get.ts`** line 5:

```ts
// Before
import dataTypes from '#shared/dataTypes.js';
// After
import dataTypes from '#shared/dataTypes';
```

- [ ] **Step 3: Convert dataTypes test files**

Rename all 4 files from `.spec.js` → `.spec.ts` and update imports:

```ts
// Before
import { Item } from '../../../shared/dataTypes.js';
// After
import { Item } from '../../../shared/dataTypes';

// Before
import { Category, Item, Library } from '../../../shared/dataTypes.js';
// After
import { Category, Item, Library } from '../../../shared/dataTypes';

// Before
import { Library } from '../../../shared/dataTypes.js';
// After
import { Library } from '../../../shared/dataTypes';
```

Add type annotations to test variables where TypeScript complains (e.g., mock objects passed to constructors).

- [ ] **Step 4: Run tests**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All 37 test files pass.

Run: `npm run test:server 2>&1 | tail -5`
Expected: All 13 test files pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: convert shared/dataTypes to TypeScript with proper interfaces"
```

---

### Task 5: Convert `app/utils/csrf.ts`

**Files:**

- Rename: `app/utils/csrf.js` → `app/utils/csrf.ts`
- Modify: `app/store/store.js` (update import path)
- Modify: `app/utils/utils.js` (update import path)

- [ ] **Step 1: Rename and add types**

Delete `app/utils/csrf.js` and create `app/utils/csrf.ts`:

```ts
/**
 * Reads the CSRF token from the csrf_token cookie.
 * Returns null during SSR or if the cookie is not set.
 */
export function getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? match[1] : null;
}
```

- [ ] **Step 2: Update import paths**

**`app/store/store.js`** line 4:

```ts
// Before
import { getCsrfToken } from '~/utils/csrf.js';
// After
import { getCsrfToken } from '~/utils/csrf';
```

**`app/utils/utils.js`** line 2:

```ts
// Before
import { getCsrfToken } from './csrf.js';
// After
import { getCsrfToken } from './csrf';
```

- [ ] **Step 3: Run tests**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: convert app/utils/csrf to TypeScript"
```

---

### Task 6: Convert `app/utils/csvParser.ts`

**Files:**

- Rename: `app/utils/csvParser.js` → `app/utils/csvParser.ts`
- Rename: `test/unit/utils/csvParser.spec.js` → `test/unit/utils/csvParser.spec.ts`

- [ ] **Step 1: Rename and add types**

Delete `app/utils/csvParser.js` and create `app/utils/csvParser.ts`:

```ts
import type { WeightUnit } from '#shared/types';

export const fullUnitToUnit: Record<string, WeightUnit> = {
    ounce: 'oz',
    ounces: 'oz',
    oz: 'oz',
    pound: 'lb',
    pounds: 'lb',
    lb: 'lb',
    lbs: 'lb',
    gram: 'g',
    grams: 'g',
    g: 'g',
    kilogram: 'kg',
    kilograms: 'kg',
    kg: 'kg',
    kgs: 'kg',
};

const headerAliases: Record<string, string> = {
    'item name': 'name',
    category: 'category',
    desc: 'description',
    description: 'description',
    qty: 'qty',
    quantity: 'qty',
    weight: 'weight',
    unit: 'unit',
    url: 'url',
    price: 'price',
    worn: 'worn',
    consumable: 'consumable',
};

const TRUTHY_VALUES = new Set(['worn', 'consumable', 'true', 'yes', '1']);

interface RawRow {
    [key: string]: string;
}

export interface ParsedRow {
    name: string;
    category: string;
    description: string;
    qty: number;
    weight: number;
    unit: WeightUnit;
    url: string;
    price: number;
    worn: number;
    consumable: boolean;
}

function parseTruthy(value: string | undefined): boolean {
    return TRUTHY_VALUES.has((value || '').trim().toLowerCase());
}

function parsePrice(value: string | undefined): number {
    if (!value) return 0;
    const stripped = String(value).replace(/^[^0-9.-]+/, '');
    const parsed = parseFloat(stripped);
    return isNaN(parsed) ? 0 : parsed;
}

function isHeaderRow(row: string[]): boolean {
    let matches = 0;
    for (const cell of row) {
        if (headerAliases[cell.trim().toLowerCase()] !== undefined) {
            matches++;
        }
    }
    return matches >= 3;
}

function buildRowFromHeaders(row: string[], columnMap: (string | null)[]): RawRow {
    const obj: RawRow = {};
    for (const [index, field] of columnMap.entries()) {
        if (field) {
            obj[field] = row[index] ?? '';
        }
    }
    return obj;
}

function buildRowFromIndex(row: string[]): RawRow {
    return {
        name: row[0] ?? '',
        category: row[1] ?? '',
        description: row[2] ?? '',
        qty: row[3] ?? '',
        weight: row[4] ?? '',
        unit: row[5] ?? '',
    };
}

function normalizeRow(raw: RawRow): ParsedRow | null {
    const unit = fullUnitToUnit[(raw.unit || '').trim().toLowerCase()];
    if (!unit) return null;

    const qty = parseFloat(raw.qty);
    const weight = parseFloat(raw.weight);
    if (isNaN(qty) || isNaN(weight)) return null;

    const name = (raw.name || '').trim();
    if (!name) return null;

    return {
        name,
        category: (raw.category || '').trim(),
        description: (raw.description || '').trim(),
        qty,
        weight,
        unit,
        url: (raw.url || '').trim(),
        price: parsePrice(raw.price),
        worn: parseTruthy(raw.worn) ? 1 : 0,
        consumable: parseTruthy(raw.consumable),
    };
}

export function parseCSV(input: string): ParsedRow[] {
    const rows = CSVToArray(input);
    const result: ParsedRow[] = [];

    if (!rows.length) return result;

    let startIndex = 0;
    let columnMap: (string | null)[] | null = null;

    if (isHeaderRow(rows[0])) {
        columnMap = rows[0].map((cell) => headerAliases[cell.trim().toLowerCase()] || null);
        startIndex = 1;
    }

    for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 4) continue;

        const raw = columnMap ? buildRowFromHeaders(row, columnMap) : buildRowFromIndex(row);
        const normalized = normalizeRow(raw);
        if (normalized) {
            result.push(normalized);
        }
    }

    return result;
}

export function CSVToArray(strData: string): string[][] {
    const strDelimiter = ',';
    const arrData: string[][] = [[]];
    let arrMatches: RegExpExecArray | null = null;

    const objPattern = new RegExp(
        `(\\${strDelimiter}|\\r?\\n|\\r|^)` + '(?:"([^"]*(?:""[^"]*)*)"|' + `([^"\\${strDelimiter}\\r\\n]*))`,
        'gi',
    );

    while ((arrMatches = objPattern.exec(strData))) {
        const strMatchedDelimiter = arrMatches[1];
        if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
            arrData.push([]);
        }

        let strMatchedValue: string;
        if (arrMatches[2]) {
            strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
        } else {
            strMatchedValue = arrMatches[3];
        }

        arrData[arrData.length - 1].push(strMatchedValue);
    }

    return arrData;
}
```

- [ ] **Step 2: Convert csvParser test file**

Rename `test/unit/utils/csvParser.spec.js` → `test/unit/utils/csvParser.spec.ts` and update imports:

```ts
// Before
import { CSVToArray, fullUnitToUnit, parseCSV } from '../../../app/utils/csvParser.js';
// After
import { CSVToArray, fullUnitToUnit, parseCSV } from '../../../app/utils/csvParser';
```

- [ ] **Step 3: Run tests**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: convert app/utils/csvParser to TypeScript"
```

---

### Task 7: Convert `app/utils/utils.ts`

**Files:**

- Rename: `app/utils/utils.js` → `app/utils/utils.ts`
- Modify: `app/components/account-delete.vue` (update import path)
- Modify: `app/components/list-actions.vue` (update import path)

- [ ] **Step 1: Rename and add types**

Delete `app/utils/utils.js` and create `app/utils/utils.ts`:

```ts
import { MgToWeight } from '#shared/utils/weight';
import { getCsrfToken } from './csrf';

interface ErrorResponse {
    message?: string;
    errors?: Array<{ message: string }>;
    data?: { errors?: Array<{ message: string }> };
}

interface FetchOptions extends RequestInit {
    headers: Record<string, string>;
}

class lpError extends Error {
    statusCode: number | null;
    errors: Array<{ message: string }> | null;
    id: string | null;
    metadata: unknown;

    constructor(response: ErrorResponse, statusCode: number | null = null) {
        super();

        this.message = 'An error occurred, please try again later.';
        this.statusCode = statusCode;
        this.errors = null;
        this.id = null;
        this.metadata = null;

        if (response.message) {
            this.message = response.message;
        } else if (
            response.errors &&
            response.errors instanceof Array &&
            response.errors.length &&
            response.errors[0].message
        ) {
            this.message = response.errors[0].message;
        }

        if (response.data && response.data.errors instanceof Array) {
            this.errors = response.data.errors;
        } else if (response.errors) {
            this.errors = response.errors;
        }
    }
}

export const fetchJson = (url: string, options?: Partial<FetchOptions>): Promise<unknown> => {
    const fetchOptions: FetchOptions = {
        method: 'GET',
        headers: {},
    };

    if (options) {
        Object.assign(fetchOptions, options);
    }

    const csrfToken = getCsrfToken();
    if (csrfToken) {
        fetchOptions.headers['X-CSRF-Token'] = csrfToken;
    }

    if (!fetchOptions.body && !fetchOptions.headers['Content-Type']) {
        fetchOptions.headers['Content-Type'] = 'application/json';
    }

    function parseJSON(response: Response): Promise<{ status: number; ok: boolean; json: unknown }> {
        return response.text().then((text) => {
            let json: unknown;
            try {
                json = text ? JSON.parse(text) : {};
            } catch (_err) {
                json = { message: response };
            }
            return { status: response.status, ok: response.ok, json };
        });
    }

    return new Promise((resolve, reject) => {
        fetch(url, fetchOptions)
            .then(parseJSON)
            .then((response) => {
                if (response.ok) {
                    return resolve(response.json);
                }
                if (response.status && (response.status === 401 || response.status === 403)) {
                    navigateTo('/welcome');
                    return undefined;
                }

                if (response.json) {
                    return reject(new lpError(response.json as ErrorResponse, response.status));
                }

                return reject(new lpError(response as unknown as ErrorResponse));
            })
            .catch((err) => {
                const wrappedErr = err && err instanceof TypeError && err.message === 'Failed to fetch' ? {} : err;
                return reject(new lpError(wrappedErr as ErrorResponse));
            });
    });
};

export function displayWeight(mg: number, unit: string): number | string {
    return MgToWeight(mg, unit) || 0;
}

export function displayPrice(price: number | undefined, symbol: string): string {
    let amount = '0.00';
    if (typeof price === 'number') {
        amount = price.toFixed(2);
    }
    return symbol + amount;
}

// Browser-only globals — skip during SSR
declare global {
    interface Window {
        readCookie: (name: string) => string | null;
        createCookie: (name: string, value: string, days?: number) => void;
        getElementIndex: (node: Element) => number;
        arrayMove: <T>(inputArray: T[], oldIndex: number, newIndex: number) => T[];
        displayWeight: typeof displayWeight;
        displayPrice: typeof displayPrice;
    }
}

if (typeof window !== 'undefined') {
    window.readCookie = function (name: string): string | null {
        const nameEQ = `${name}=`;
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    window.createCookie = function (name: string, value: string, days?: number): void {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = `; expires=${date.toUTCString()}`;
        }
        document.cookie = `${name}=${value}${expires}; path=/`;
    };

    window.getElementIndex = function (node: Element): number {
        let index = 0;
        let currentNode: Element | null = node;
        while ((currentNode = currentNode.previousElementSibling)) {
            index++;
        }
        return index;
    };

    window.arrayMove = function <T>(inputArray: T[], oldIndex: number, newIndex: number): T[] {
        const array = inputArray.slice();
        const element = array[oldIndex];
        array.splice(oldIndex, 1);
        array.splice(newIndex, 0, element);
        return array;
    };

    window.displayWeight = displayWeight;
    window.displayPrice = displayPrice;
}
```

- [ ] **Step 2: Update import paths in Vue components**

**`app/components/account-delete.vue`** line 36:

```ts
// Before
import { fetchJson } from '../utils/utils.js';
// After
import { fetchJson } from '../utils/utils';
```

**`app/components/list-actions.vue`** line 121:

```ts
// Before
import { fetchJson } from '../utils/utils.js';
// After
import { fetchJson } from '../utils/utils';
```

- [ ] **Step 3: Run tests**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: convert app/utils/utils to TypeScript"
```

---

### Task 8: Convert `app/utils/focus.ts`

**Files:**

- Rename: `app/utils/focus.js` → `app/utils/focus.ts`

- [ ] **Step 1: Rename and add types**

Delete `app/utils/focus.js` and create `app/utils/focus.ts`:

```ts
import type { App, DirectiveBinding } from 'vue';
import { useLighterpackStore } from '../store/store';

let _uniqueIdCounter = 0;
const uniqueId = (): string => String(++_uniqueIdCounter);

export function registerDirectives(app: App): void {
    app.directive('select-on-focus', {
        mounted(el: HTMLInputElement) {
            el.addEventListener('focus', () => {
                el.select();
            });
        },
    });

    app.directive('focus-on-create', {
        mounted(el: HTMLElement, binding: DirectiveBinding) {
            if ((binding.expression && binding.value) || !binding.expression) {
                el.focus();
            }
        },
    });

    app.directive('empty-if-zero', {
        mounted(el: HTMLInputElement) {
            el.addEventListener('focus', () => {
                if (el.value === '0' || el.value === '0.00') {
                    el.dataset.originalValue = el.value;
                    el.value = '';
                }
            });

            el.addEventListener('blur', () => {
                if (el.value === '') {
                    el.value = el.dataset.originalValue || '0';
                }
            });
        },
    });

    app.directive('click-outside', {
        mounted(el: HTMLElement, binding: DirectiveBinding) {
            const store = useLighterpackStore();
            const handler = (evt: Event) => {
                if (el.contains(evt.target as Node)) {
                    return;
                }
                if (binding && typeof binding.value === 'function') {
                    binding.value();
                }
            };

            window.addEventListener('click', handler);

            el.dataset.clickoutside = uniqueId();
            store.addDirectiveInstance({ key: el.dataset.clickoutside, value: handler });
        },
        unmounted(el: HTMLElement) {
            const store = useLighterpackStore();
            const handler = store.directiveInstances[el.dataset.clickoutside!];
            store.removeDirectiveInstance(el.dataset.clickoutside!);
            window.removeEventListener('click', handler);
        },
    });
}
```

- [ ] **Step 2: Run tests**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: convert app/utils/focus to TypeScript"
```

---

### Task 9: Convert `app/composables/useItemDrag.ts`

**Files:**

- Rename: `app/composables/useItemDrag.js` → `app/composables/useItemDrag.ts`

- [ ] **Step 1: Check if sortablejs ships its own types**

Run: `ls node_modules/sortablejs/Sortable.d.ts 2>/dev/null && echo "Types included" || echo "Need @types/sortablejs"`

If "Need @types/sortablejs": run `npm install -D @types/sortablejs`

- [ ] **Step 2: Rename and add types**

Delete `app/composables/useItemDrag.js` and create `app/composables/useItemDrag.ts`:

```ts
import Sortable, { type SortableEvent } from 'sortablejs';
import { useLighterpackStore } from '../store/store';
import type { Ref } from 'vue';
import type { IList } from '#shared/types';

function revertDOM(item: HTMLElement, container: HTMLElement, oldIndex: number, newIndex: number): void {
    if (newIndex < oldIndex) {
        container.insertBefore(item, container.children[oldIndex + 1] ?? null);
    } else {
        container.insertBefore(item, container.children[oldIndex] ?? null);
    }
}

export function useItemDrag(): { setup: (list: Ref<IList>) => void; destroy: () => void } {
    const store = useLighterpackStore();
    let sortables: Sortable[] = [];

    function setup(list: Ref<IList>): void {
        destroy();
        const containers = Array.from(document.getElementsByClassName('lpItems')) as HTMLElement[];
        sortables = containers.map((container) =>
            Sortable.create(container, {
                group: {
                    name: 'items',
                    pull: true,
                    put: true,
                },
                handle: '.lpItemHandle',
                draggable: '.lpItem',
                animation: 150,
                onEnd(evt: SortableEvent) {
                    if (evt.from !== evt.to) return;
                    const oldIdx = evt.oldIndex ?? 0;
                    const newIdx = evt.newIndex ?? 0;
                    revertDOM(evt.item, evt.from, oldIdx, newIdx);
                    store.reorderItem({
                        list: list.value,
                        itemId: parseInt(evt.item.id),
                        categoryId: parseInt((evt.to.parentElement as HTMLElement).id),
                        dropIndex: evt.newDraggableIndex ?? newIdx,
                    });
                },
                onAdd(evt: SortableEvent) {
                    const { item, to, newDraggableIndex, newIndex } = evt;
                    const categoryId = parseInt((to.parentElement as HTMLElement).id);
                    const dropIndex = newDraggableIndex ?? newIndex ?? 0;
                    (item.parentNode as HTMLElement).removeChild(item);
                    if ((item as HTMLElement).dataset.itemId) {
                        store.addItemToCategory({
                            itemId: parseInt((item as HTMLElement).dataset.itemId!),
                            categoryId,
                            dropIndex,
                        });
                    } else {
                        store.reorderItem({
                            list: list.value,
                            itemId: parseInt(item.id),
                            categoryId,
                            dropIndex,
                        });
                    }
                },
            }),
        );
    }

    function destroy(): void {
        sortables.forEach((s) => s.destroy());
        sortables = [];
    }

    return { setup, destroy };
}
```

- [ ] **Step 3: Run tests**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: convert app/composables/useItemDrag to TypeScript"
```

---

### Task 10: Convert `app/store/store.ts`

**Files:**

- Rename: `app/store/store.js` → `app/store/store.ts`
- Modify: ~25 Vue components, plugins, and middleware (update import paths)
- Rename: `test/unit/store/store.spec.js` → `test/unit/store/store.spec.ts`

- [ ] **Step 1: Rename `store.js` → `store.ts` and add types**

Key changes — update imports at top of file:

```ts
import { defineStore } from 'pinia';
import { WeightToMg } from '#shared/utils/weight';
import dataTypes from '#shared/dataTypes';
import { getCsrfToken } from '~/utils/csrf';
```

Add type imports and destructure:

```ts
import type {
    Library as LibraryType,
    List as ListType,
    Category as CategoryType,
    Item as ItemType,
} from '#shared/dataTypes';
const { Library, List, Category, Item } = dataTypes;
```

Type the server response interfaces:

```ts
interface ServerItem {
    id: number;
    name?: string;
    description?: string;
    weight?: number;
    author_unit?: string;
    price?: number;
    image?: string;
    image_url?: string;
    url?: string;
    images?: Array<{ id: number; url: string; sort_order: number }>;
    qty?: number;
    worn?: number;
    consumable?: boolean;
    star?: number;
}

interface ServerCategory {
    id: number;
    name?: string;
}

interface ServerList {
    id: number;
    name?: string;
    description?: string;
    external_id?: string;
}
```

Type the helper functions:

```ts
function addItemToLibrary(
    library: LibraryType,
    serverItem: ServerItem,
    category: CategoryType | null,
    _isNew?: boolean,
): ItemType {
    // body unchanged
}

function addCategoryToLibrary(
    library: LibraryType,
    serverCategory: ServerCategory,
    list: ListType | null,
): CategoryType {
    // body unchanged
}

function addListToLibrary(library: LibraryType, serverList: ServerList): ListType {
    // body unchanged
}
```

Type the store state:

```ts
export const useLighterpackStore = defineStore('lighterpack', {
    state: () => ({
        library: false as LibraryType | false,
        loggedIn: false as string | false,
        directiveInstances: {} as Record<string, EventListener>,
        globalAlerts: [] as Array<{ message: string }>,
        activeModal: null as string | null,
        speedbump: null as { callback: (confirmed: boolean) => void; options?: unknown } | null,
        importCSVTrigger: 0,
        activeItemDialog: null as Record<string, unknown> | null,
    }),
    // getters and actions — add parameter types to action signatures
    // Method bodies stay identical
});
```

- [ ] **Step 2: Update all import paths**

Update every file that imports from `store.js` to drop the `.js` extension. Change `~/store/store.js` → `~/store/store` or `../store/store.js` → `../store/store` in:

- `app/pages/index.vue`
- `app/pages/welcome.vue`
- `app/pages/r/[id].vue`
- `app/plugins/store-global.client.ts`
- `app/plugins/session.client.ts`
- `app/middleware/auth.ts`
- `app/components/list.vue`
- `app/components/list-summary.vue`
- `app/components/category.vue`
- `app/components/item.vue`
- `app/components/import-csv.vue`
- `app/components/library-lists.vue`
- `app/components/list-actions.vue`
- `app/components/sidebar.vue`
- `app/components/account-dropdown.vue`
- `app/components/account.vue`
- `app/components/global-alerts.vue`
- `app/components/item-image.vue`
- `app/components/item-link.vue`
- `app/components/library-items.vue`
- `app/components/list-settings.vue`
- `app/components/item-view-image.vue`
- `app/components/account-delete.vue`
- `app/components/speedbump.vue`
- `app/utils/focus.ts` (already updated in Task 8)

- [ ] **Step 3: Convert store test file**

Rename `test/unit/store/store.spec.js` → `test/unit/store/store.spec.ts` and update import:

```ts
// Before
import { useLighterpackStore } from '../../../app/store/store.js';
// After
import { useLighterpackStore } from '../../../app/store/store';
```

- [ ] **Step 4: Run tests**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All tests pass.

Run: `npm run test:server 2>&1 | tail -5`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: convert app/store/store to TypeScript"
```

---

### Task 11: Convert remaining test files (batch)

**Files:**

- Rename: all remaining `.spec.js` files in `test/unit/components/` and `test/unit/views/` to `.spec.ts` (28 files)

These test files only need:

1. Rename `.js` → `.ts`
2. Update import paths (drop `.js` extensions)
3. Add minimal type annotations where TS complains

- [ ] **Step 1: Rename all remaining test files**

Rename each `.spec.js` → `.spec.ts` via `git mv`:

Files in `test/unit/components/`:

- `colorpicker.spec.js` → `.spec.ts`
- `donut-chart.spec.js` → `.spec.ts`
- `errors.spec.js` → `.spec.ts`
- `import-csv.spec.js` → `.spec.ts`
- `item-link.spec.js` → `.spec.ts`
- `library-items.spec.js` → `.spec.ts`
- `list-settings.spec.js` → `.spec.ts`
- `popover-hover.spec.js` → `.spec.ts`
- `popover.spec.js` → `.spec.ts`
- `speedbump.spec.js` → `.spec.ts`
- `account-delete.spec.js` → `.spec.ts`
- `account.spec.js` → `.spec.ts`
- `account-dropdown.spec.js` → `.spec.ts`
- `global-alerts.spec.js` → `.spec.ts`
- `modal.spec.js` → `.spec.ts`
- `sidebar.spec.js` → `.spec.ts`
- `spinner.spec.js` → `.spec.ts`
- `unit-select.spec.js` → `.spec.ts`
- `item-image.spec.js` → `.spec.ts`
- `item-view-image.spec.js` → `.spec.ts`
- `library-lists.spec.js` → `.spec.ts`
- `list-actions.spec.js` → `.spec.ts`
- `category.spec.js` → `.spec.ts`
- `item.spec.js` → `.spec.ts`
- `list-summary.spec.js` → `.spec.ts`
- `list.spec.js` → `.spec.ts`
- `signin-form.spec.js` → `.spec.ts`

Files in `test/unit/views/`:

- `welcome.spec.js` → `.spec.ts`
- `dashboard.spec.js` → `.spec.ts`

- [ ] **Step 2: Update import paths in all renamed files**

In every renamed file, update imports to drop `.js` extensions:

```ts
// Before
import { useLighterpackStore } from '../../../app/store/store.js';
// After
import { useLighterpackStore } from '../../../app/store/store';
```

The store import is the most common one. Also check for and update any other `.js` imports.

- [ ] **Step 3: Add type annotations where needed**

Common patterns in component tests:

- `wrapper` variables: `const wrapper = mount(Component)` — usually TS infers this, no annotation needed
- Store references: `const store = useLighterpackStore()` — already typed from the converted store
- Mock data: if passing partial objects, use type assertions like `as Partial<IItem>`

- [ ] **Step 4: Run tests**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All 37 test files pass, 323 tests pass.

Run: `npm run test:server 2>&1 | tail -5`
Expected: All 13 test files pass, 94 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: convert remaining test files to TypeScript"
```

---

### Task 12: Final verification and cleanup

**Files:**

- Modify: `tsconfig.json` (remove `checkJs` since no JS files remain)

- [ ] **Step 1: Verify no `.js` source files remain**

Run: `find app/ shared/ -name '*.js' -not -path '*/node_modules/*'`
Expected: No output (no JS files remaining).

Run: `find test/unit/ -name '*.spec.js'`
Expected: No output (no JS test files remaining).

- [ ] **Step 2: Run full test suite**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: All 37 test files pass, 323 tests pass.

Run: `npm run test:server 2>&1 | tail -5`
Expected: All 13 test files pass, 94 tests pass.

- [ ] **Step 3: Run linter**

Run: `npm run lint:js 2>&1 | tail -20`
Expected: No errors (warnings OK). If the ESLint config only targets `.js` and `.vue`, update it to include `.ts` files.

- [ ] **Step 4: Run typecheck**

Run: `npx nuxi typecheck 2>&1 | tail -20`
Expected: No new errors.

- [ ] **Step 5: Clean up `tsconfig.json`**

Since no `.js` source files remain, the `"checkJs": false` line in `tsconfig.json` is no longer relevant. Remove it:

```json
{
    "extends": "./.nuxt/tsconfig.json"
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: final TypeScript conversion cleanup"
```
