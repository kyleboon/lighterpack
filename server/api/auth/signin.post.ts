import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const crypto = _require('crypto');

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    // Cookie-based auth is handled by the global middleware (event.context.user).
    // This route also accepts username+password credentials to create a new session.
    let user = event.context.user;

    if (!user) {
        if (!body.username || !body.password) {
            setResponseStatus(event, 401);
            return { message: 'Please log in.' };
        }

        try {
            user = await verifyPassword(
                String(body.username).toLowerCase().trim(),
                String(body.password),
            );
        } catch (err: any) {
            setResponseStatus(event, err.code ?? 401);
            return { message: err.message ?? 'Please log in.' };
        }

        const token = crypto.randomBytes(48).toString('hex');
        user.token = token;
        upsertUser(user).catch(console.error);

        setCookie(event, 'lp', token, {
            path: '/',
            maxAge: 365 * 24 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',
        });
    }

    console.log({ message: 'signed in', username: user.username });

    if (!user.syncToken) {
        user.syncToken = 0;
        upsertUser(user).catch(console.error);
    }

    return { username: user.username, library: JSON.stringify(user.library), syncToken: user.syncToken };
});
