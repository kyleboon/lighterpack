export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const library = await buildLibraryBlob(user.id);
    return { username: user.email, library: JSON.stringify(library) };
});
