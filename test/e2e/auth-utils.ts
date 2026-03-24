import { Page } from '@playwright/test';
import { testRoot } from './utils';

// Stable shared user — reused across tests that just need a logged-in state.
let sharedUserEmail: string | null = null;

export async function getSharedUser(): Promise<{ email: string }> {
    if (!sharedUserEmail) {
        sharedUserEmail = `shared${Date.now()}@test.lighterpack.com`;
    }
    return { email: sharedUserEmail };
}

/**
 * Create a session programmatically (no email required) and set the
 * Better Auth session cookie so the app loads in an authenticated state.
 */
export async function loginUser(page: Page, email: string): Promise<void> {
    // The GET endpoint sets the session cookie via Set-Cookie header and redirects
    // to / — fully browser-native, so Chromium, Firefox, and WebKit all pick it up.
    await page.goto(`${testRoot}api/test/login?email=${encodeURIComponent(email)}`);
    // Wait for the sidebar footer — it renders only after the session is restored and library loaded
    await page.waitForSelector('.lp-sidebar-footer', { state: 'visible', timeout: 15000 });
}

/**
 * Backward-compatible wrapper — the username and password args are ignored.
 * The email (4th arg) is used to log in via the programmatic session API.
 */
export async function registerUser(page: Page, _username: string, _password: string, email: string): Promise<void> {
    await loginUser(page, email);
}

export async function logoutUser(page: Page): Promise<void> {
    await page.getByText('Sign out').click();
    await page.waitForURL(`${testRoot}welcome`);
}
