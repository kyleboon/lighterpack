import { eq, and, inArray } from 'drizzle-orm';
import { getDb } from '../../db.js';
import * as schema from '../../schema.js';

interface ReorderEntry {
    id: number;
    sort_order: number;
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const body = (await readBody(event)) as ReorderEntry[];

    if (!Array.isArray(body) || body.some((e) => typeof e.id !== 'number' || typeof e.sort_order !== 'number')) {
        setResponseStatus(event, 400);
        return { message: 'Body must be an array of { id, sort_order }.' };
    }

    const ids = body.map((e) => e.id);
    const db = getDb();

    // Verify all images belong to the user
    const owned = await db
        .select({ id: schema.images.id })
        .from(schema.images)
        .where(and(inArray(schema.images.id, ids), eq(schema.images.user_id, user.id)));

    if (owned.length !== ids.length) {
        setResponseStatus(event, 403);
        return { message: 'One or more images not found.' };
    }

    // Update each sort_order individually (SQLite has no multi-row update shorthand)
    for (const entry of body) {
        await db.update(schema.images).set({ sort_order: entry.sort_order }).where(eq(schema.images.id, entry.id));
    }

    return { ok: true };
});
