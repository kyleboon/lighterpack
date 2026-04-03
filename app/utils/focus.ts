import type { App, DirectiveBinding } from 'vue';
import { useLighterpackStore } from '../store/store';

let _uniqueIdCounter = 0;
const uniqueId = () => String(++_uniqueIdCounter);

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
            // In Vue 3, `binding.expression` no longer exists; focus if value is truthy or absent
            if (binding.value !== false) {
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
            const key = el.dataset.clickoutside!;
            const handler = (store.directiveInstances as Record<string, (evt: Event) => void>)[key];
            store.removeDirectiveInstance(key);
            window.removeEventListener('click', handler);
        },
    });
}
