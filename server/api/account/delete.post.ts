import { eq } from 'drizzle-orm';
import { getDb } from '../../db.js';
import * as schema from '../../schema.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const body = await readBody(event);

    if (body.email !== user.email) {
        throw createError({ statusCode: 400, message: 'Email does not match your account.' });
    }

    const db = getDb();
    try {
        await db.delete(schema.user).where(eq(schema.user.id, user.id));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to delete account.' });
    }

    event.context.logger.info({ email: user.email }, 'account deleted');
    return { message: 'success' };
});
