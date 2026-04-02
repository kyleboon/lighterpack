import crypto from 'node:crypto';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Routes handled by Better Auth — it manages its own CSRF protection.
function isBetterAuthRoute(path: string): boolean {
    return path.startsWith('/api/auth/');
}

// Test-only routes are gated by runtime config and not reachable in production.
function isTestRoute(path: string): boolean {
    return path.startsWith('/api/test/');
}

export default defineEventHandler((event) => {
    const path = getRequestURL(event).pathname;
    const method = event.node.req.method ?? 'GET';

    // Ensure a CSRF cookie is always present so the client can read it.
    let token = getCookie(event, CSRF_COOKIE);
    if (!token) {
        token = crypto.randomBytes(32).toString('hex');
        setCookie(event, CSRF_COOKIE, token, {
            httpOnly: false, // JS must read this cookie
            sameSite: 'strict',
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        });
    }

    // Only validate on mutating requests to our own API (not Better Auth or test routes).
    if (MUTATING_METHODS.has(method) && path.startsWith('/api/') && !isBetterAuthRoute(path) && !isTestRoute(path)) {
        const headerToken = getRequestHeader(event, CSRF_HEADER);
        if (!headerToken || headerToken !== token) {
            throw createError({ statusCode: 403, message: 'Invalid or missing CSRF token.' });
        }
    }
});
