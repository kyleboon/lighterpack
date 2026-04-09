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
    document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, shiftKey }),
    );
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
        const outside = document.createElement('button');
        outside.id = 'outside';
        document.body.appendChild(outside);
        outside.focus();
        pressTab();
        expect(document.activeElement?.id).not.toBe('btn1');
    });
});
