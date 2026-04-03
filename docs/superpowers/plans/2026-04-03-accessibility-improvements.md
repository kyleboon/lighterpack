# Accessibility Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring LighterPack to WCAG 2.1 Level AA compliance by adding semantic landmarks, ARIA attributes, focus management, image alt text, form labels, and keyboard reorder controls.

**Architecture:** Five sequential layers: (1) CSS utilities and semantic structure, (2) ARIA attributes across components, (3) focus trap composable integrated into modals/popovers, (4) image alt text and form labels, (5) keyboard reorder buttons with live announcements. Each layer builds on the previous.

**Tech Stack:** Vue 3.5, Vitest, @vue/test-utils, native DOM APIs (no new dependencies)

---

## File Structure

### Files to Create

| File                                         | Responsibility                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `app/composables/useFocusTrap.ts`            | Focus trapping composable — traps Tab/Shift+Tab inside a container, saves/restores previous focus |
| `app/composables/useAnnounce.ts`             | Live region announcement composable — sets text on a shared `aria-live="polite"` region           |
| `test/unit/composables/useFocusTrap.spec.ts` | Unit tests for focus trap                                                                         |
| `test/unit/composables/useAnnounce.spec.ts`  | Unit tests for announce composable                                                                |

### Files to Modify

| File                                   | Changes                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `app/assets/css/_common.css`           | Add `.visually-hidden` and `.skip-link` CSS classes                                                              |
| `app/pages/index.vue`                  | Add `<main id="main-content">` landmark, skip link, live announce region                                         |
| `app/components/modal.vue`             | Add `role="dialog"`, `aria-modal`, `aria-labelledby`, integrate `useFocusTrap`                                   |
| `app/components/popover.vue`           | Add `aria-modal`, `aria-labelledby`, `aria-expanded`/`aria-controls` support, integrate `useFocusTrap`           |
| `app/components/item.vue`              | Add `alt` on images, `aria-label` on icon buttons, change qty `<span>` to `<button>`, add visually-hidden labels |
| `app/components/item-image.vue`        | Add `alt` on gallery thumbs, `aria-label` on delete buttons, add move up/down buttons                            |
| `app/components/item-view-image.vue`   | Add `alt` on images, `aria-label` on nav buttons                                                                 |
| `app/components/category.vue`          | Add `alt` on thumbnails, `aria-label` on icon buttons, `aria-expanded` on collapse                               |
| `app/components/list.vue`              | Add `alt` on thumbnails, `aria-label` on camera button                                                           |
| `app/components/library-lists.vue`     | Add move up/down buttons with live announcements                                                                 |
| `app/components/library-items.vue`     | Add `aria-label` on drag handles                                                                                 |
| `app/components/signin-form.vue`       | Add visually-hidden `<label>` for email input                                                                    |
| `test/unit/components/modal.spec.ts`   | Add tests for dialog role, aria-modal, aria-labelledby, focus trap                                               |
| `test/unit/components/popover.spec.ts` | Add tests for aria-modal, aria-expanded, focus trap                                                              |

---

### Task 1: CSS Utilities — `.visually-hidden` and `.skip-link`

**Files:**

- Modify: `app/assets/css/_common.css`

- [ ] **Step 1: Add `.visually-hidden` class to `_common.css`**

Add at the end of the file, before the closing `@media` blocks:

```css
.visually-hidden {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
}
```

- [ ] **Step 2: Add `.skip-link` class to `_common.css`**

Add immediately after `.visually-hidden`:

```css
.skip-link {
    background: #e8a220;
    border-radius: 0 0 4px 4px;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    color: #1e1e1c;
    font-family: 'Figtree', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    height: auto;
    left: 50%;
    overflow: visible;
    padding: 8px 16px;
    position: fixed;
    text-decoration: none;
    top: 0;
    transform: translateX(-50%);
    white-space: nowrap;
    width: auto;
    z-index: 10000;
}

.skip-link:focus-visible {
    clip: auto;
    clip-path: none;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/assets/css/_common.css
git commit -m "feat(a11y): add visually-hidden and skip-link CSS utility classes"
```

---

### Task 2: Semantic Structure — Landmarks and Skip Link

**Files:**

- Modify: `app/pages/index.vue`

- [ ] **Step 1: Add skip link and `<main>` landmark to `index.vue`**

Replace the current template in `app/pages/index.vue`:

```html
<template>
    <div v-if="isLoaded" id="main" class="lpHasSidebar">
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <sidebar />

        <main id="main-content" class="lpList">
            <list />
        </main>

        <globalAlerts />
        <speedbump />
        <ImportCsv />
        <itemImage />
        <itemViewImage />
        <itemLink />
        <account />
        <accountDelete />

        <div id="lp-announce" class="visually-hidden" aria-live="polite" role="status" />
    </div>
</template>
```

