import { defineStore } from 'pinia';
import debounce from 'lodash/debounce';
import weightUtils from '../utils/weight.js';
import dataTypes from '../dataTypes.js';

const Item = dataTypes.Item;
const Category = dataTypes.Category;
const List = dataTypes.List;
const Library = dataTypes.Library;

const saveInterval = 10000;

export const useLighterpackStore = defineStore('lighterpack', {
    state: () => ({
        library: false,
        isSaving: false,
        syncToken: false,
        saveType: null,
        lastSaveData: null,
        loggedIn: false,
        directiveInstances: {},
        globalAlerts: [],
    }),

    getters: {
        activeList(state) {
            return state.library ? state.library.getListById(state.library.defaultListId) : null;
        },
    },

    actions: {
        setSaveType(saveType) {
            this.saveType = saveType;
        },
        setSyncToken(syncToken) {
            this.syncToken = syncToken;
        },
        setLastSaveData(lastSaveData) {
            this.lastSaveData = lastSaveData;
        },
        setIsSaving(isSaving) {
            this.isSaving = isSaving;
        },
        signout() {
            createCookie('lp', '', -1);
            this.library = false;
            this.loggedIn = false;
        },
        setLoggedIn(loggedIn) {
            this.loggedIn = loggedIn;
        },
        loadLibraryData(libraryData) {
            const library = new Library();
            try {
                const parsed = JSON.parse(libraryData);
                library.load(parsed);
                this.library = library;
            } catch (err) {
                this.globalAlerts.push({ message: 'An error occurred while loading your data.' });
            }
            this.lastSaveData = JSON.stringify(library.save());
        },
        clearLibraryData() {
            this.library = false;
        },
        toggleSidebar() {
            this.library.showSidebar = !this.library.showSidebar;
        },
        setDefaultList(list) {
            this.library.defaultListId = list.id;
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        setTotalUnit(unit) {
            this.library.totalUnit = unit;
        },
        toggleOptionalField(optionalField) {
            this.library.optionalFields[optionalField] = !this.library.optionalFields[optionalField];
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        updateCurrencySymbol(currencySymbol) {
            this.library.currencySymbol = currencySymbol;
        },
        newItem({ category, _isNew }) {
            this.library.newItem({ category, _isNew });
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        newCategory(list) {
            const category = this.library.newCategory({ list, _isNew: true });
            const item = this.library.newItem({ category });
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        newList() {
            const list = this.library.newList();
            const category = this.library.newCategory({ list });
            const item = this.library.newItem({ category });
            list.calculateTotals();
            this.library.defaultListId = list.id;
        },
        removeItem(item) {
            this.library.removeItem(item.id);
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        removeCategory(category) {
            this.library.removeCategory(category.id);
        },
        removeList(list) {
            this.library.removeList(list.id);
        },
        reorderList(args) {
            this.library.lists = arrayMove(this.library.lists, args.before, args.after);
        },
        reorderCategory(args) {
            const list = this.library.getListById(args.list.id);
            list.categoryIds = arrayMove(list.categoryIds, args.before, args.after);
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        reorderItem(args) {
            const item = this.library.getItemById(args.itemId);
            const dropCategory = this.library.getCategoryById(args.categoryId);
            const list = this.library.getListById(args.list.id);
            const originalCategory = this.library.findCategoryWithItemById(item.id, list.id);
            const oldCategoryItem = originalCategory.getCategoryItemById(item.id);
            const oldIndex = originalCategory.categoryItems.indexOf(oldCategoryItem);

            if (originalCategory === dropCategory) {
                dropCategory.categoryItems = arrayMove(dropCategory.categoryItems, oldIndex, args.dropIndex);
            } else {
                originalCategory.categoryItems.splice(oldIndex, 1);
                dropCategory.categoryItems.splice(args.dropIndex, 0, oldCategoryItem);
            }
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        addItemToCategory(args) {
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
        },
        updateListName(updatedList) {
            const list = this.library.getListById(updatedList.id);
            list.name = updatedList.name;
        },
        updateListDescription(updatedList) {
            const list = this.library.getListById(updatedList.id);
            list.description = updatedList.description;
        },
        setExternalId(args) {
            const list = this.library.getListById(args.list.id);
            list.externalId = args.externalId;
        },
        updateCategoryName(updatedCategory) {
            const category = this.library.getCategoryById(updatedCategory.id);
            category.name = updatedCategory.name;
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        updateCategoryColor(updatedCategory) {
            const category = this.library.getCategoryById(updatedCategory.id);
            category.color = updatedCategory.color;
        },
        updateItem(item) {
            this.library.updateItem(item);
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        updateItemLink(args) {
            const item = this.library.getItemById(args.item.id);
            item.url = args.url;
        },
        updateItemImageUrl(args) {
            const item = this.library.getItemById(args.item.id);
            item.imageUrl = args.imageUrl;
            this.library.optionalFields.images = true;
            bus.$emit('optionalFieldChanged');
        },
        updateItemImage(args) {
            const item = this.library.getItemById(args.item.id);
            item.image = args.image;
            this.library.optionalFields.images = true;
            bus.$emit('optionalFieldChanged');
        },
        updateItemUnit(unit) {
            this.library.itemUnit = unit;
        },
        removeItemImage(updateItem) {
            const item = this.library.getItemById(updateItem.id);
            item.image = '';
        },
        updateCategoryItem(args) {
            args.category.updateCategoryItem(args.categoryItem);
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        removeItemFromCategory(args) {
            args.category.removeItem(args.itemId);
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        copyList(listId) {
            const copiedList = this.library.copyList(listId);
            this.library.defaultListId = copiedList.id;
        },
        importCSV(importData) {
            const list = this.library.newList({});
            let category;
            const newCategories = {};
            let item;
            let categoryItem;
            let row;
            let i;

            list.name = importData.name;

            for (i in importData.data) {
                row = importData.data[i];
                if (newCategories[row.category]) {
                    category = newCategories[row.category];
                } else {
                    category = this.library.newCategory({ list });
                    newCategories[row.category] = category;
                }

                item = this.library.newItem({ category, _isNew: false });
                categoryItem = category.getCategoryItemById(item.id);

                item.name = row.name;
                item.description = row.description;
                categoryItem.qty = parseFloat(row.qty);
                item.weight = weightUtils.WeightToMg(parseFloat(row.weight), row.unit);
                item.authorUnit = row.unit;
                category.name = row.category;
            }
            list.calculateTotals();
            this.library.defaultListId = list.id;
        },
        addDirectiveInstance({ key, value }) {
            this.directiveInstances[key] = value;
        },
        removeDirectiveInstance(key) {
            delete this.directiveInstances[key];
        },

        // Async actions
        init() {
            if (readCookie('lp')) {
                return this.loadRemote();
            } else if (localStorage.library) {
                return this.loadLocal();
            }
            return new Promise((resolve) => {
                this.setLoggedIn(false);
                this.clearLibraryData();
                resolve();
            });
        },
        loadLocal() {
            const libraryData = localStorage.library;
            this.loadLibraryData(libraryData);
            this.setSaveType('local');
            this.setLoggedIn(false);
        },
        loadRemote() {
            return fetchJson('/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
            })
                .then((response) => {
                    this.setSyncToken(response.syncToken);
                    this.loadLibraryData(response.library);
                    this.setSaveType('remote');
                    this.setLoggedIn(response.username);
                })
                .catch((response) => {
                    if (response.status == 401) {
                        bus.$emit('unauthorized');
                        return undefined;
                    }
                    return new Promise((resolve, reject) => {
                        reject('An error occurred while fetching your data, please try again later.');
                    });
                });
        },
    },
});

// Auto-save plugin — watches state changes and saves debounced
export function setupAutoSave(store) {
    const debouncedSave = debounce(
        (state) => {
            if (!state.library) return;

            const saveData = JSON.stringify(state.library.save());

            if (saveData === state.lastSaveData) return;

            const saveRemotely = function () {
                if (state.isSaving) {
                    setTimeout(() => store.setIsSaving(false), saveInterval + 1);
                    return;
                }

                const currentSaveData = JSON.stringify(state.library.save());
                store.setIsSaving(true);
                store.setLastSaveData(currentSaveData);

                fetchJson('/saveLibrary/', {
                    method: 'POST',
                    body: JSON.stringify({
                        syncToken: state.syncToken,
                        username: state.loggedIn,
                        data: currentSaveData,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin',
                })
                    .then((response) => {
                        store.setSyncToken(response.syncToken);
                        store.setIsSaving(false);
                    })
                    .catch((response) => {
                        store.setIsSaving(false);
                        let error = 'An error occurred while attempting to save your data.';
                        if (response.json && response.json.status) {
                            error = response.json.status;
                        }
                        if (response.status == 401) {
                            bus.$emit('unauthorized', error);
                        } else {
                            alert(error); // TODO
                        }
                    });
            };

            if (state.saveType === 'remote') {
                saveRemotely();
            } else if (state.saveType === 'local') {
                localStorage.library = saveData;
            }
        },
        saveInterval,
        { maxWait: saveInterval * 3 },
    );

    store.$subscribe((mutation, state) => {
        const ignore = [
            'setIsSaving',
            'setSaveType',
            'setSyncToken',
            'setLastSaveData',
            'signout',
            'setLoggedIn',
            'loadLibraryData',
            'clearLibraryData',
        ];
        if (!state.library || ignore.indexOf(mutation.type.replace('lighterpack/', '')) > -1) {
            return;
        }
        debouncedSave(state);
    });
}
