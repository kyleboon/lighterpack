export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const body = await readBody(event);
    console.log({ message: 'Starting account delete', username: user.username });

    let verified: any;
    try {
        verified = await verifyPassword(user.username, String(body.password ?? ''));
    } catch {
        setResponseStatus(event, 400);
        return { errors: [{ field: 'currentPassword', message: 'Your current password is incorrect.' }] };
    }

    if (body.username !== verified.username) {
        setResponseStatus(event, 400);
        return { errors: [{ message: 'An error occurred, please try logging out and in again.' }] };
    }

    await getDb().collection('users').deleteOne({ _id: verified._id });
    console.log({ message: 'Completed account delete', username: user.username });
    return { message: 'success' };
});
