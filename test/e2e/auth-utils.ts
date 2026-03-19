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
    const response = await page.request.post(`${testRoot}api/test/create-user-session`, {
        data: { email },
    });
    const { token } = await response.json();

    await page.context().addCookies([
        {
            name: 'better-auth.session_token',
            value: token,
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
        },
    ]);

    await page.goto(testRoot);
    // Wait for the app to recognize the session and load the library
    await page.waitForSelector('#lp', { state: 'attached' });
    await page.waitForTimeout(2000); // allow the SPA to boot and fetch /api/library
}

/**
 * Backward-compatible wrapper — the username and password args are ignored.
 * The email (4th arg) is used to log in via the programmatic session API.
 */
export async function registerUser(
    page: Page,
    _username: string,
    _password: string,
    email: string,
): Promise<void> {
    await loginUser(page, email);
}

export async function logoutUser(page: Page): Promise<void> {
    await page.getByText('Signed in as').hover();
    await page.getByText('Sign out').click();
    await page.waitForURL(`${testRoot}signin`);
}
