import { useLighterpackStore } from '~/store/store.js';

// Restore session from the lp cookie on every page load.
// This plugin is async so routing is blocked until we know whether the user
// is authenticated (prevents flash-redirect to /signin on refresh).
export default defineNuxtPlugin(async () => {
    const store = useLighterpackStore();

    // Already hydrated (e.g. after login/register within the same session)
    if (store.loggedIn) return;

    try {
        const data = await $fetch('/api/auth/signin', {
            method: 'POST',
            body: {},
            credentials: 'include',
        });
        if (data && (data as any).username) {
            store.setLoggedIn((data as any).username);
            store.setSyncToken((data as any).syncToken);
            store.loadLibraryData((data as any).library);
            store.setSaveType('remote');
        }
    } catch {
        // 401 = no valid session, stay unauthenticated
    }
});
