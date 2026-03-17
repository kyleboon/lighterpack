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

    const body = await readBody(event);
    const username = String(body.username ?? '').toLowerCase().trim();
    console.log({ message: 'MODERATION Clear session start', username });

    const users = await getDb().collection('users').find({ username }).toArray();
    if (!users.length) {
        setResponseStatus(event, 500);
        return { message: 'An error occurred.' };
    }

    const target = users[0];
    target.token = '';
    await upsertUser(target);
    console.log({ message: 'MODERATION Clear session succeeded', username });
    return { message: 'success' };
});
