import { eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';
import { generateUniqueExternalId } from '../../utils/library.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const body = await readBody(event);
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const externalId = await generateUniqueExternalId();

    const existingLists = await db
        .select({ sort_order: schema.lists.sort_order })
        .from(schema.lists)
        .where(eq(schema.lists.user_id, user.id))
        .orderBy(schema.lists.sort_order);

    const maxSort = existingLists.length ? Math.max(...existingLists.map((l) => l.sort_order ?? 0)) : -1;

    const [list] = await db
        .insert(schema.lists)
        .values({
            user_id: user.id,
            name: String(body.name ?? ''),
            description: String(body.description ?? ''),
            external_id: externalId,
            sort_order: maxSort + 1,
            created_at: now,
        })
        .returning();

    return list;
});
