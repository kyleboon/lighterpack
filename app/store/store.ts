import { defineStore } from 'pinia';
import { WeightToMg } from '#shared/utils/weight';
import dataTypes from '#shared/dataTypes';
import { getCsrfToken } from '~/utils/csrf';

const { Library, List, Category, Item } = dataTypes;
type LibraryType = InstanceType<typeof Library>;
type ListType = InstanceType<typeof List>;
type CategoryType = InstanceType<typeof Category>;
type ItemType = InstanceType<typeof Item>;

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function addItemToLibrary(library: LibraryType, serverItem: ServerItem, category: CategoryType | null, _isNew?: boolean): ItemType {
    const item = new Item({ id: serverItem.id, unit: serverItem.author_unit || library.itemUnit });
    item.name = serverItem.name ?? '';
    item.description = serverItem.description ?? '';
    item.weight = serverItem.weight ?? 0;
    item.authorUnit = serverItem.author_unit ?? library.itemUnit;
    item.price = serverItem.price ?? 0;
    item.image = serverItem.image ?? '';
    item.imageUrl = serverItem.image_url ?? '';
    item.url = serverItem.url ?? '';
    item.images = serverItem.images ?? [];
    library.items.push(item);
    library.idMap[item.id] = item;
    library.itemsMap[item.id] = item;
    if (category) {
        category.addItem({
            itemId: item.id,
            qty: serverItem.qty ?? 1,
            worn: serverItem.worn ?? 0,
            consumable: Boolean(serverItem.consumable),
            star: serverItem.star ?? 0,
            _isNew: _isNew ?? false,
        });
    }
    return item;
}

function addCategoryToLibrary(library: LibraryType, serverCategory: ServerCategory, list: ListType | null): CategoryType {
    const category = new Category({ id: serverCategory.id, library });
    category.name = serverCategory.name ?? '';
    library.categories.push(category);
    library.idMap[category.id] = category;
    library.categoriesMap[category.id] = category;
    if (list) list.addCategory(category.id);
    // Return the reactive proxy (accessed via the reactive library) so that
    // subsequent mutations (e.g. category.addItem) go through Vue's proxy and
    // trigger reactivity updates in components.
    return library.categoriesMap[category.id];
}

function addListToLibrary(library: LibraryType, serverList: ServerList): ListType {
    const list = new List({ id: serverList.id, library });
    list.name = serverList.name ?? '';
    list.description = serverList.description ?? '';
    list.externalId = serverList.external_id ?? '';
    library.lists.push(list);
    library.idMap[list.id] = list;
    library.listsMap[list.id] = list;
    // Return the reactive proxy for the same reason as addCategoryToLibrary.
    return library.listsMap[list.id];
}

