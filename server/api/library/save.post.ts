export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const body = await readBody(event);

    if (typeof body.syncToken === 'undefined') {
        setResponseStatus(event, 400);
        return { message: 'Please refresh this page to upgrade to the latest version of LighterPack.' };
    }
    if (!body.username || !body.data) {
        setResponseStatus(event, 400);
        return { message: 'An error occurred while saving your data. Please refresh your browser and try again.' };
    }
    if (body.username != user.username) {
        setResponseStatus(event, 401);
        return { message: 'An error occurred while saving your data. Please refresh your browser and login again.' };
    }
    if (body.syncToken != user.syncToken) {
        setResponseStatus(event, 400);
        return { message: 'Your list is out of date - please refresh your browser.' };
    }

    let library;
    try {
        library = JSON.parse(body.data);
    } catch {
        setResponseStatus(event, 400);
        return { errors: [{ message: 'An error occurred while saving your data - unable to parse library. If this persists, please contact support.' }] };
    }

    user.library = library;
    user.syncToken++;
    await upsertUser(user);
    console.log({ message: 'saved library', username: user.username });
    return { message: 'success', syncToken: user.syncToken };
});
