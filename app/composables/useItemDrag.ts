import Sortable from 'sortablejs';
import type { Ref } from 'vue';
import type { IList } from '#shared/types';
import { useLighterpackStore } from '../store/store';

/**
 * Revert the DOM change SortableJS made before dispatching the store action.
 * Vue owns the DOM after the store update; we must undo SortableJS's mutation first.
 */
function revertDOM(item: HTMLElement, container: HTMLElement, oldIndex: number, newIndex: number): void {
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
export function useItemDrag(): { setup: (list: Ref<IList>) => void; destroy: () => void } {
    const store = useLighterpackStore();
    let sortables: Sortable[] = [];

    function setup(list: Ref<IList>) {
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
                onEnd(evt: Sortable.SortableEvent) {
                    if (evt.from !== evt.to) return; // cross-container handled by onAdd on target
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
                onAdd(evt: Sortable.SortableEvent) {
                    const { item, to, newDraggableIndex, newIndex } = evt;
                    const categoryId = parseInt((to.parentElement as HTMLElement).id);
                    const dropIndex = newDraggableIndex ?? newIndex ?? 0;
                    // Remove the element SortableJS placed in the DOM — Vue re-renders from Pinia state
                    (item.parentNode as HTMLElement).removeChild(item);
                    if ((item as HTMLElement).dataset.itemId) {
                        // Clone dropped from gear library
                        store.addItemToCategory({
                            itemId: parseInt((item as HTMLElement).dataset.itemId!),
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
