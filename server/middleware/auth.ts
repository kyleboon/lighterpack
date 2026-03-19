import { auth } from '../utils/auth.js';
import { getRequestHeaders } from 'h3';

// Nitro server middleware: runs on every request.
// Populates event.context.user from the Better Auth session when valid.
// Individual API routes that require auth check event.context.user themselves.
export default defineEventHandler(async (event) => {
    try {
        // Use getRequestHeaders instead of toWebRequest so the Node.js request
        // body stream is not wrapped in a Web Request (which would pause the
        // stream and cause readBody() to hang in subsequent handlers).
        const headers = new Headers(getRequestHeaders(event) as Record<string, string>);
        const session = await auth.api.getSession({ headers });
        if (session?.user) {
            event.context.user = session.user;
        }
    } catch {
        // Session error — continue unauthenticated
    }
});
