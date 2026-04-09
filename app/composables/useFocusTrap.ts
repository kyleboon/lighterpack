const FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not(:disabled)',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]:not([tabindex="-1"])',
];

export function useFocusTrap() {
    let container: HTMLElement | null = null;
    let previouslyFocused: HTMLElement | null = null;

    function getFocusable(): HTMLElement[] {
        if (!container) return [];
        // Query each selector separately and merge, then sort by DOM order.
        // A single comma-joined querySelectorAll can return results in selector
        // order rather than document order in some environments (e.g. jsdom 29).
        const seen = new Set<HTMLElement>();
        for (const sel of FOCUSABLE_SELECTORS) {
            for (const el of container.querySelectorAll<HTMLElement>(sel)) {
                seen.add(el);
            }
        }
        return Array.from(seen).sort((a, b) => {
            const pos = a.compareDocumentPosition(b);
            // eslint-disable-next-line no-bitwise
            return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });
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
