import { eq } from 'drizzle-orm';
import config from 'config';
import { getDb } from '../../db.js';
import * as schema from '../../schema.js';
import { initNewUserLibrary } from '../../utils/library.js';

// Used by E2E tests: GET /api/test/login?email=foo@example.com
// Creates (or reuses) the user, inserts a session, sets the Better Auth session
// cookie via Set-Cookie, then redirects to /  — fully browser-native so the
// cookie is picked up identically by Chromium, Firefox, and WebKit.
// Disabled unless ENABLE_TEST_ENDPOINTS=true to prevent auth bypass in production.
export default defineEventHandler(async (event) => {
    if (useRuntimeConfig().enableTestEndpoints !== true) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' });
    }

    const query = getQuery(event);
    const email = String(query.email ?? '')
        .trim()
        .toLowerCase();
    if (!email) {
        setResponseStatus(event, 400);
        return { error: 'email required' };
    }

    const db = getDb();
    const now = new Date();

    // Find or create user
    let [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));
    if (!user) {
        const [newUser] = await db
            .insert(schema.user)
            .values({
                id: crypto.randomUUID(),
                email,
                emailVerified: true,
                createdAt: now,
                updatedAt: now,
            })
            .returning();
        user = newUser;
        await initNewUserLibrary(user.id);
    }

    // Generate a random token in the same format Better Auth uses (base64url, 32 chars)
    const rawBytes = crypto.getRandomValues(new Uint8Array(24));
    const rawToken = btoa(String.fromCharCode(...rawBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(schema.session).values({
        id: crypto.randomUUID(),
        token: rawToken,
        userId: user.id,
        expiresAt,
        createdAt: now,
        updatedAt: now,
    });

    // Sign the token using the same HMAC-SHA256 that Better Auth uses for cookies
    const secret = config.get<string>('betterAuthSecret');
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawToken));
    const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const signedToken = `${rawToken}.${sigBase64}`;

    // Set the cookie the same way a real browser login would
    appendResponseHeader(
        event,
        'Set-Cookie',
        `better-auth.session_token=${signedToken}; Path=/; HttpOnly; SameSite=Lax`,
    );

    // Redirect to home — the browser will store the cookie and load the app
    return sendRedirect(event, '/');
});
