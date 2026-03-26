import { Page } from '@playwright/test';

export const testRoot = 'http://localhost:3000/';

/**
 * Get the share URL for the current list by reading the externalId from the store.
 * Lists get an externalId at creation time, so this works without any UI interaction.
 */
export async function getShareUrl(page: Page): Promise<string> {
    return page.evaluate(() => {
        const app = (document.getElementById('lp') as any).__vue_app__;
        const store = app.config.globalProperties.$store;
        const lib = store.library;
        const list = lib.getListById(lib.defaultListId);
        return `${window.location.origin}/r/${list.externalId}`;
    });
}
