// Nitro server middleware: runs on every request.
// Populates event.context.user from the `lp` session cookie when valid.
// Individual API routes that require auth check event.context.user themselves.
export default defineEventHandler(async (event) => {
    const token = getCookie(event, 'lp');
    if (!token) return;

    try {
        const users = await getDb().collection('users').find({ token }).toArray();
        if (users?.length) {
            event.context.user = users[0];
        }
    } catch {
        // DB error — continue unauthenticated
    }
});
