// @ts-check
import Sortable from 'sortablejs';
import { useLighterpackStore } from '../store/store.js';

/**
 * Revert the DOM change SortableJS made before dispatching the store action.
 * Vue owns the DOM after the store update; we must undo SortableJS's mutation first.
 *
 * @param {HTMLElement} item
 * @param {HTMLElement} container
 * @param {number} oldIndex - full DOM index before drag
 * @param {number} newIndex - full DOM index after drop
 */
function revertDOM(item, container, oldIndex, newIndex) {
    if (newIndex < oldIndex) {
        container.insertBefore(item, container.children[oldIndex + 1] ?? null);
    } else {
        container.insertBefore(item, container.children[oldIndex] ?? null);
    }
}

/**
 * Creates and manages Sortable instances on all .lpItems containers.
 * Handles both intra-category item reorder (onEnd) and cross-container drops
 * from other categories or the library sidebar (onAdd).
 *
 * Called by list.vue (which owns the .lpItems lifecycle) and shared with
 * library-items.vue via the group name 'items'.
 */
export function useItemDrag() {
    const store = useLighterpackStore();
    /** @type {Sortable[]} */
    let sortables = [];

    /**
     * @param {{ value: object }} list - reactive ref to the active list
     */
    function setup(list) {
        destroy();
        const containers = /** @type {HTMLElement[]} */ (Array.from(document.getElementsByClassName('lpItems')));
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
                onEnd(evt) {
                    if (evt.from !== evt.to) return; // cross-container handled by onAdd on target
                    const oldIdx = evt.oldIndex ?? 0;
                    const newIdx = evt.newIndex ?? 0;
                    revertDOM(evt.item, evt.from, oldIdx, newIdx);
                    store.reorderItem({
                        list: list.value,
                        itemId: parseInt(evt.item.id),
                        categoryId: parseInt(/** @type {HTMLElement} */ (evt.to.parentElement).id),
                        dropIndex: evt.newDraggableIndex ?? newIdx,
                    });
                },
                onAdd(evt) {
                    const { item, to, newDraggableIndex, newIndex } = evt;
                    const categoryId = parseInt(/** @type {HTMLElement} */ (to.parentElement).id);
                    const dropIndex = newDraggableIndex ?? newIndex ?? 0;
                    // Remove the element SortableJS placed in the DOM — Vue re-renders from Pinia state
                    /** @type {HTMLElement} */ (item.parentNode).removeChild(item);
                    if (item.dataset.itemId) {
                        // Clone dropped from gear library
                        store.addItemToCategory({
                            itemId: parseInt(item.dataset.itemId),
                            categoryId,
                            dropIndex,
                        });
                    } else {
                        // Item moved from another category
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

    function destroy() {
        sortables.forEach((s) => s.destroy());
        sortables = [];
    }

    return { setup, destroy };
}
