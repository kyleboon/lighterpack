import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const bcrypt = _require('bcryptjs');

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const body = await readBody(event);
    console.log({ message: 'Starting account changes', username: user.username });

    let verified: any;
    try {
        verified = await verifyPassword(user.username, String(body.currentPassword ?? ''));
    } catch {
        setResponseStatus(event, 400);
        return { errors: [{ field: 'currentPassword', message: 'Your current password is incorrect.' }] };
    }

    if (body.newPassword) {
        const newPassword = String(body.newPassword);
        if (newPassword.length < 5 || newPassword.length > 60) {
            setResponseStatus(event, 400);
            return { errors: [{ field: 'newPassword', message: 'Please enter a password between 5 and 60 characters.' }] };
        }
        const salt = await bcrypt.genSalt(10);
        verified.password = await bcrypt.hash(newPassword, salt);
        if (body.newEmail) verified.email = String(body.newEmail);
        await upsertUser(verified);
        return { message: 'success' };
    }

    if (body.newEmail) {
        verified.email = String(body.newEmail);
        await upsertUser(verified);
        return { message: 'success' };
    }

    setResponseStatus(event, 400);
    return { errors: [{ message: 'No changes requested.' }] };
});
