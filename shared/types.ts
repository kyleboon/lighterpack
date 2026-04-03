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
