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
        expect(() => announce('test')).not.toThrow();
    });
});