// ─── store ────────────────────────────────────────────────────────────────────

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

    getters: {
        activeList(state) {
            return state.library ? state.library.getListById(state.library.defaultListId) : null;
        },
    },

    actions: {
        // ── session ──────────────────────────────────────────────────────────
        signout() {
            // Better Auth handles its own CSRF — no custom token needed here.
            fetch('/api/auth/sign-out', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
            this.library = false;
            this.loggedIn = false;
        },
        setLoggedIn(loggedIn: string | false) {
            this.loggedIn = loggedIn;
        },
        loadLibraryData(libraryData: unknown) {
            const library = new Library();
            try {
                const parsed = typeof libraryData === 'string' ? JSON.parse(libraryData) : libraryData;
                library.load(parsed);
                this.library = library;
            } catch (_err) {
                this.globalAlerts.push({ message: 'An error occurred while loading your data.' });
            }
        },
        loadShareData(libraryData: unknown, externalId: string) {
            const library = new Library();
            try {
                const parsed = typeof libraryData === 'string' ? JSON.parse(libraryData) : libraryData;
                library.load(parsed);
                // Find the list matching the shared externalId and set it as active
                for (const l of library.lists) {
                    if (l.externalId && l.externalId === externalId) {
                        library.defaultListId = l.id;
                        break;
                    }
                }
                // Pre-calculate subtotals for all categories
                for (const cat of library.categories) {
                    cat.calculateSubtotal();
                }
                this.library = library;
            } catch (_err) {
                this.globalAlerts.push({ message: 'An error occurred while loading the shared list.' });
            }
        },
        clearLibraryData() {
            this.library = false;
        },

        // ── API helpers ──────────────────────────────────────────────────────
        async _api(method: string, url: string, body?: unknown) {
            const headers: Record<string, string> = {};
            const csrfToken = getCsrfToken();
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }
            return $fetch(url, {
                method,
                body: body !== undefined ? body : undefined,
                credentials: 'include',
                headers,
            });
        },
        async _reloadLibrary() {
            try {
                const data = await this._api('GET', '/api/library') as { library: unknown };
                this.loadLibraryData(data.library);
            } catch {
                this.globalAlerts.push({ message: 'An error occurred reloading your data.' });
            }
        },
        _showError(message: string) {
            this.globalAlerts.push({ message: message || 'An error occurred.' });
        },

        // ── library settings ─────────────────────────────────────────────────
        toggleSidebar() {
            const old = this.library.showSidebar;
            this.library.showSidebar = !this.library.showSidebar;
            if (this.loggedIn) {
                this._api('PATCH', '/api/library', { show_sidebar: this.library.showSidebar ? 1 : 0 }).catch(() => {
                    this.library.showSidebar = old;
                    this._showError('Failed to save setting.');
                });
            }
        },
        setDefaultList(list: { id: number }) {
            const oldId = this.library.defaultListId;
            this.library.defaultListId = list.id;
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                this._api('PATCH', '/api/library', { default_list_id: list.id }).catch(() => {
                    this.library.defaultListId = oldId;
                    this.library.getListById(oldId).calculateTotals();
                    this._showError('Failed to save setting.');
                });
            }
        },
        setTotalUnit(unit: string) {
            const old = this.library.totalUnit;
            this.library.totalUnit = unit;
            if (this.loggedIn) {
                this._api('PATCH', '/api/library', { total_unit: unit }).catch(() => {
                    this.library.totalUnit = old;
                    this._showError('Failed to save setting.');
                });
            }
        },
        toggleOptionalField(optionalField: string) {
            const old = this.library.optionalFields[optionalField];
            this.library.optionalFields[optionalField] = !this.library.optionalFields[optionalField];
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                const keyMap: Record<string, string> = {
                    images: 'opt_images',
                    price: 'opt_price',
                    worn: 'opt_worn',
                    consumable: 'opt_consumable',
                    listDescription: 'opt_list_description',
                };
                const key = keyMap[optionalField];
                if (key) {
                    this._api('PATCH', '/api/library', {
                        [key]: this.library.optionalFields[optionalField] ? 1 : 0,
                    }).catch(() => {
                        this.library.optionalFields[optionalField] = old;
                        this.library.getListById(this.library.defaultListId).calculateTotals();
                        this._showError('Failed to save setting.');
                    });
                }
            }
        },
        updateCurrencySymbol(currencySymbol: string) {
            const old = this.library.currencySymbol;
            this.library.currencySymbol = currencySymbol;
            if (this.loggedIn) {
                this._api('PATCH', '/api/library', { currency_symbol: currencySymbol }).catch(() => {
                    this.library.currencySymbol = old;
                    this._showError('Failed to save setting.');
                });
            }
        },
        updateItemUnit(unit: string) {
            const old = this.library.itemUnit;
            this.library.itemUnit = unit;
            if (this.loggedIn) {
                this._api('PATCH', '/api/library', { item_unit: unit }).catch(() => {
                    this.library.itemUnit = old;
                    this._showError('Failed to save setting.');
                });
            }
        },

        // ── lists ─────────────────────────────────────────────────────────────
        async newList() {
            if (!this.loggedIn) {
                const list = this.library.newList();
                const category = this.library.newCategory({ list });
                this.library.newItem({ category });
                list.calculateTotals();
                this.library.defaultListId = list.id;
                return;
            }
            try {
                const serverList = await this._api('POST', '/api/lists', { name: '', description: '' }) as ServerList;
                const list = addListToLibrary(this.library as LibraryType, serverList);

                const serverCategory = await this._api('POST', '/api/categories', { list_id: list.id, name: '' }) as ServerCategory;
                const category = addCategoryToLibrary(this.library as LibraryType, serverCategory, list);

                const serverItem = await this._api('POST', `/api/categories/${category.id}/items`, {}) as ServerItem;
                addItemToLibrary(this.library as LibraryType, serverItem, category);

                list.calculateTotals();
                this.library.defaultListId = list.id;
            } catch {
                this._showError('An error occurred creating the list.');
            }
        },
        updateListName(updatedList: { id: number; name: string }) {
            const list = this.library.getListById(updatedList.id);
            const old = list.name;
            list.name = updatedList.name;
            if (this.loggedIn) {
                this._api('PATCH', `/api/lists/${updatedList.id}`, { name: updatedList.name }).catch(() => {
                    list.name = old;
                    this._showError('An error occurred updating the list name.');
                });
            }
        },
        updateListDescription(updatedList: { id: number; description: string }) {
            const list = this.library.getListById(updatedList.id);
            const old = list.description;
            list.description = updatedList.description;
            if (this.loggedIn) {
                this._api('PATCH', `/api/lists/${updatedList.id}`, { description: updatedList.description }).catch(
                    () => {
                        list.description = old;
                        this._showError('An error occurred updating the list description.');
                    },
                );
            }
        },
        setExternalId(args: { list: { id: number }; externalId: string }) {
            const list = this.library.getListById(args.list.id);
            list.externalId = args.externalId;
        },
        removeList(list: { id: number }) {
            if (this.library.lists.length === 1) return;
            this.library.removeList(list.id);
            if (this.loggedIn) {
                this._api('DELETE', `/api/lists/${list.id}`).catch(async () => {
                    await this._reloadLibrary();
                    this._showError('An error occurred deleting the list.');
                });
            }
        },
        reorderList(args: { before: number; after: number }) {
            this.library.lists = window.arrayMove(this.library.lists, args.before, args.after);
            if (this.loggedIn) {
                const patches = this.library.lists.map((list: ListType, index: number) =>
                    this._api('PATCH', `/api/lists/${list.id}`, { sort_order: index }),
                );
                Promise.all(patches).catch(async () => {
                    await this._reloadLibrary();
                    this._showError('Failed to save list order.');
                });
            }
        },
        async copyList(listId: number) {
            const oldList = this.library.getListById(listId);
            if (!oldList) return;
            if (!this.loggedIn) {
                const copiedList = this.library.copyList(listId);
                this.library.defaultListId = copiedList.id;
                return;
            }
            try {
                const serverList = await this._api('POST', '/api/lists', {
                    name: `Copy of ${oldList.name}`,
                    description: oldList.description,
                }) as ServerList;
                const list = addListToLibrary(this.library as LibraryType, serverList);

                for (const categoryId of oldList.categoryIds) {
                    const oldCategory = this.library.getCategoryById(categoryId);
                    const serverCategory = await this._api('POST', '/api/categories', {
                        list_id: list.id,
                        name: oldCategory.name,
                    }) as ServerCategory;
                    const category = addCategoryToLibrary(this.library as LibraryType, serverCategory, list);

                    for (const ci of oldCategory.categoryItems) {
                        const oldItem = this.library.getItemById(ci.itemId);
                        const serverItem = await this._api('POST', `/api/categories/${category.id}/items`, {
                            name: oldItem.name,
                            description: oldItem.description,
                            weight: oldItem.weight,
                            author_unit: oldItem.authorUnit,
                            price: oldItem.price,
                            image: oldItem.image,
                            image_url: oldItem.imageUrl,
                            url: oldItem.url,
                            qty: ci.qty,
                            worn: ci.worn,
                            consumable: ci.consumable,
                            star: ci.star,
                        }) as ServerItem;
                        addItemToLibrary(this.library as LibraryType, serverItem, category);
                    }
                }

                list.calculateTotals();
                this.library.defaultListId = list.id;
            } catch {
                this._showError('An error occurred copying the list.');
            }
        },

        // ── categories ────────────────────────────────────────────────────────
        async newCategory(list: ListType) {
            if (!this.loggedIn) {
                const category = this.library.newCategory({ list, _isNew: true });
                this.library.newItem({ category });
                this.library.getListById(this.library.defaultListId).calculateTotals();
                return;
            }
            try {
                const serverCategory = await this._api('POST', '/api/categories', { list_id: list.id, name: '' }) as ServerCategory;
                const category = addCategoryToLibrary(this.library as LibraryType, serverCategory, list);
                category._isNew = true;

                const serverItem = await this._api('POST', `/api/categories/${category.id}/items`, {}) as ServerItem;
                addItemToLibrary(this.library as LibraryType, serverItem, category, true);

                this.library.getListById(this.library.defaultListId).calculateTotals();
            } catch {
                this._showError('An error occurred creating the category.');
            }
        },
        updateCategoryName(updatedCategory: { id: number; name: string }) {
            const category = this.library.getCategoryById(updatedCategory.id);
            const old = category.name;
            category.name = updatedCategory.name;
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                this._api('PATCH', `/api/categories/${updatedCategory.id}`, { name: updatedCategory.name }).catch(
                    () => {
                        category.name = old;
                        this._showError('An error occurred updating the category name.');
                    },
                );
            }
        },
        updateCategoryColor(updatedCategory: { id: number; color: unknown }) {
            const category = this.library.getCategoryById(updatedCategory.id);
            category.color = updatedCategory.color;
        },
        removeCategory(category: { id: number }) {
            this.library.removeCategory(category.id);
            if (this.loggedIn) {
                this._api('DELETE', `/api/categories/${category.id}`).catch(async () => {
                    await this._reloadLibrary();
                    this._showError('An error occurred deleting the category.');
                });
            }
        },
        reorderCategory(args: { list: { id: number }; before: number; after: number }) {
            const list = this.library.getListById(args.list.id);
            list.categoryIds = window.arrayMove(list.categoryIds, args.before, args.after);
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                const patches = list.categoryIds.map((catId: number, index: number) =>
                    this._api('PATCH', `/api/categories/${catId}`, { sort_order: index }),
                );
                Promise.all(patches).catch(async () => {
                    await this._reloadLibrary();
                    this._showError('Failed to save category order.');
                });
            }
        },

        // ── items ─────────────────────────────────────────────────────────────
        async newItem({ category, _isNew }: { category: CategoryType; _isNew?: boolean }) {
            if (!this.loggedIn) {
                this.library.newItem({ category, _isNew });
                this.library.getListById(this.library.defaultListId).calculateTotals();
                return;
            }
            try {
                const serverItem = await this._api('POST', `/api/categories/${category.id}/items`, {}) as ServerItem;
                addItemToLibrary(this.library as LibraryType, serverItem, category, _isNew);
                this.library.getListById(this.library.defaultListId).calculateTotals();
            } catch {
                this._showError('An error occurred creating the item.');
            }
        },
        updateItem(item: { id: number; name?: string; description?: string; weight?: number; authorUnit?: string; price?: number; image?: string; imageUrl?: string; url?: string }) {
            const oldItem = this.library.getItemById(item.id);
            const snapshot = { ...oldItem };
            this.library.updateItem(item);
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                const category = this.library.findCategoryWithItemById(item.id);
                if (category) {
                    this._api('PATCH', `/api/categories/${category.id}/items/${item.id}`, {
                        name: item.name,
                        description: item.description,
                        weight: item.weight,
                        author_unit: item.authorUnit,
                        price: item.price,
                        image: item.image,
                        image_url: item.imageUrl,
                        url: item.url,
                    }).catch(() => {
                        this.library.updateItem(snapshot);
                        this._showError('An error occurred updating the item.');
                    });
                }
            }
        },
        removeItem(item: { id: number }) {
            const category = this.library.findCategoryWithItemById(item.id);
            this.library.removeItem(item.id);
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn && category) {
                this._api('DELETE', `/api/categories/${category.id}/items/${item.id}`).catch(async () => {
                    await this._reloadLibrary();
                    this._showError('An error occurred deleting the item.');
                });
            }
        },
        reorderItem(args: { list: ListType; itemId: number; categoryId: number; dropIndex: number }) {
            const item = this.library.getItemById(args.itemId);
            const dropCategory = this.library.getCategoryById(args.categoryId);
            const list = this.library.getListById(args.list.id);
            const originalCategory = this.library.findCategoryWithItemById(item.id, list.id);
            const oldCategoryItem = originalCategory.getCategoryItemById(item.id);
            const oldIndex = originalCategory.categoryItems.indexOf(oldCategoryItem);
            const isCrossCategory = originalCategory !== dropCategory;

            if (!isCrossCategory) {
                dropCategory.categoryItems = window.arrayMove(dropCategory.categoryItems, oldIndex, args.dropIndex);
                this.library.getListById(this.library.defaultListId).calculateTotals();
                if (this.loggedIn) {
                    const patches = dropCategory.categoryItems.map((ci: { itemId: number }, index: number) =>
                        this._api('PATCH', `/api/categories/${dropCategory.id}/items/${ci.itemId}`, {
                            sort_order: index,
                        }),
                    );
                    Promise.all(patches).catch(async () => {
                        await this._reloadLibrary();
                        this._showError('Failed to save item order.');
                    });
                }
            } else {
                // Cross-category: splice in-memory, then DELETE + POST to persist
                originalCategory.categoryItems.splice(oldIndex, 1);
                dropCategory.categoryItems.splice(args.dropIndex, 0, oldCategoryItem);
                this.library.getListById(this.library.defaultListId).calculateTotals();
                if (this.loggedIn) {
                    const oldItemData = this.library.getItemById(item.id);
                    this._api('DELETE', `/api/categories/${originalCategory.id}/items/${item.id}`)
                        .then(() =>
                            this._api('POST', `/api/categories/${dropCategory.id}/items`, {
                                name: oldItemData.name,
                                description: oldItemData.description,
                                weight: oldItemData.weight,
                                author_unit: oldItemData.authorUnit,
                                price: oldItemData.price,
                                image: oldItemData.image,
                                image_url: oldItemData.imageUrl,
                                url: oldItemData.url,
                                qty: oldCategoryItem.qty,
                                worn: oldCategoryItem.worn,
                                consumable: oldCategoryItem.consumable,
                                star: oldCategoryItem.star,
                            }),
                        )
                        .then((serverItem) => {
                            const si = serverItem as ServerItem;
                            // Remap IDs so the in-memory item matches the new DB row
                            delete this.library.idMap[item.id];
                            delete this.library.itemsMap[item.id];
                            oldItemData.id = si.id;
                            this.library.idMap[si.id] = oldItemData;
                            this.library.itemsMap[si.id] = oldItemData;
                            if (oldCategoryItem) oldCategoryItem.itemId = si.id;
                        })
                        .catch(async () => {
                            await this._reloadLibrary();
                            this._showError('An error occurred moving the item.');
                        });
                }
            }
        },
        addItemToCategory(args: { itemId: number; categoryId: number; dropIndex: number }) {
            if (!this.loggedIn) {
                const item = this.library.getItemById(args.itemId);
                const dropCategory = this.library.getCategoryById(args.categoryId);
                if (item && dropCategory) {
                    dropCategory.addItem({ itemId: item.id });
                    const categoryItem = dropCategory.getCategoryItemById(item.id);
                    const categoryItemIndex = dropCategory.categoryItems.indexOf(categoryItem);
                    if (categoryItem && categoryItemIndex !== -1) {
                        dropCategory.categoryItems = window.arrayMove(
                            dropCategory.categoryItems,
                            categoryItemIndex,
                            args.dropIndex,
                        );
                    }
                    this.library.getListById(this.library.defaultListId).calculateTotals();
                }
                return;
            }
            const item = this.library.getItemById(args.itemId);
            const dropCategory = this.library.getCategoryById(args.categoryId);
            if (!item || !dropCategory) return;

            const originalCategory = this.library.findCategoryWithItemById(args.itemId);
            const oldCategoryItem = originalCategory ? originalCategory.getCategoryItemById(args.itemId) : null;

            this._api('POST', `/api/categories/${args.categoryId}/items`, {
                name: item.name,
                description: item.description,
                weight: item.weight,
                author_unit: item.authorUnit,
                price: item.price,
                image: item.image,
                image_url: item.imageUrl,
                url: item.url,
                qty: oldCategoryItem?.qty ?? 1,
                worn: oldCategoryItem?.worn ?? 0,
                consumable: oldCategoryItem?.consumable ?? false,
                star: oldCategoryItem?.star ?? 0,
            })
                .then((serverItem) => {
                    const si = serverItem as ServerItem;
                    addItemToLibrary(this.library as LibraryType, si, null);
                    dropCategory.addItem({ itemId: si.id });
                    const categoryItem = dropCategory.getCategoryItemById(si.id);
                    const categoryItemIndex = dropCategory.categoryItems.indexOf(categoryItem);
                    if (categoryItem && categoryItemIndex !== -1) {
                        dropCategory.categoryItems = window.arrayMove(
                            dropCategory.categoryItems,
                            categoryItemIndex,
                            args.dropIndex,
                        );
                    }
                    this.library.getListById(this.library.defaultListId).calculateTotals();
                })
                .catch(() => {
                    this._showError('An error occurred adding the item.');
                });
        },
        updateCategoryItem(args: { category: CategoryType; categoryItem: { itemId: number; qty: number; worn: number; consumable: boolean; star: number } }) {
            const old = { ...args.category.getCategoryItemById(args.categoryItem.itemId) };
            args.category.updateCategoryItem(args.categoryItem);
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                this._api('PATCH', `/api/categories/${args.category.id}/items/${args.categoryItem.itemId}`, {
                    qty: args.categoryItem.qty,
                    worn: args.categoryItem.worn,
                    consumable: args.categoryItem.consumable,
                    star: args.categoryItem.star,
                }).catch(() => {
                    args.category.updateCategoryItem(old);
                    this._showError('An error occurred updating the item.');
                });
            }
        },
        removeItemFromCategory(args: { category: CategoryType; itemId: number }) {
            args.category.removeItem(args.itemId);
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                this._api('DELETE', `/api/categories/${args.category.id}/items/${args.itemId}`).catch(async () => {
                    await this._reloadLibrary();
                    this._showError('An error occurred removing the item.');
                });
            }
        },
        updateItemLink(args: { item: { id: number }; url: string }) {
            const item = this.library.getItemById(args.item.id);
            const old = item.url;
            item.url = args.url;
            if (this.loggedIn) {
                const category = this.library.findCategoryWithItemById(args.item.id);
                if (category) {
                    this._api('PATCH', `/api/categories/${category.id}/items/${args.item.id}`, {
                        url: args.url,
                    }).catch(() => {
                        item.url = old;
                        this._showError('An error occurred saving the link.');
                    });
                }
            }
        },
        async updateItemImageUrl(args: { item: { id: number }; imageUrl: string }) {
            const item = this.library.getItemById(args.item.id);
            if (!item) return;
            this.library.optionalFields.images = true;
            if (this.loggedIn) {
                try {
                    const result = await this._api('POST', '/api/images/url', {
                        entityType: 'item',
                        entityId: item.id,
                        url: args.imageUrl,
                    }) as { id: number; url: string; sort_order?: number };
                    item.images.push({ id: result.id, url: result.url, sort_order: result.sort_order ?? 0 });
                    this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {
                        this._showError('Failed to enable images setting.');
                    });
                } catch {
                    this._showError('An error occurred saving the image URL.');
                }
            } else {
                // Offline: update legacy field so the thumbnail still shows
                item.imageUrl = args.imageUrl;
            }
        },
        async uploadImage({ file, entityType, entityId }: { file: File; entityType: string; entityId: number }) {
            const entity =
                entityType === 'item'
                    ? this.library.getItemById(entityId)
                    : entityType === 'category'
                      ? this.library.getCategoryById(entityId)
                      : this.library.getListById(entityId);

            const formData = new FormData();
            formData.append('image', file);
            formData.append('entityType', entityType);
            formData.append('entityId', String(entityId));
            formData.append('sortOrder', String(entity?.images?.length ?? 0));

            const uploadHeaders: Record<string, string> = {};
            const uploadCsrfToken = getCsrfToken();
            if (uploadCsrfToken) {
                uploadHeaders['X-CSRF-Token'] = uploadCsrfToken;
            }
            const result = await $fetch('/api/image-upload', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: uploadHeaders,
            }) as { id: number; url: string };

            const image = { id: result.id, url: result.url, sort_order: entity?.images?.length ?? 0 };
            if (entity) entity.images.push(image);

            this.library.optionalFields.images = true;
            this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {
                this._showError('Failed to enable images setting.');
            });
            return image;
        },
        async deleteImage({ id, entityType, entityId }: { id: number; entityType: string; entityId: number }) {
            await this._api('DELETE', `/api/images/${id}`);
            let entity;
            if (entityType === 'item') entity = this.library.getItemById(entityId);
            else if (entityType === 'category') entity = this.library.getCategoryById(entityId);
            else if (entityType === 'list') entity = this.library.getListById(entityId);
            if (entity) {
                const idx = entity.images.findIndex((img: { id: number }) => img.id === id);
                if (idx !== -1) entity.images.splice(idx, 1);
            }
        },
        async reorderImages({ entityType, entityId, images }: { entityType: string; entityId: number; images: Array<{ id: number; [key: string]: unknown }> }) {
            const payload = images.map((img, index) => ({ id: img.id, sort_order: index }));
            await this._api('POST', '/api/images/reorder', payload);
            let entity;
            if (entityType === 'item') entity = this.library.getItemById(entityId);
            else if (entityType === 'category') entity = this.library.getCategoryById(entityId);
            else if (entityType === 'list') entity = this.library.getListById(entityId);
            if (entity) {
                entity.images = images.map((img, index) => ({ ...img, sort_order: index }));
            }
        },
        async addImageUrl({ entityType, entityId, url }: { entityType: string; entityId: number; url: string }) {
            const entity =
                entityType === 'item'
                    ? this.library.getItemById(entityId)
                    : entityType === 'category'
                      ? this.library.getCategoryById(entityId)
                      : this.library.getListById(entityId);
            if (!entity) return;
            const result = await this._api('POST', '/api/images/url', { entityType, entityId, url }) as { id: number; url: string; sort_order?: number };
            entity.images.push({ id: result.id, url: result.url, sort_order: result.sort_order ?? 0 });
            this.library.optionalFields.images = true;
            this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {
                this._showError('Failed to enable images setting.');
            });
        },

        // ── CSV import ────────────────────────────────────────────────────────
        async importCSV(importData: { name: string; data: Array<Record<string, any>> }) {
            if (!this.loggedIn) {
                const list = this.library.newList({});
                let category: CategoryType;
                const newCategories: Record<string, CategoryType> = {};
                list.name = importData.name;
                for (const i in importData.data) {
                    const row = importData.data[i];
                    if (newCategories[row.category]) {
                        category = newCategories[row.category];
                    } else {
                        category = this.library.newCategory({ list });
                        newCategories[row.category] = category;
                    }
                    const item = this.library.newItem({ category, _isNew: false });
                    const categoryItem = category.getCategoryItemById(item.id);
                    item.name = row.name;
                    item.description = row.description;
                    categoryItem.qty = parseFloat(row.qty);
                    item.weight = WeightToMg(parseFloat(row.weight), row.unit);
                    item.authorUnit = row.unit;
                    item.url = row.url || '';
                    item.price = row.price || 0;
                    categoryItem.worn = row.worn || 0;
                    categoryItem.consumable = row.consumable || false;
                    category.name = row.category;
                }
                list.calculateTotals();
                this.library.defaultListId = list.id;
                return;
            }
            try {
                const serverList = await this._api('POST', '/api/lists', { name: importData.name }) as ServerList;
                const list = addListToLibrary(this.library as LibraryType, serverList);
                const newCategories: Record<string, CategoryType> = {};

                for (const row of importData.data) {
                    let category = newCategories[row.category];
                    if (!category) {
                        const serverCategory = await this._api('POST', '/api/categories', {
                            list_id: list.id,
                            name: row.category,
                        }) as ServerCategory;
                        category = addCategoryToLibrary(this.library as LibraryType, serverCategory, list);
                        newCategories[row.category] = category;
                    }

                    const weight = WeightToMg(parseFloat(row.weight), row.unit);
                    const serverItem = await this._api('POST', `/api/categories/${category.id}/items`, {
                        name: row.name,
                        description: row.description,
                        weight,
                        author_unit: row.unit,
                        qty: parseFloat(row.qty),
                        url: row.url || '',
                        price: row.price || 0,
                        worn: row.worn || 0,
                        consumable: row.consumable || false,
                    }) as ServerItem;
                    addItemToLibrary(this.library as LibraryType, serverItem, category);
                }

                list.calculateTotals();
                this.library.defaultListId = list.id;
            } catch {
                this._showError('An error occurred importing the CSV.');
            }
        },

        // ── modal / UI ────────────────────────────────────────────────────────
        showModal(name: string) {
            this.activeModal = name;
        },
        closeModal() {
            this.activeModal = null;
        },
        initSpeedbump(callback: (confirmed: boolean) => void, options?: unknown) {
            this.speedbump = { callback, options };
        },
        confirmSpeedbump() {
            if (this.speedbump && typeof this.speedbump.callback === 'function') {
                this.speedbump.callback(true);
            }
            this.speedbump = null;
        },
        closeSpeedbump() {
            this.speedbump = null;
        },
        triggerImportCSV() {
            this.importCSVTrigger += 1;
        },
        openItemLinkDialog(item: unknown) {
            this.activeItemDialog = { type: 'link', item, imageUrl: null };
        },
        openItemImageDialog(item: unknown) {
            this.activeItemDialog = { type: 'image', entityType: 'item', entity: item };
        },
        openCategoryImageDialog(category: unknown) {
            this.activeItemDialog = { type: 'image', entityType: 'category', entity: category };
        },
        openListImageDialog(list: unknown) {
            this.activeItemDialog = { type: 'image', entityType: 'list', entity: list };
        },
        openViewImageDialog(imageUrl: string) {
            this.activeItemDialog = { type: 'viewImage', item: null, imageUrl, images: null };
        },
        openViewImagesDialog(images: unknown[], startIndex = 0) {
            this.activeItemDialog = { type: 'viewImage', item: null, imageUrl: null, images, startIndex };
        },
        closeItemDialog() {
            this.activeItemDialog = null;
        },
        addDirectiveInstance({ key, value }: { key: string; value: EventListener }) {
            this.directiveInstances[key] = value;
        },
        removeDirectiveInstance(key: string) {
            delete this.directiveInstances[key];
        },

        // ── init ──────────────────────────────────────────────────────────────
        init() {
            if (localStorage.library) {
                return this.loadLocal();
            }
            return $fetch('/api/library', { credentials: 'include' })
                .then((data) => {
                    const d = data as { username?: string; library?: unknown };
                    if (d && d.username) {
                        this.setLoggedIn(d.username);
                        this.loadLibraryData(d.library);
                    }
                })
                .catch(() => {
                    // Network error or 401 — app will show the welcome page
                });
        },
        loadLocal() {
            const libraryData = localStorage.library;
            this.loadLibraryData(libraryData);
            this.setLoggedIn(false);
        },
        loadRemote() {
            return $fetch('/api/library', { credentials: 'include' })
                .then((data) => {
                    const d = data as { library: unknown; username: string };
                    this.loadLibraryData(d.library);
                    this.setLoggedIn(d.username);
                })
                .catch((err) => {
                    if (err.status === 401) {
                        navigateTo('/welcome');
                        return undefined;
                    }
                    return Promise.reject('An error occurred while fetching your data, please try again later.');
                });
        },
    },
});
