export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }
    if (!isModerator(user.username)) {
        setResponseStatus(event, 403);
        return { message: 'Denied.' };
    }

    const q = String(getQuery(event).q ?? '').toLowerCase().trim();
    const escaped = q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const users = getDb().collection('users');

    const [nameResult, emailResult] = await Promise.all([
        users.find({ username: { $regex: `${escaped}.*`, $options: 'si' } }).toArray(),
        users.find({ email: { $regex: `${escaped}.*`, $options: 'si' } }).toArray(),
    ]);

    const results = [...nameResult, ...emailResult].map((u: any) => ({
        username: u.username,
        library: u.library,
        email: u.email,
    }));

    return { results };
});
