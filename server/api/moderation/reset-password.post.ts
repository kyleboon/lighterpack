import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const bcrypt = _require('bcryptjs');
const crypto = _require('crypto');

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
    console.log({ message: 'MODERATION Reset password start', username });

    const users = await getDb().collection('users').find({ username }).toArray();
    if (!users.length) {
        setResponseStatus(event, 500);
        return { message: 'An error occurred.' };
    }

    const target = users[0];
    const newPassword = crypto.randomBytes(12).toString('hex');
    const salt = await bcrypt.genSalt(10);
    target.password = await bcrypt.hash(newPassword, salt);
    await upsertUser(target);
    console.log({ message: 'MODERATION password changed', username });
    return { newPassword };
});