Key changes:

- Added `<a href="#main-content" class="skip-link">` as first child
- Changed `<div class="lpList">` to `<main id="main-content" class="lpList">`
- Added `<div id="lp-announce">` live region at the bottom (used by `useAnnounce` composable later)

- [ ] **Step 2: Verify dev server renders landmarks**

Run: `npm run dev` and check in browser DevTools that `<main id="main-content">` and `<aside>` landmarks exist. Tab once to verify skip link appears.

- [ ] **Step 3: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat(a11y): add skip link, main landmark, and live announce region"
```

---

### Task 3: `useFocusTrap` Composable

**Files:**

- Create: `app/composables/useFocusTrap.ts`
- Create: `test/unit/composables/useFocusTrap.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `test/unit/composables/useFocusTrap.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useFocusTrap } from '../../../app/composables/useFocusTrap';

function createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    const btn1 = document.createElement('button');
    btn1.id = 'btn1';
    btn1.textContent = 'First';
    const input1 = document.createElement('input');
    input1.id = 'input1';
    input1.type = 'text';
    const link1 = document.createElement('a');
    link1.id = 'link1';
    link1.href = '#';
    link1.textContent = 'Link';
    const btn2 = document.createElement('button');
    btn2.id = 'btn2';
    btn2.textContent = 'Last';
    container.appendChild(btn1);
    container.appendChild(input1);
    container.appendChild(link1);
    container.appendChild(btn2);
    document.body.appendChild(container);
    return container;
}

function pressTab(shiftKey = false) {
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, shiftKey }));
}

describe('useFocusTrap', () => {
    let container: HTMLDivElement;
    let triggerButton: HTMLButtonElement;

    beforeEach(() => {
        triggerButton = document.createElement('button');
        triggerButton.id = 'trigger';
        document.body.appendChild(triggerButton);
        triggerButton.focus();
        container = createContainer();
    });

    afterEach(() => {
        document.body.replaceChildren();
    });

    it('moves focus to first focusable element on activate', () => {
        const { activate } = useFocusTrap();
        activate(container);
        expect(document.activeElement?.id).toBe('btn1');
    });

    it('wraps focus from last to first element on Tab', () => {
        const { activate } = useFocusTrap();
        activate(container);
        const lastBtn = container.querySelector('#btn2') as HTMLElement;
        lastBtn.focus();
        pressTab(false);
        expect(document.activeElement?.id).toBe('btn1');
    });

    it('wraps focus from first to last element on Shift+Tab', () => {
        const { activate } = useFocusTrap();
        activate(container);
        pressTab(true);
        expect(document.activeElement?.id).toBe('btn2');
    });

    it('restores focus to previously focused element on deactivate', () => {
        const { activate, deactivate } = useFocusTrap();
        activate(container);
        expect(document.activeElement?.id).toBe('btn1');
        deactivate();
        expect(document.activeElement?.id).toBe('trigger');
    });

    it('removes keydown listener on deactivate', () => {
        const { activate, deactivate } = useFocusTrap();
        activate(container);
        deactivate();
        // Focus a new element and Tab — should NOT wrap
        const outside = document.createElement('button');
        outside.id = 'outside';
        document.body.appendChild(outside);
        outside.focus();
        pressTab();
        // No wrapping — focus stays wherever the browser puts it (not btn1)
        expect(document.activeElement?.id).not.toBe('btn1');
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- --run test/unit/composables/useFocusTrap.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `useFocusTrap`**

Create `app/composables/useFocusTrap.ts`:

```typescript
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not(:disabled)',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap() {
    let container: HTMLElement | null = null;
    let previouslyFocused: HTMLElement | null = null;

    function getFocusable(): HTMLElement[] {
        if (!container) return [];
        return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key !== 'Tab') return;

        const focusable = getFocusable();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    }

    function activate(el: HTMLElement) {
        container = el;
        previouslyFocused = document.activeElement as HTMLElement | null;
        container.addEventListener('keydown', handleKeydown);

        const focusable = getFocusable();
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    }

    function deactivate() {
        if (container) {
            container.removeEventListener('keydown', handleKeydown);
        }
        if (previouslyFocused && previouslyFocused.focus) {
            previouslyFocused.focus();
        }
        container = null;
        previouslyFocused = null;
    }

    return { activate, deactivate };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- --run test/unit/composables/useFocusTrap.spec.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/composables/useFocusTrap.ts test/unit/composables/useFocusTrap.spec.ts
