import { and, eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const body = await readBody(event);
    const listId = Number(body.list_id);
    if (!listId) {
        setResponseStatus(event, 400);
        return { errors: [{ message: 'list_id is required.' }] };
    }

    const db = getDb();

    // Verify list belongs to user
    const lists = await db
        .select({ id: schema.lists.id })
        .from(schema.lists)
        .where(and(eq(schema.lists.id, listId), eq(schema.lists.user_id, user.id)));

    if (!lists.length) {
        setResponseStatus(event, 404);
        return { errors: [{ message: 'List not found.' }] };
    }

    const existing = await db
        .select({ sort_order: schema.categories.sort_order })
        .from(schema.categories)
        .where(eq(schema.categories.list_id, listId))
        .orderBy(schema.categories.sort_order);

    const maxSort = existing.length ? Math.max(...existing.map((c) => c.sort_order ?? 0)) : -1;

    const [category] = await db
        .insert(schema.categories)
        .values({
            user_id: user.id,
            list_id: listId,
            name: String(body.name ?? ''),
            sort_order: maxSort + 1,
        })
        .returning();

    return category;
});
