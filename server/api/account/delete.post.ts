import { eq } from 'drizzle-orm';
import { getDb } from '../../db.js';
import * as schema from '../../schema.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const body = await readBody(event);

    if (body.email !== user.email) {
        setResponseStatus(event, 400);
        return { errors: [{ field: 'email', message: 'Email does not match your account.' }] };
    }

    const db = getDb();
    await db.delete(schema.user).where(eq(schema.user.id, user.id));

    console.log({ message: 'Completed account delete', email: user.email });
    return { message: 'success' };
});
