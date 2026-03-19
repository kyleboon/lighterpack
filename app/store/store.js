import { defineStore } from 'pinia';
import weightUtils from '#shared/utils/weight.js';
import dataTypes from '#shared/dataTypes.js';

const { Library, List, Category, Item } = dataTypes;

// ─── helpers ──────────────────────────────────────────────────────────────────

function addItemToLibrary(library, serverItem, category, _isNew) {
    const item = new Item({ id: serverItem.id, unit: serverItem.author_unit || library.itemUnit });
    item.name = serverItem.name ?? '';
    item.description = serverItem.description ?? '';
    item.weight = serverItem.weight ?? 0;
    item.authorUnit = serverItem.author_unit ?? library.itemUnit;
    item.price = serverItem.price ?? 0;
    item.image = serverItem.image ?? '';
    item.imageUrl = serverItem.image_url ?? '';
    item.url = serverItem.url ?? '';
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

function addCategoryToLibrary(library, serverCategory, list) {
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

function addListToLibrary(library, serverList) {
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
        library: false,
        loggedIn: false,
        directiveInstances: {},
        globalAlerts: [],
        activeModal: null,
        speedbump: null,
        importCSVTrigger: 0,
        activeItemDialog: null,
    }),

    getters: {
        activeList(state) {
            return state.library ? state.library.getListById(state.library.defaultListId) : null;
        },
    },

    actions: {
        // ── session ──────────────────────────────────────────────────────────
        signout() {
            fetch('/api/auth/sign-out', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
            this.library = false;
            this.loggedIn = false;
        },
        setLoggedIn(loggedIn) {
            this.loggedIn = loggedIn;
        },
        loadLibraryData(libraryData) {
            const library = new Library();
            try {
                const parsed = typeof libraryData === 'string' ? JSON.parse(libraryData) : libraryData;
                library.load(parsed);
                this.library = library;
            } catch (_err) {
                this.globalAlerts.push({ message: 'An error occurred while loading your data.' });
            }
        },
        clearLibraryData() {
            this.library = false;
        },

        // ── API helpers ──────────────────────────────────────────────────────
        async _api(method, url, body) {
            return $fetch(url, {
                method,
                body: body !== undefined ? body : undefined,
                credentials: 'include',
            });
        },
        async _reloadLibrary() {
            try {
                const data = await this._api('GET', '/api/library');
                this.loadLibraryData(data.library);
            } catch {
                this.globalAlerts.push({ message: 'An error occurred reloading your data.' });
            }
        },
        _showError(message) {
            this.globalAlerts.push({ message: message || 'An error occurred.' });
        },

        // ── library settings ─────────────────────────────────────────────────
        toggleSidebar() {
            this.library.showSidebar = !this.library.showSidebar;
            if (this.loggedIn) {
                this._api('PATCH', '/api/library', { show_sidebar: this.library.showSidebar ? 1 : 0 }).catch(() => {});
            }
        },
        setDefaultList(list) {
            this.library.defaultListId = list.id;
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                this._api('PATCH', '/api/library', { default_list_id: list.id }).catch(() => {});
            }
        },
        setTotalUnit(unit) {
            this.library.totalUnit = unit;
            if (this.loggedIn) {
                this._api('PATCH', '/api/library', { total_unit: unit }).catch(() => {});
            }
        },
        toggleOptionalField(optionalField) {
            this.library.optionalFields[optionalField] = !this.library.optionalFields[optionalField];
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                const keyMap = {
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
                    }).catch(() => {});
                }
            }
        },
        updateCurrencySymbol(currencySymbol) {
            this.library.currencySymbol = currencySymbol;
            if (this.loggedIn) {
                this._api('PATCH', '/api/library', { currency_symbol: currencySymbol }).catch(() => {});
            }
        },
        updateItemUnit(unit) {
            this.library.itemUnit = unit;
            if (this.loggedIn) {
                this._api('PATCH', '/api/library', { item_unit: unit }).catch(() => {});
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
                const serverList = await this._api('POST', '/api/lists', { name: '', description: '' });
                const list = addListToLibrary(this.library, serverList);

                const serverCategory = await this._api('POST', '/api/categories', { list_id: list.id, name: '' });
                const category = addCategoryToLibrary(this.library, serverCategory, list);

                const serverItem = await this._api('POST', `/api/categories/${category.id}/items`, {});
                addItemToLibrary(this.library, serverItem, category);

                list.calculateTotals();
                this.library.defaultListId = list.id;
            } catch {
                this._showError('An error occurred creating the list.');
            }
        },
        updateListName(updatedList) {
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
        updateListDescription(updatedList) {
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
        setExternalId(args) {
            const list = this.library.getListById(args.list.id);
            list.externalId = args.externalId;
        },
        removeList(list) {
            if (this.library.lists.length === 1) return;
            this.library.removeList(list.id);
            if (this.loggedIn) {
                this._api('DELETE', `/api/lists/${list.id}`).catch(async () => {
                    await this._reloadLibrary();
                    this._showError('An error occurred deleting the list.');
                });
            }
        },
        reorderList(args) {
            this.library.lists = arrayMove(this.library.lists, args.before, args.after);
            if (this.loggedIn) {
                this.library.lists.forEach((list, index) => {
                    this._api('PATCH', `/api/lists/${list.id}`, { sort_order: index }).catch(() => {});
                });
            }
        },
        async copyList(listId) {
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
                });
                const list = addListToLibrary(this.library, serverList);

                for (const categoryId of oldList.categoryIds) {
                    const oldCategory = this.library.getCategoryById(categoryId);
                    const serverCategory = await this._api('POST', '/api/categories', {
                        list_id: list.id,
                        name: oldCategory.name,
                    });
                    const category = addCategoryToLibrary(this.library, serverCategory, list);

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
                        });
                        addItemToLibrary(this.library, serverItem, category);
                    }
                }

                list.calculateTotals();
                this.library.defaultListId = list.id;
            } catch {
                this._showError('An error occurred copying the list.');
            }
        },

        // ── categories ────────────────────────────────────────────────────────
        async newCategory(list) {
            if (!this.loggedIn) {
                const category = this.library.newCategory({ list, _isNew: true });
                this.library.newItem({ category });
                this.library.getListById(this.library.defaultListId).calculateTotals();
                return;
            }
            try {
                const serverCategory = await this._api('POST', '/api/categories', { list_id: list.id, name: '' });
                const category = addCategoryToLibrary(this.library, serverCategory, list);
                category._isNew = true;

                const serverItem = await this._api('POST', `/api/categories/${category.id}/items`, {});
                addItemToLibrary(this.library, serverItem, category, true);

                this.library.getListById(this.library.defaultListId).calculateTotals();
            } catch {
                this._showError('An error occurred creating the category.');
            }
        },
        updateCategoryName(updatedCategory) {
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
        updateCategoryColor(updatedCategory) {
            const category = this.library.getCategoryById(updatedCategory.id);
            category.color = updatedCategory.color;
        },
        removeCategory(category) {
            this.library.removeCategory(category.id);
            if (this.loggedIn) {
                this._api('DELETE', `/api/categories/${category.id}`).catch(async () => {
                    await this._reloadLibrary();
                    this._showError('An error occurred deleting the category.');
                });
            }
        },
        reorderCategory(args) {
            const list = this.library.getListById(args.list.id);
            list.categoryIds = arrayMove(list.categoryIds, args.before, args.after);
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                list.categoryIds.forEach((catId, index) => {
                    this._api('PATCH', `/api/categories/${catId}`, { sort_order: index }).catch(() => {});
                });
            }
        },

        // ── items ─────────────────────────────────────────────────────────────
        async newItem({ category, _isNew }) {
            if (!this.loggedIn) {
                this.library.newItem({ category, _isNew });
                this.library.getListById(this.library.defaultListId).calculateTotals();
                return;
            }
            try {
                const serverItem = await this._api('POST', `/api/categories/${category.id}/items`, {});
                addItemToLibrary(this.library, serverItem, category, _isNew);
                this.library.getListById(this.library.defaultListId).calculateTotals();
            } catch {
                this._showError('An error occurred creating the item.');
            }
        },
        updateItem(item) {
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
        removeItem(item) {
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
        reorderItem(args) {
            const item = this.library.getItemById(args.itemId);
            const dropCategory = this.library.getCategoryById(args.categoryId);
            const list = this.library.getListById(args.list.id);
            const originalCategory = this.library.findCategoryWithItemById(item.id, list.id);
            const oldCategoryItem = originalCategory.getCategoryItemById(item.id);
            const oldIndex = originalCategory.categoryItems.indexOf(oldCategoryItem);
            const isCrossCategory = originalCategory !== dropCategory;

            if (!isCrossCategory) {
                dropCategory.categoryItems = arrayMove(dropCategory.categoryItems, oldIndex, args.dropIndex);
                this.library.getListById(this.library.defaultListId).calculateTotals();
                if (this.loggedIn) {
                    dropCategory.categoryItems.forEach((ci, index) => {
                        this._api('PATCH', `/api/categories/${dropCategory.id}/items/${ci.itemId}`, {
                            sort_order: index,
                        }).catch(() => {});
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
                            // Remap IDs so the in-memory item matches the new DB row
                            delete this.library.idMap[item.id];
                            delete this.library.itemsMap[item.id];
                            oldItemData.id = serverItem.id;
                            this.library.idMap[serverItem.id] = oldItemData;
                            this.library.itemsMap[serverItem.id] = oldItemData;
                            if (oldCategoryItem) oldCategoryItem.itemId = serverItem.id;
                        })
                        .catch(async () => {
                            await this._reloadLibrary();
                            this._showError('An error occurred moving the item.');
                        });
                }
            }
        },
        addItemToCategory(args) {
            if (!this.loggedIn) {
                const item = this.library.getItemById(args.itemId);
                const dropCategory = this.library.getCategoryById(args.categoryId);
                if (item && dropCategory) {
                    dropCategory.addItem({ itemId: item.id });
                    const categoryItem = dropCategory.getCategoryItemById(item.id);
                    const categoryItemIndex = dropCategory.categoryItems.indexOf(categoryItem);
                    if (categoryItem && categoryItemIndex !== -1) {
                        dropCategory.categoryItems = arrayMove(
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
                    addItemToLibrary(this.library, serverItem, null);
                    dropCategory.addItem({ itemId: serverItem.id });
                    const categoryItem = dropCategory.getCategoryItemById(serverItem.id);
                    const categoryItemIndex = dropCategory.categoryItems.indexOf(categoryItem);
                    if (categoryItem && categoryItemIndex !== -1) {
                        dropCategory.categoryItems = arrayMove(
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
        updateCategoryItem(args) {
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
        removeItemFromCategory(args) {
            args.category.removeItem(args.itemId);
            this.library.getListById(this.library.defaultListId).calculateTotals();
            if (this.loggedIn) {
                this._api('DELETE', `/api/categories/${args.category.id}/items/${args.itemId}`).catch(async () => {
                    await this._reloadLibrary();
                    this._showError('An error occurred removing the item.');
                });
            }
        },
        updateItemLink(args) {
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
        updateItemImageUrl(args) {
            const item = this.library.getItemById(args.item.id);
            const old = item.imageUrl;
            item.imageUrl = args.imageUrl;
            this.library.optionalFields.images = true;
            if (this.loggedIn) {
                const category = this.library.findCategoryWithItemById(args.item.id);
                if (category) {
                    this._api('PATCH', `/api/categories/${category.id}/items/${args.item.id}`, {
                        image_url: args.imageUrl,
                    }).catch(() => {
                        item.imageUrl = old;
                        this._showError('An error occurred saving the image URL.');
                    });
                    this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {});
                }
            }
        },
        updateItemImage(args) {
            const item = this.library.getItemById(args.item.id);
            const old = item.image;
            item.image = args.image;
            this.library.optionalFields.images = true;
            if (this.loggedIn) {
                const category = this.library.findCategoryWithItemById(args.item.id);
                if (category) {
                    this._api('PATCH', `/api/categories/${category.id}/items/${args.item.id}`, {
                        image: args.image,
                    }).catch(() => {
                        item.image = old;
                        this._showError('An error occurred saving the image.');
                    });
                    this._api('PATCH', '/api/library', { opt_images: 1 }).catch(() => {});
                }
            }
        },
        removeItemImage(updateItem) {
            const item = this.library.getItemById(updateItem.id);
            const old = item.image;
            item.image = '';
            if (this.loggedIn) {
                const category = this.library.findCategoryWithItemById(updateItem.id);
                if (category) {
                    this._api('PATCH', `/api/categories/${category.id}/items/${updateItem.id}`, {
                        image: '',
                    }).catch(() => {
                        item.image = old;
                    });
                }
            }
        },

        // ── CSV import ────────────────────────────────────────────────────────
        async importCSV(importData) {
            if (!this.loggedIn) {
                const list = this.library.newList({});
                let category;
                const newCategories = {};
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
                    item.weight = weightUtils.WeightToMg(parseFloat(row.weight), row.unit);
                    item.authorUnit = row.unit;
                    category.name = row.category;
                }
                list.calculateTotals();
                this.library.defaultListId = list.id;
                return;
            }
            try {
                const serverList = await this._api('POST', '/api/lists', { name: importData.name });
                const list = addListToLibrary(this.library, serverList);
                const newCategories = {};

                for (const row of importData.data) {
                    let category = newCategories[row.category];
                    if (!category) {
                        const serverCategory = await this._api('POST', '/api/categories', {
                            list_id: list.id,
                            name: row.category,
                        });
                        category = addCategoryToLibrary(this.library, serverCategory, list);
                        newCategories[row.category] = category;
                    }

                    const weight = weightUtils.WeightToMg(parseFloat(row.weight), row.unit);
                    const serverItem = await this._api('POST', `/api/categories/${category.id}/items`, {
                        name: row.name,
                        description: row.description,
                        weight,
                        author_unit: row.unit,
                        qty: parseFloat(row.qty),
                    });
                    addItemToLibrary(this.library, serverItem, category);
                }

                list.calculateTotals();
                this.library.defaultListId = list.id;
            } catch {
                this._showError('An error occurred importing the CSV.');
            }
        },

        // ── modal / UI ────────────────────────────────────────────────────────
        showModal(name) {
            this.activeModal = name;
        },
        closeModal() {
            this.activeModal = null;
        },
        initSpeedbump(callback, options) {
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
        openItemLinkDialog(item) {
            this.activeItemDialog = { type: 'link', item, imageUrl: null };
        },
        openItemImageDialog(item) {
            this.activeItemDialog = { type: 'image', item, imageUrl: null };
        },
        openViewImageDialog(imageUrl) {
            this.activeItemDialog = { type: 'viewImage', item: null, imageUrl };
        },
        closeItemDialog() {
            this.activeItemDialog = null;
        },
        addDirectiveInstance({ key, value }) {
            this.directiveInstances[key] = value;
        },
        removeDirectiveInstance(key) {
            delete this.directiveInstances[key];
        },

        // ── init ──────────────────────────────────────────────────────────────
        init() {
            if (localStorage.library) {
                return this.loadLocal();
            }
            return $fetch('/api/library', { credentials: 'include' })
                .then((data) => {
                    if (data && data.username) {
                        this.setLoggedIn(data.username);
                        this.loadLibraryData(data.library);
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
                    this.loadLibraryData(data.library);
                    this.setLoggedIn(data.username);
                })
                .catch((err) => {
                    if (err.status === 401) {
                        navigateTo('/signin');
                        return undefined;
                    }
                    return Promise.reject('An error occurred while fetching your data, please try again later.');
                });
        },
    },
});