git commit -m "feat(a11y): add useFocusTrap composable with tests"
```

---

### Task 4: `useAnnounce` Composable

**Files:**

- Create: `app/composables/useAnnounce.ts`
- Create: `test/unit/composables/useAnnounce.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `test/unit/composables/useAnnounce.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAnnounce } from '../../../app/composables/useAnnounce';

describe('useAnnounce', () => {
    let liveRegion: HTMLDivElement;

    beforeEach(() => {
        vi.useFakeTimers();
        liveRegion = document.createElement('div');
        liveRegion.id = 'lp-announce';
        document.body.appendChild(liveRegion);
    });

    afterEach(() => {
        document.body.replaceChildren();
        vi.useRealTimers();
    });

    it('sets text content on the live region', () => {
        const { announce } = useAnnounce();
        announce('Moved item to position 3');
        expect(liveRegion.textContent).toBe('Moved item to position 3');
    });

    it('clears text after delay', () => {
        const { announce } = useAnnounce();
        announce('Moved item to position 3');
        vi.advanceTimersByTime(3000);
        expect(liveRegion.textContent).toBe('');
    });

    it('does nothing if live region is missing', () => {
        document.body.replaceChildren();
        const { announce } = useAnnounce();
        // Should not throw
        expect(() => announce('test')).not.toThrow();
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- --run test/unit/composables/useAnnounce.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `useAnnounce`**

Create `app/composables/useAnnounce.ts`:

```typescript
export function useAnnounce() {
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    function announce(message: string) {
        const el = document.getElementById('lp-announce');
        if (!el) return;

        if (clearTimer) {
            clearTimeout(clearTimer);
        }

        el.textContent = message;

        clearTimer = setTimeout(() => {
            el.textContent = '';
            clearTimer = null;
        }, 3000);
    }

    return { announce };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- --run test/unit/composables/useAnnounce.spec.ts`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/composables/useAnnounce.ts test/unit/composables/useAnnounce.spec.ts
git commit -m "feat(a11y): add useAnnounce composable for live region announcements"
```

---

### Task 5: Modal — ARIA Attributes and Focus Trap

**Files:**

- Modify: `app/components/modal.vue`
- Modify: `test/unit/components/modal.spec.ts`

- [ ] **Step 1: Add ARIA tests to modal spec**

Append to `test/unit/components/modal.spec.ts`:

```typescript
it('has role="dialog" and aria-modal="true" when shown', () => {
    const wrapper = mount(Modal, {
        props: { shown: true },
        slots: { default: '<h2 id="modal-title">Title</h2>' },
    });
    const dialog = wrapper.find('.lp-modal');
    expect(dialog.attributes('role')).toBe('dialog');
    expect(dialog.attributes('aria-modal')).toBe('true');
});

it('sets aria-labelledby to the provided labelId prop', () => {
    const wrapper = mount(Modal, {
        props: { shown: true, labelId: 'my-title' },
        slots: { default: '<h2 id="my-title">Title</h2>' },
    });
    const dialog = wrapper.find('.lp-modal');
    expect(dialog.attributes('aria-labelledby')).toBe('my-title');
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm run test:unit -- --run test/unit/components/modal.spec.ts`
Expected: 2 new tests FAIL (missing attributes)

- [ ] **Step 3: Update modal.vue with ARIA attributes and focus trap**

Replace the template in `app/components/modal.vue`:

```html
<template>
    <div class="lp-modal-container">
        <transition name="lp-modal" @after-enter="onAfterEnter" @after-leave="onAfterLeave">
            <div
                v-if="shown"
                ref="modalRef"
                :id="id"
                class="lp-modal"
                role="dialog"
                aria-modal="true"
                :aria-labelledby="labelId"
            >
                <slot />
            </div>
        </transition>
        <transition name="lp-modal">
            <div
                v-if="shown"
                class="lp-modal-overlay"
                :class="{ 'is-transparent': transparentOverlay }"
                @click="hide"
            />
        </transition>
    </div>
</template>
```

Update the script section:

```html
<script setup>
    import { ref, onBeforeMount, onBeforeUnmount } from 'vue';
    import { useFocusTrap } from '../composables/useFocusTrap';

    defineOptions({ name: 'Modal' });

    const props = defineProps({
        id: {
            type: String,
            default: null,
        },
        shown: {
            type: Boolean,
            required: true,
        },
        blackout: {
            type: Boolean,
            default: false,
        },
        transparentOverlay: {
            type: Boolean,
            default: false,
        },
        labelId: {
            type: String,
            default: undefined,
        },
    });

    const emit = defineEmits(['hide']);
    const modalRef = ref(null);
    const focusTrap = useFocusTrap();

    function hide() {
        emit('hide');
    }

    function onAfterEnter() {
        if (modalRef.value) {
            focusTrap.activate(modalRef.value);
        }
    }

    function onAfterLeave() {
        focusTrap.deactivate();
    }

    function closeOnEscape(evt) {
        if (props.shown && evt.keyCode === 27) {
            hide();
        }
    }

    onBeforeMount(() => window.addEventListener('keyup', closeOnEscape));
    onBeforeUnmount(() => window.removeEventListener('keyup', closeOnEscape));
</script>
```

- [ ] **Step 4: Run all modal tests**

Run: `npm run test:unit -- --run test/unit/components/modal.spec.ts`
Expected: All tests PASS

- [ ] **Step 5: Add `labelId` to modal usages**

Update the `<h2>` tags inside modals that use `modal.vue` to have IDs, and pass `labelId` to the modal component. The key files:

In `app/components/item-image.vue`, change:

```html
<modal id="itemImageDialog" :shown="shown" @hide="shown = false"></modal>
```

to:

```html
<modal id="itemImageDialog" :shown="shown" label-id="item-image-dialog-title" @hide="shown = false"></modal>
```

And change:

```html
<h2 class="image-dialog-title">{{ dialogTitle }}</h2>
```

to:

```html
<h2 id="item-image-dialog-title" class="image-dialog-title">{{ dialogTitle }}</h2>
```

In `app/components/item-view-image.vue`, change:

```html
<modal id="lpImageDialog" :shown="shown" @hide="shown = false"></modal>
```

to:

```html
<modal id="lpImageDialog" :shown="shown" label-id="view-image-dialog-title" @hide="shown = false"></modal>
```

And add a visually-hidden title:

```html
<h2 id="view-image-dialog-title" class="visually-hidden">Image viewer</h2>
```

as the first child inside the modal.

Do the same for any other modal usages (check `item-link.vue`, `account.vue`, `account-delete.vue`, `speedbump.vue`, `import-csv.vue`). Each modal gets a `label-id` prop pointing to its heading's `id`.

- [ ] **Step 6: Commit**

```bash
git add app/components/modal.vue test/unit/components/modal.spec.ts app/components/item-image.vue app/components/item-view-image.vue
git add app/components/item-link.vue app/components/account.vue app/components/account-delete.vue app/components/speedbump.vue app/components/import-csv.vue
git commit -m "feat(a11y): add dialog role, aria-modal, aria-labelledby, and focus trap to modals"
```

---

### Task 6: Popover — ARIA Attributes and Focus Trap

**Files:**

- Modify: `app/components/popover.vue`
- Modify: `test/unit/components/popover.spec.ts`

- [ ] **Step 1: Read existing popover test**

Read `test/unit/components/popover.spec.ts` to understand existing patterns before adding tests.

- [ ] **Step 2: Add ARIA tests to popover spec**

Append to the popover spec:

```typescript
it('has aria-modal="true" on the content div', () => {
    const wrapper = mount(Popover, {
        props: { shown: true },
        slots: {
            target: '<button>trigger</button>',
            content: '<div>content</div>',
        },
    });
    const content = wrapper.find('.lp-popover-content');
    expect(content.attributes('aria-modal')).toBe('true');
});
```

- [ ] **Step 3: Run tests to verify the new one fails**

Run: `npm run test:unit -- --run test/unit/components/popover.spec.ts`
Expected: New test FAIL

- [ ] **Step 4: Update popover.vue with ARIA attributes and focus trap**

Update the template in `app/components/popover.vue`:

```html
<template>
    <div
        v-click-outside="hide"
        :id="id"
        :class="{ 'lp-popover': true, lpPopover: true, 'is-shown': shown, lpPopoverShown: shown }"
    >
        <div class="lp-popover-target lpTarget">
            <slot name="target" />
        </div>
        <div
            ref="contentRef"
            class="lp-popover-content lpContent"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="labelId"
        >
            <slot name="content" />
        </div>
    </div>
</template>
```

Update the script:

```html
<script setup>
    import { ref, watch, onBeforeMount, onBeforeUnmount } from 'vue';
    import { useFocusTrap } from '../composables/useFocusTrap';

    defineOptions({ name: 'Popover' });

    const props = defineProps({
        id: {
            type: String,
            default: null,
        },
        shown: {
            type: Boolean,
            required: true,
        },
        labelId: {
            type: String,
            default: undefined,
        },
    });

    const emit = defineEmits(['hide']);
    const contentRef = ref(null);
    const focusTrap = useFocusTrap();

    function hide() {
        emit('hide');
    }

    watch(
        () => props.shown,
        (val) => {
            if (val && contentRef.value) {
                focusTrap.activate(contentRef.value);
            } else if (!val) {
                focusTrap.deactivate();
            }
        },
    );

    function closeOnEscape(evt) {
        if (props.shown && evt.keyCode === 27) {
            hide();
        }
    }

    onBeforeMount(() => window.addEventListener('keyup', closeOnEscape));
    onBeforeUnmount(() => window.removeEventListener('keyup', closeOnEscape));
</script>
```

- [ ] **Step 5: Run all popover tests**

Run: `npm run test:unit -- --run test/unit/components/popover.spec.ts`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add app/components/popover.vue test/unit/components/popover.spec.ts
git commit -m "feat(a11y): add aria-modal, aria-labelledby, and focus trap to popover"
```

---

### Task 7: Icon-Only Buttons — Add `aria-label` Attributes

**Files:**

- Modify: `app/components/item.vue`
- Modify: `app/components/category.vue`
- Modify: `app/components/list.vue`
- Modify: `app/components/library-items.vue`

- [ ] **Step 1: Add `aria-label` to icon buttons in `item.vue`**

In `app/components/item.vue`, update each icon-only button to add `aria-label`:

Camera button (line ~58): add `aria-label="Upload photo"`

```html
<button
    class="lp-icon-btn lpCamera"
    title="Upload a photo or use a photo from the web"
    aria-label="Upload photo"
    @click="updateItemImage"
></button>
```

Link button (line ~77): add `aria-label="Add link"`

```html
<button
    class="lp-icon-btn lpLink"
    :class="{ lpActive: item.url }"
    title="Add a link for this item"
    aria-label="Add link"
    @click="updateItemLink"
></button>
```

Worn button (line ~96): add dynamic `aria-label`

```html
<button
    v-if="library.optionalFields['worn']"
    class="lp-icon-btn lpWorn"
    :class="{ lpActive: categoryItem.worn }"
    title="Mark this item as worn"
    :aria-label="categoryItem.worn ? 'Worn (active)' : 'Mark as worn'"
    @click="toggleWorn"
></button>
```

Consumable button (line ~117): add dynamic `aria-label`

```html
<button
    v-if="library.optionalFields['consumable']"
    class="lp-icon-btn lpConsumable"
    :class="{ lpActive: categoryItem.consumable }"
    title="Mark this item as a consumable"
    :aria-label="categoryItem.consumable ? 'Consumable (active)' : 'Mark as consumable'"
    @click="toggleConsumable"
></button>
```

Star button (line ~137): add dynamic `aria-label`

```html
<button
    class="lp-icon-btn lpStar"
    :class="'lpStar' + categoryItem.star"
    title="Star this item"
    :aria-label="categoryItem.star ? 'Star level ' + categoryItem.star : 'Add star'"
    @click="cycleStar"
></button>
```

Remove item link (line ~226): add `aria-label`

```html
<a class="lpRemove lpRemoveItem" title="Remove this item" aria-label="Remove item" @click="removeItem"></a>
```

- [ ] **Step 2: Add `aria-label` to category icon buttons in `category.vue`**

Camera button (line ~19): add `aria-label="Manage category images"`

```html
<button
    v-if="!readonly && library.optionalFields['images']"
    class="lp-icon-btn lpCategoryCamera"
    title="Manage category images"
    aria-label="Manage category images"
    @click="manageCategoryImages"
></button>
```

Remove category (line ~43): add `aria-label`

```html
<a
    class="lpRemove lpRemoveCategory"
    title="Remove this category"
    aria-label="Remove category"
    @click="removeCategory(category)"
></a>
```

- [ ] **Step 3: Add `aria-label` to list camera button in `list.vue`**

Camera button (line ~19): add `aria-label="Manage list images"`

```html
<button
    v-if="library.optionalFields['images']"
    class="lp-icon-btn lp-list-camera"
    title="Manage list images"
    aria-label="Manage list images"
    @click="manageListImages"
></button>
```

- [ ] **Step 4: Add `aria-label` to drag handles in `library-items.vue`**

Drag handle (line ~26): add `aria-label`

```html
<div
    v-if="!libItem.inCurrentList"
    class="lpHandle lpLibraryItemHandle lp-gear-drag-handle"
    title="Drag to add to list"
    aria-label="Drag to add to list"
></div>
```

- [ ] **Step 5: Commit**

```bash
git add app/components/item.vue app/components/category.vue app/components/list.vue app/components/library-items.vue
git commit -m "feat(a11y): add aria-label to all icon-only buttons and drag handles"
```

---

### Task 8: Quantity Adjusters — Change `<span>` to `<button>`

**Files:**

- Modify: `app/components/item.vue`

- [ ] **Step 1: Replace qty `<span>` elements with `<button>` in `item.vue`**

In `app/components/item.vue`, find the `.lpArrows` section (lines ~195-222) and replace:

```html
<span class="lpArrows">
    <button type="button" class="lp-arrow lpUp" aria-label="Increase quantity" @click="incrementQty($event)">
        <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
        >
            <path d="M1 5l4-4 4 4" />
        </svg>
    </button>
    <button type="button" class="lp-arrow lpDown" aria-label="Decrease quantity" @click="decrementQty($event)">
        <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
        >
            <path d="M1 1l4 4 4-4" />
        </svg>
    </button>
</span>
```

- [ ] **Step 2: Update `.lp-arrow` CSS to reset button styles**

In the `<style>` section of `item.vue`, update `.lp-arrow`:

```css
.lp-arrow {
    background: none;
    border: none;
    color: #8a8880;
    cursor: pointer;
    display: flex;
    line-height: 1;
    padding: 0;
    transition: color 120ms ease;

    &:hover {
        color: #1e1e1c;
    }
}
```

- [ ] **Step 3: Run unit tests**

Run: `npm run test:unit -- --run test/unit/components/item.spec.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/components/item.vue
git commit -m "feat(a11y): change qty adjusters from span to button with aria-labels"
```

---

### Task 9: Image Alt Text

**Files:**

- Modify: `app/components/item.vue`
- Modify: `app/components/item-image.vue`
- Modify: `app/components/item-view-image.vue`
- Modify: `app/components/category.vue`
- Modify: `app/components/list.vue`

- [ ] **Step 1: Add `alt` to item thumbnails in `item.vue`**

Multi-image thumbnails (line ~9): change `<img>` to include `alt`:

```html
<img
    v-for="(img, i) in visibleThumbnails"
    :key="img.id ?? i"
    class="lpItemThumb"
    :src="img.url"
    :alt="`${item.name} image ${i + 1}`"
    :title="`Image ${i + 1}`"
    @click="viewItemImageAt(i)"
/>
```

Single legacy thumbnail (line ~20): add `alt`:

```html
<img
    v-else-if="thumbnailImage"
    class="lpItemImage"
    :src="thumbnailImage"
    :alt="item.name + ' thumbnail'"
    @click="viewItemImage()"
/>
```

- [ ] **Step 2: Add `alt` to gallery thumbnails in `item-image.vue`**

Gallery thumb (line ~10): add `alt`:

```html
<img :src="img.url" class="gallery-thumb" :alt="`Image ${images.indexOf(img) + 1}`" @click="viewImage(img)" />
```

Gallery delete button (line ~11): add `aria-label`:

```html
<button class="gallery-delete" title="Remove image" aria-label="Remove image" @click="removeImage(img)">&#215;</button>
```

- [ ] **Step 3: Add `alt` to image viewer in `item-view-image.vue`**

Main image (line ~8): add `alt`:

```html
<img :src="activeUrl" class="view-image-img" alt="Full size image" />
```

Nav buttons — add `aria-label`:

```html
<button
    v-if="images.length > 1"
    class="nav-btn nav-prev"
    :disabled="activeIndex === 0"
    aria-label="Previous image"
    @click="prev"
></button>
```

```html
<button
    v-if="images.length > 1"
    class="nav-btn nav-next"
    :disabled="activeIndex === images.length - 1"
    aria-label="Next image"
    @click="next"
></button>
```

Thumbnail strip images (line ~22): add `alt`:

```html
<img
    v-for="(img, i) in images"
    :key="img.id ?? i"
    :src="img.url ?? img"
    class="view-thumb"
    :class="{ 'is-active': i === activeIndex }"
    :alt="`Thumbnail ${i + 1}`"
    @click="activeIndex = i"
/>
```

- [ ] **Step 4: Add `alt` to category thumbnails in `category.vue`**

Category image thumbnails (line ~60): add `alt`:

```html
<img
    v-for="(img, i) in visibleCategoryThumbs"
    :key="img.id ?? i"
    class="lpItemThumb"
    :src="img.url"
    :alt="`${category.name} image ${i + 1}`"
    :title="`Image ${i + 1}`"
    @click="viewCategoryImageAt(i)"
/>
```

- [ ] **Step 5: Add `alt` to list thumbnails in `list.vue`**

List image thumbnails (line ~57): add `alt`:

```html
<img
    v-for="(img, i) in visibleListThumbs"
    :key="img.id ?? i"
    class="lpItemThumb"
    :src="img.url"
    :alt="`${list.name} image ${i + 1}`"
    :title="`Image ${i + 1}`"
    @click="viewListImageAt(i)"
/>
```

- [ ] **Step 6: Run unit tests**

Run: `npm run test:unit`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add app/components/item.vue app/components/item-image.vue app/components/item-view-image.vue app/components/category.vue app/components/list.vue
git commit -m "feat(a11y): add alt text to all images and aria-labels to image nav buttons"
```

---

### Task 10: Form Labels

**Files:**

- Modify: `app/components/signin-form.vue`
- Modify: `app/components/item.vue`

- [ ] **Step 1: Add visually-hidden label to signin email input**

In `app/components/signin-form.vue`, add a `<label>` before the email input and an `id` to the input:

```html
<div class="lpFields">
    <label for="signin-email" class="visually-hidden">Email address</label>
    <input
        id="signin-email"
        v-model="email"
        v-focus-on-create
        type="email"
        placeholder="Email address"
        name="email"
        class="email"
        autocomplete="email"
    />
</div>
```

- [ ] **Step 2: Add visually-hidden labels to item inputs in `item.vue`**

For the item name input (line ~31):

```html
<label :for="'item-name-' + item.id" class="visually-hidden">Item name</label>
<input
    :id="'item-name-' + item.id"
    v-model="item.name"
    v-focus-on-create="categoryItem._isNew"
    type="text"
    class="lpName lpSilent"
    placeholder="Name"
    @input="saveItem"
/>
```

For the item description input (line ~38):

```html
<label :for="'item-desc-' + item.id" class="visually-hidden">Item description</label>
<input
    :id="'item-desc-' + item.id"
    v-model="item.description"
    type="text"
    class="lpDescription lpSilent"
    placeholder="Description"
    @input="saveItem"
/>
```

For the price input (line ~157): add `aria-label` instead of a label element (inline context):

```html
<input
    v-else
    v-model="displayPrice"
    v-empty-if-zero
    type="text"
    aria-label="Price"
    :class="{ lpPrice: true, lpNumber: true, lpSilent: true, lpSilentError: priceError }"
    @input="savePrice"
    @keydown.up="incrementPrice($event)"
    @keydown.down="decrementPrice($event)"
    @blur="setDisplayPrice"
/>
```

For the weight input (line ~173): add `aria-label`:

```html
<input
    v-model="displayWeight"
    v-empty-if-zero
    type="text"
    aria-label="Weight"
    :class="{ lpWeight: true, lpNumber: true, lpSilent: true, lpSilentError: weightError }"
    @input="saveWeight"
    @keydown.up="incrementWeight($event)"
    @keydown.down="decrementWeight($event)"
/>
```

For the qty input (line ~188): add `aria-label`:

```html
<input
    v-model="displayQty"
    type="text"
    aria-label="Quantity"
    :class="{ lpQty: true, lpNumber: true, lpSilent: true, lpSilentError: qtyError }"
    @input="saveQty"
    @keydown.up="incrementQty($event)"
    @keydown.down="decrementQty($event)"
/>
```

- [ ] **Step 3: Run unit tests**

Run: `npm run test:unit`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/components/signin-form.vue app/components/item.vue
git commit -m "feat(a11y): add visually-hidden labels and aria-labels to form inputs"
```

---

### Task 11: Keyboard Reorder — List Move Buttons

**Files:**

- Modify: `app/components/library-lists.vue`

- [ ] **Step 1: Add move up/down buttons to `library-lists.vue`**

In the template, add move buttons inside each `<li>` after the drag handle. Update the `v-for` to include `index`:

```html
<li
    v-for="(libList, index) in library.lists"
    :key="libList.id"
    class="lp-nav-list-item"
    :class="{ 'is-active': library.defaultListId == libList.id }"
>
    <span class="lpHandle lp-drag-handle" title="Reorder" aria-label="Drag to reorder list">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true">
            <circle cx="3" cy="2.5" r="1.2" fill="currentColor" />
            <circle cx="7" cy="2.5" r="1.2" fill="currentColor" />
            <circle cx="3" cy="7" r="1.2" fill="currentColor" />
            <circle cx="7" cy="7" r="1.2" fill="currentColor" />
            <circle cx="3" cy="11.5" r="1.2" fill="currentColor" />
            <circle cx="7" cy="11.5" r="1.2" fill="currentColor" />
        </svg>
    </span>
    <button
        v-if="index > 0"
        class="lp-reorder-btn visually-hidden"
        :aria-label="'Move ' + listName(libList) + ' up'"
        @click="moveListUp(index)"
    >
        &uarr;
    </button>
    <button
        v-if="index < library.lists.length - 1"
        class="lp-reorder-btn visually-hidden"
        :aria-label="'Move ' + listName(libList) + ' down'"
        @click="moveListDown(index)"
    >
        &darr;
    </button>
    <button
        class="lp-nav-link"
        :class="{ active: library.defaultListId == libList.id }"
        @click="setDefaultList(libList)"
    >
        {{ listName(libList) }}
    </button>
    <button
        v-if="library.defaultListId !== libList.id"
        class="lp-nav-remove"
        title="Remove this list"
        aria-label="Remove list"
        @click="removeList(libList)"
    >
        &times;
    </button>
</li>
```

- [ ] **Step 2: Add move functions and announce import to the script**

Add to the imports:

```javascript
import { useAnnounce } from '../composables/useAnnounce';
```

Add after the existing `const library = ...` line:

```javascript
const { announce } = useAnnounce();

function moveListUp(index) {
    store.reorderList({ before: index, after: index - 1 });
    const name = listName(library.value.lists[index - 1]);
    announce(`Moved ${name} to position ${index} of ${library.value.lists.length}`);
}

function moveListDown(index) {
    store.reorderList({ before: index, after: index + 1 });
    const name = listName(library.value.lists[index + 1]);
    announce(`Moved ${name} to position ${index + 2} of ${library.value.lists.length}`);
}
```

- [ ] **Step 3: Add CSS for `.lp-reorder-btn`**

Add to the `<style>` section of `library-lists.vue`:

```css
.lp-reorder-btn {
    background: none;
    border: 1px solid #3b3b37;
    border-radius: 4px;
    color: #c8c6bc;
    cursor: pointer;
    font-size: 12px;
    height: 22px;
    line-height: 1;
    padding: 0;
    width: 22px;
}

.lp-reorder-btn:focus-visible {
    clip: auto;
    clip-path: none;
    height: auto;
    outline: 2px solid #e8a220;
    outline-offset: 2px;
    overflow: visible;
    position: static;
    white-space: normal;
    width: auto;
}
```

- [ ] **Step 4: Run unit tests**

Run: `npm run test:unit -- --run test/unit/components/library-lists.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/components/library-lists.vue
git commit -m "feat(a11y): add keyboard move up/down buttons for list reordering"
```

---

### Task 12: Keyboard Reorder — Image Gallery Move Buttons

**Files:**

- Modify: `app/components/item-image.vue`

- [ ] **Step 1: Add move buttons to image gallery in `item-image.vue`**

Update the gallery item template to include move buttons:

```html
<div v-for="(img, index) in images" :key="img.id" class="gallery-item">
    <img :src="img.url" class="gallery-thumb" :alt="`Image ${index + 1}`" @click="viewImage(img)" />
    <button
        v-if="index > 0"
        class="gallery-move lp-reorder-btn visually-hidden"
        :aria-label="'Move image ' + (index + 1) + ' left'"
        @click="moveImageUp(index)"
    >
        &larr;
    </button>
    <button
        v-if="index < images.length - 1"
        class="gallery-move lp-reorder-btn visually-hidden"
        :aria-label="'Move image ' + (index + 1) + ' right'"
        @click="moveImageDown(index)"
    >
        &rarr;
    </button>
    <button class="gallery-delete" title="Remove image" aria-label="Remove image" @click="removeImage(img)">
        &#215;
    </button>
</div>
```

- [ ] **Step 2: Add move functions to the script**

Add to the imports:

```javascript
import { useAnnounce } from '../composables/useAnnounce';
```

Add after `const isDragging = ref(false);`:

```javascript
const { announce } = useAnnounce();
```

Add the move functions:

```javascript
function moveImageUp(index) {
    const reordered = [...images.value];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(index - 1, 0, moved);
    store.reorderImages({ entityType: entityType.value, entityId: reactiveEntity.value.id, images: reordered });
    announce(`Moved image to position ${index} of ${reordered.length}`);
}

function moveImageDown(index) {
    const reordered = [...images.value];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(index + 1, 0, moved);
    store.reorderImages({ entityType: entityType.value, entityId: reactiveEntity.value.id, images: reordered });
    announce(`Moved image to position ${index + 2} of ${reordered.length}`);
}
```

- [ ] **Step 3: Add CSS for gallery reorder buttons**

Add to the `<style>` section:

```css
.gallery-move {
    font-size: 11px;
    height: 20px;
    width: 20px;
}

.gallery-move:focus-visible {
    clip: auto;
    clip-path: none;
    height: auto;
    outline: 2px solid #e8a220;
    outline-offset: 2px;
    overflow: visible;
    position: static;
    white-space: normal;
    width: auto;
}
```

- [ ] **Step 4: Run unit tests**

Run: `npm run test:unit -- --run test/unit/components/item-image.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/components/item-image.vue
git commit -m "feat(a11y): add keyboard move buttons for image gallery reordering"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run all unit tests**

Run: `npm run test:unit`
Expected: All tests PASS

- [ ] **Step 2: Run linting**

Run: `npm run lint:js`
Expected: No errors (auto-fixes applied)

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: No type errors

- [ ] **Step 4: Manual verification in browser**

Start dev server: `npm run dev`

Check:

1. Tab from address bar — skip link appears, clicking it jumps to main content
2. Open any modal (e.g., click camera icon) — focus is trapped inside, ESC closes and restores focus
3. All images have alt text (inspect in DevTools)
4. Tab to qty arrows — they are focusable `<button>` elements
5. Tab to list move buttons in sidebar — they appear on focus, clicking reorders and announces
6. Screen reader reads icon button labels correctly

- [ ] **Step 5: Commit any auto-fix changes from linting**

```bash
git add -A
git commit -m "chore: apply lint auto-fixes after accessibility changes"
```
