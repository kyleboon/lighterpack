import { eq } from 'drizzle-orm';
import config from 'config';
import { getDb } from '../../db.js';
import * as schema from '../../schema.js';
import { initNewUserLibrary } from '../../utils/library.js';

// Used by E2E tests to create a session programmatically without magic link flow.
export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const email = String(body.email ?? '')
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
    // Standard base64 encoding — better-call requires 44 chars with trailing '='
    const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    const signedToken = `${rawToken}.${sigBase64}`;
    return { token: signedToken };
});
