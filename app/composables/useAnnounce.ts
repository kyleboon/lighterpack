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
