export default defineEventHandler(async (event) => {
    const token = getCookie(event, 'lp');
    if (token) {
        try {
            await getDb()
                .collection('users')
                .updateOne({ token }, { $unset: { token: '' } });
        } catch {
            // Best-effort token invalidation
        }
    }
    deleteCookie(event, 'lp', { path: '/', httpOnly: true, sameSite: 'lax' });
    return { ok: true };
});
