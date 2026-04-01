export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    let library;
    try {
        library = await buildLibraryBlob(user.id);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load library.' });
    }

    return { username: user.email, library: JSON.stringify(library) };
});
