import { getColor, rgbToString } from './utils/color';
import { MgToWeight } from './utils/weight';

import type { RGB, ImageRecord, CategoryItem, OptionalFields, ChartData, ChartPoint, WeightUnit } from './types';

const defaultOptionalFields: OptionalFields = {
    images: false,
    price: false,
    worn: true,
    consumable: true,
    listDescription: false,
};

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
        this.authorUnit = 'oz';
        if (unit) {
            this.authorUnit = unit;
        }
        this.price = 0.0;
        this.url = '';
        this.images = [];
    }

    save(): Item {
        return this;
    }

    load(input: Record<string, any>): void {
        Object.assign(this, input);
        if (typeof this.price === 'string') {
            this.price = parseFloat(this.price);
        }
    }
}

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
    _isNew?: boolean;
    displayColor?: string;
    color?: RGB;

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
            itemId: null as unknown as number,
            _isNew: false,
        };
        Object.assign(tempCategoryItem, partialCategoryItem);
        this.categoryItems.push(tempCategoryItem);
    }

    updateCategoryItem(categoryItem: Partial<CategoryItem>): void {
        const oldCategoryItem = this.getCategoryItemById(categoryItem.itemId);
        if (oldCategoryItem) Object.assign(oldCategoryItem, categoryItem);
    }

    removeItem(itemId: number): void {
        const categoryItem = this.getCategoryItemById(itemId);
        const index = this.categoryItems.indexOf(categoryItem as CategoryItem);
        this.categoryItems.splice(index, 1);
    }

    calculateSubtotal(): void {
        this.subtotalWeight = 0;
        this.subtotalWornWeight = 0;
        this.subtotalConsumableWeight = 0;
        this.subtotalPrice = 0;
        this.subtotalConsumablePrice = 0;
        this.subtotalQty = 0;

        for (const i in this.categoryItems) {
            const categoryItem = this.categoryItems[i];
            const item = this.library.getItemById(categoryItem.itemId);
            if (!item) {
                continue;
            }
            this.subtotalWeight += item.weight * categoryItem.qty;
            this.subtotalPrice += item.price * categoryItem.qty;

            if (this.library.optionalFields.worn && categoryItem.worn) {
                this.subtotalWornWeight += item.weight * (categoryItem.qty > 0 ? 1 : 0);
            }
            if (this.library.optionalFields.consumable && categoryItem.consumable) {
                this.subtotalConsumableWeight += item.weight * categoryItem.qty;
                this.subtotalConsumablePrice += item.price * categoryItem.qty;
            }
            this.subtotalQty += categoryItem.qty;
        }
    }

    getCategoryItemById(id: number | undefined): CategoryItem | null {
        for (const i in this.categoryItems) {
            const categoryItem = this.categoryItems[i];
            if (categoryItem.itemId === id) return categoryItem;
        }
        return null;
    }

    getExtendedItemByIndex(index: number | string): Record<string, any> {
        const categoryItem = this.categoryItems[index as unknown as number];
        const item = this.library.getItemById(categoryItem.itemId);
        const extendedItem = Object.assign({}, item);
        Object.assign(extendedItem, categoryItem);
        return extendedItem;
    }

    save(): Record<string, any> {
        const out: Record<string, any> = Object.assign({}, this);

        delete out.library;
        delete out.template;
        delete out._isNew;

        return out;
    }

    load(input: Record<string, any>): void {
        delete input._isNew;

        Object.assign(this, input);

        this.categoryItems.forEach((categoryItem: Record<string, any>, index: number) => {
            delete categoryItem._isNew;
            if (typeof categoryItem.price !== 'undefined') {
                delete categoryItem.price;
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

class List {
    library: Library;
    id: number;
    name: string;
    categoryIds: (number | string)[];
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

    removeCategory(categoryId: number | string): boolean {
        const catId = parseInt(categoryId as string);
        let index = this.categoryIds.indexOf(catId);
        if (index === -1) {
            index = this.categoryIds.indexOf(`${catId}`);
            if (index === -1) {
                console.warn(`Unable to delete category, it does not exist in this list:${catId}`);
                return false;
            }
        }

        this.categoryIds.splice(index, 1);
        return true;
    }

    renderChart(type: string, linkParent: boolean = true): ChartData | false {
        const chartData: ChartData = { points: {}, total: 0 };
        let total = 0;

        for (const i in this.categoryIds) {
            const category = this.library.getCategoryById(this.categoryIds[i]);
            if (category) {
                category.calculateSubtotal();

                if (type === 'consumable') {
                    total += category.subtotalConsumableWeight;
                } else if (type === 'worn') {
                    total += category.subtotalWornWeight;
                } else if (type === 'base') {
                    total +=
                        category.subtotalWeight - (category.subtotalConsumableWeight + category.subtotalWornWeight);
                } else {
                    // total weight
                    total += category.subtotalWeight;
                }
            }
        }

        if (!total) return false;

        const getTooltipText = function (name: string, valueMg: number, unit: string): string {
            return `${name}: ${MgToWeight(valueMg, unit as WeightUnit)} ${unit}`;
        };

        for (const i in this.categoryIds) {
            const category = this.library.getCategoryById(this.categoryIds[i]);
            if (category) {
                const points: Record<string, ChartPoint> = {};

                let categoryTotal: number;
                if (type === 'consumable') {
                    categoryTotal = category.subtotalConsumableWeight;
                } else if (type === 'worn') {
                    categoryTotal = category.subtotalWornWeight;
                } else if (type === 'base') {
                    categoryTotal =
                        category.subtotalWeight - (category.subtotalConsumableWeight + category.subtotalWornWeight);
                } else {
                    // total weight
                    categoryTotal = category.subtotalWeight;
                }

                const tempColor = category.color || getColor(+i);
                category.displayColor = rgbToString(tempColor);
                const tempCategory: Record<string, any> = {};

                for (const j in category.categoryItems) {
                    const item = category.getExtendedItemByIndex(j);
                    let value = item.weight * item.qty;
                    if (!value) value = 0;
                    let name = getTooltipText(item.name, value, item.authorUnit);
                    const color = getColor(+j, tempColor);
                    if (item.qty > 1) name += ` x ${item.qty}`;
                    const percent = value / categoryTotal;
                    const tempItem: ChartPoint & { parent?: any } = {
                        value,
                        id: item.id,
                        name,
                        color,
                        percent,
                    };
                    if (linkParent) tempItem.parent = tempCategory;
                    points[j] = tempItem;
                }
                const categoryPercent = categoryTotal / total;
                const tempCategoryData: Record<string, any> = {
                    points,
                    color: category.color,
                    id: category.id,
                    name: getTooltipText(category.name, categoryTotal, this.library.totalUnit),
                    total: categoryTotal,
                    percent: categoryPercent,
                    visiblePoints: false,
                };
                if (linkParent) tempCategoryData.parent = chartData;
                Object.assign(tempCategory, tempCategoryData);
                chartData.points[i] = tempCategory as any;
            }
        }
        chartData.total = total;

        return chartData;
    }

    calculateTotals(): void {
        let totalWeight = 0;
        let totalPrice = 0;
        let totalWornWeight = 0;
        let totalConsumableWeight = 0;
        let totalConsumablePrice = 0;
        let totalBaseWeight = 0;
        let totalPackWeight = 0;
        let totalQty = 0;
        const out: { categories: Category[] } = { categories: [] };

        for (const i in this.categoryIds) {
            const category = this.library.getCategoryById(this.categoryIds[i]);

            if (category) {
                category.calculateSubtotal();

                totalWeight += category.subtotalWeight;
                totalWornWeight += category.subtotalWornWeight;
                totalConsumableWeight += category.subtotalConsumableWeight;

                totalPrice += category.subtotalPrice;
                totalConsumablePrice += category.subtotalConsumablePrice;

                totalQty += category.subtotalQty;

                out.categories.push(category);
            }
        }

        totalBaseWeight = totalWeight - (totalWornWeight + totalConsumableWeight);
        totalPackWeight = totalWeight - totalWornWeight;

        this.totalWeight = totalWeight;
        this.totalWornWeight = totalWornWeight;
        this.totalConsumableWeight = totalConsumableWeight;

        this.totalBaseWeight = totalBaseWeight;
        this.totalPackWeight = totalPackWeight;

        this.totalPrice = totalPrice;
        this.totalConsumablePrice = totalConsumablePrice;

        this.totalQty = totalQty;
    }

    save(): Record<string, any> {
        const out: Record<string, any> = Object.assign({}, this);
        delete out.library;
        delete out.chart;
        return out;
    }

    load(input: Record<string, any>): void {
        Object.assign(this, input);
        this.calculateTotals();
    }
}

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
        this.optionalFields = Object.assign({}, defaultOptionalFields);
        this.currencySymbol = '$';
        this.firstRun();
    }

    firstRun(): void {
        const firstList = this.newList();
        const firstCategory = this.newCategory({ list: firstList });
        this.newItem({ category: firstCategory });
    }

    newItem({ category, _isNew }: { category?: Category; _isNew?: boolean }): Item {
        const temp = new Item({ id: this.nextSequence(), unit: this.itemUnit });
        this.items.push(temp);
        this.idMap[temp.id] = temp;
        this.itemsMap[temp.id] = temp;
        if (category) {
            category.addItem({ itemId: temp.id, _isNew });
        }
        return temp;
    }

    updateItem(item: Record<string, any>): Item {
        const oldItem = this.getItemById(item.id);
        Object.assign(oldItem, item);
        return oldItem;
    }

    removeItem(id: number): boolean {
        const item = this.getItemById(id);
        for (const i in this.lists) {
            const category = this.findCategoryWithItemById(id, this.lists[i].id);
            if (category) {
                category.removeItem(id);
            }
        }

        this.items.splice(this.items.indexOf(item), 1);
        delete this.itemsMap[id];
        delete this.idMap[id];

        return true;
    }

    newCategory({ list, _isNew }: { list?: List; _isNew?: boolean }): Category {
        const temp = new Category({ id: this.nextSequence(), _isNew, library: this });

        this.categories.push(temp);
        this.idMap[temp.id] = temp;
        this.categoriesMap[temp.id] = temp;
        if (list) {
            list.addCategory(temp.id);
        }

        return temp;
    }

    removeCategory(id: number, force?: boolean): boolean {
        const category = this.getCategoryById(id);
        const list = this.findListWithCategoryById(id);

        if (list && list.categoryIds.length === 1 && !force) {
            alert("Can't remove the last category in a list!");
            return false;
        }

        if (list) {
            list.removeCategory(id);
        }

        this.categories.splice(this.categories.indexOf(category), 1);
        delete this.idMap[id];
        delete this.categoriesMap[id];

        return true;
    }

    newList(): List {
        const temp = new List({ id: this.nextSequence(), library: this });
        this.lists.push(temp);
        this.idMap[temp.id] = temp;
        this.listsMap[temp.id] = temp;
        if (!this.defaultListId) this.defaultListId = temp.id;
        return temp;
    }

    removeList(id: number): void {
        if (this.lists.length === 1) return;
        const list = this.getListById(id);

        for (let i = 0; i < list.categoryIds.length; i++) {
            this.removeCategory(list.categoryIds[i] as number, true);
        }

        this.lists.splice(this.lists.indexOf(list), 1);
        delete this.idMap[id];
        delete this.listsMap[id];

        if (this.defaultListId === id) {
            this.defaultListId = this.lists.length > 0 ? this.lists[0].id : -1;
        }
    }

    copyList(id: number): List | undefined {
        const oldList = this.getListById(id);
        if (!oldList) return undefined;

        const copiedList = this.newList();

        copiedList.name = `Copy of ${oldList.name}`;
        for (const i in oldList.categoryIds) {
            const oldCategory = this.getCategoryById(oldList.categoryIds[i]);
            const copiedCategory = this.newCategory({ list: copiedList });

            copiedCategory.name = oldCategory.name;

            for (const j in oldCategory.categoryItems) {
                copiedCategory.addItem(oldCategory.categoryItems[j]);
            }
        }

        return copiedList;
    }

    renderChart(type: string): ChartData | false {
        const list = this.getListById(this.defaultListId);
        if (!list) return false;
        return list.renderChart(type);
    }

    getCategoryById(id: number | string): Category {
        return this.categoriesMap[id as number];
    }

    getItemById(id: number | string): Item {
        return this.itemsMap[id as number];
    }

    getListById(id: number | string): List {
        return this.listsMap[id as number];
    }

    getItemsInCurrentList(): number[] {
        const out: number[] = [];
        const list = this.getListById(this.defaultListId);
        if (!list) return out;
        for (let i = 0; i < list.categoryIds.length; i++) {
            const category = this.getCategoryById(list.categoryIds[i]);
            if (category) {
                for (const j in category.categoryItems) {
                    const categoryItem = category.categoryItems[j];
                    out.push(categoryItem.itemId);
                }
            }
        }
        return out;
    }

    findCategoryWithItemById(itemId: number, listId?: number): Category | undefined {
        if (listId) {
            const list = this.getListById(listId);
            for (const i in list.categoryIds) {
                const category = this.getCategoryById(list.categoryIds[i]);
                if (category) {
                    for (const j in category.categoryItems) {
                        const categoryItem = category.categoryItems[j];
                        if (categoryItem.itemId === itemId) return category;
                    }
                }
            }
        } else {
            for (const i in this.categories) {
                const category = this.categories[i];
                if (category) {
                    for (const j in category.categoryItems) {
                        const categoryItem = category.categoryItems[j];
                        if (categoryItem.itemId === itemId) return category;
                    }
                }
            }
        }
        return undefined;
    }

    findListWithCategoryById(id: number): List | undefined {
        for (const i in this.lists) {
            const list = this.lists[i];
            for (const j in list.categoryIds) {
                if (list.categoryIds[j] === id) return list;
            }
        }
        return undefined;
    }

    nextSequence(): number {
        return ++this.sequence;
    }

    save(): Record<string, any> {
        const out: Record<string, any> = {};

        out.version = this.version;
        out.totalUnit = this.totalUnit;
        out.itemUnit = this.itemUnit;
        out.defaultListId = this.defaultListId;
        out.sequence = this.sequence;
        out.showSidebar = this.showSidebar;
        out.optionalFields = this.optionalFields;
        out.currencySymbol = this.currencySymbol;

        out.items = [];
        for (const i in this.items) {
            out.items.push(this.items[i].save());
        }

        out.categories = [];
        for (const i in this.categories) {
            out.categories.push(this.categories[i].save());
        }

        out.lists = [];
        for (const i in this.lists) {
            out.lists.push(this.lists[i].save());
        }

        return out;
    }

    load(serializedLibrary: Record<string, any>): void {
        // upgrades should update "serializedLibrary" in-place instead of modifying "this"
        if (serializedLibrary.version === '0.1' || !serializedLibrary.version) {
            this.upgrade01to02(serializedLibrary);
        }
        if (serializedLibrary.version === '0.2') {
            this.upgrade02to03(serializedLibrary);
        }

        this.items = [];

        Object.assign(this.optionalFields, serializedLibrary.optionalFields);

        for (const i in serializedLibrary.items) {
            const temp = new Item({ id: serializedLibrary.items[i].id });
            temp.load(serializedLibrary.items[i]);
            this.items.push(temp);
            this.idMap[temp.id] = temp;
            this.itemsMap[temp.id] = temp;
        }

        this.categories = [];
        for (const i in serializedLibrary.categories) {
            const temp = new Category({ id: serializedLibrary.categories[i].id, library: this });
            temp.load(serializedLibrary.categories[i]);
            this.categories.push(temp);
            this.idMap[temp.id] = temp;
            this.categoriesMap[temp.id] = temp;
        }

        this.lists = [];
        for (const i in serializedLibrary.lists) {
            const temp = new List({ id: serializedLibrary.lists[i].id, library: this });
            temp.load(serializedLibrary.lists[i]);
            this.lists.push(temp);
            this.idMap[temp.id] = temp;
            this.listsMap[temp.id] = temp;
        }

        if (serializedLibrary.showSidebar) this.showSidebar = serializedLibrary.showSidebar;
        if (serializedLibrary.totalUnit) this.totalUnit = serializedLibrary.totalUnit;
        if (serializedLibrary.itemUnit) this.itemUnit = serializedLibrary.itemUnit;
        if (serializedLibrary.currencySymbol) this.currencySymbol = serializedLibrary.currencySymbol;

        this.version = serializedLibrary.version;
        this.sequence = serializedLibrary.sequence;
        this.defaultListId = serializedLibrary.defaultListId;
    }

    upgrade01to02(serializedLibrary: Record<string, any>): void {
        if (!serializedLibrary.optionalFields) {
            serializedLibrary.optionalFields = Object.assign({}, defaultOptionalFields);
        }

        if (serializedLibrary.showImages) {
            serializedLibrary.optionalFields.images = true;
        } else {
            serializedLibrary.optionalFields.images = false;
        }
        serializedLibrary.version = '0.2';
    }

    upgrade02to03(serializedLibrary: Record<string, any>): void {
        this.sequenceShouldBeCorrect(serializedLibrary);
        this.idsShouldBeInts(serializedLibrary);
        this.renameCategoryIds(serializedLibrary);
        this.fixDuplicateIds(serializedLibrary);
        serializedLibrary.version = '0.3';
    }

    sequenceShouldBeCorrect(serializedLibrary: Record<string, any>): void {
        let sequence = 0;

        for (const list of serializedLibrary.lists) {
            if (list.id > sequence) {
                sequence = list.id;
            }
        }

        for (const category of serializedLibrary.categories) {
            if (category.id > sequence) {
                sequence = category.id;
            }
        }

        for (const item of serializedLibrary.items) {
            if (item.id > sequence) {
                sequence = item.id;
            }
        }
        serializedLibrary.sequence = sequence + 1;
    }

    idsShouldBeInts(serializedLibrary: Record<string, any>): void {
        // Some lists of Ids were strings previously. They should be numbers.
        for (const list of serializedLibrary.lists) {
            list.categoryIds = list.categoryIds.map((categoryId: string | number) => parseInt(categoryId as string, 10));
        }
    }

    renameCategoryIds(serializedLibrary: Record<string, any>): void {
        // categoryIds was previously itemIds. Renaming for clarity.
        for (const category of serializedLibrary.categories) {
            if (typeof category.itemIds !== 'undefined') {
                if (!category.categoryItems || category.categoryItems.length === 0) {
                    category.categoryItems = category.itemIds;
                    delete category.itemIds;
                } else {
                    delete category.itemIds;
                }
            }
            if (typeof category.categoryItems === 'undefined') {
                category.categoryItems = [];
            }
        }
    }

    fixDuplicateIds(serializedLibrary: Record<string, any>): void {
        const foundIds: Record<string, any[]> = {};

        for (const item of serializedLibrary.items) {
            if (!foundIds[item.id]) {
                foundIds[item.id] = [];
            }
            foundIds[item.id].push({ type: 'item', item });
        }

        for (const category of serializedLibrary.categories) {
            if (!foundIds[category.id]) {
                foundIds[category.id] = [];
            }
            foundIds[category.id].push({ type: 'category', category });
        }

        for (const list of serializedLibrary.lists) {
            if (!foundIds[list.id]) {
                foundIds[list.id] = [];
            }
            foundIds[list.id].push({ type: 'list', list });
        }

        for (const id in foundIds) {
            if (foundIds[id].length > 1) {
                const duplicateSet = foundIds[id];
                duplicateSet.forEach((duplicate, index) => {
                    if (index === 0) {
                        return;
                    }
                    if (duplicate.type === 'item') {
                        this.updateItemId(serializedLibrary, duplicate.item, ++serializedLibrary.sequence);
                    } else if (duplicate.type === 'category') {
                        this.updateCategoryId(serializedLibrary, duplicate.category, ++serializedLibrary.sequence);
                    } else if (duplicate.type === 'list') {
                        this.updateListId(serializedLibrary, duplicate.list, ++serializedLibrary.sequence);
                    }
                });
            }
        }
    }

    updateListId(serializedLibrary: Record<string, any>, list: Record<string, any>, newId: number): void {
        list.id = newId;
    }

    updateCategoryId(serializedLibrary: Record<string, any>, category: Record<string, any>, newId: number): void {
        const oldId = category.id;

        category.id = newId;

        for (const list of serializedLibrary.lists) {
            list.categoryIds.forEach((categoryId: number, index: number) => {
                if (categoryId === oldId) {
                    list.categoryIds[index] = newId;
                }
            });
        }
    }

    updateItemId(serializedLibrary: Record<string, any>, item: Record<string, any>, newId: number): void {
        const oldId = item.id;

        item.id = newId;

        for (const category of serializedLibrary.categories) {
            for (const categoryItem of category.categoryItems) {
                if (categoryItem.itemId === oldId) {
                    categoryItem.itemId = newId;
                }
            }
        }
    }
}

export { Library, List, Category, Item };

export default {
    Library,
    List,
    Category,
    Item,
};
