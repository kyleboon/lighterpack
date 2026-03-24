import { and, eq } from 'drizzle-orm';
import * as schema from '../../../../schema.js';
import { getDb } from '../../../../db.js';

const ITEM_FIELDS = [
    'name',
    'description',
    'weight',
    'author_unit',
    'price',
    'url',
    'qty',
    'worn',
    'consumable',
    'star',
    'sort_order',
] as const;

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const categoryId = Number(getRouterParam(event, 'id'));
    const itemId = Number(getRouterParam(event, 'itemId'));
    if (!categoryId || !itemId) {
        setResponseStatus(event, 400);
        return { errors: [{ message: 'Invalid id.' }] };
    }

    const body = await readBody(event);
    const updates: Partial<typeof schema.category_items.$inferInsert> = {};

    for (const field of ITEM_FIELDS) {
        if (body[field] === undefined) continue;
        if (field === 'weight' || field === 'price') {
            (updates as any)[field] = Number(body[field]);
        } else if (field === 'worn' || field === 'consumable') {
            (updates as any)[field] = body[field] ? 1 : 0;
        } else if (field === 'qty' || field === 'star' || field === 'sort_order') {
            (updates as any)[field] = Number(body[field]);
        } else {
            (updates as any)[field] = String(body[field]);
        }
    }

    if (!Object.keys(updates).length) {
        setResponseStatus(event, 400);
        return { errors: [{ message: 'No changes requested.' }] };
    }

    const db = getDb();
    const [updated] = await db
        .update(schema.category_items)
        .set(updates)
        .where(
            and(
                eq(schema.category_items.id, itemId),
                eq(schema.category_items.category_id, categoryId),
                eq(schema.category_items.user_id, user.id),
            ),
        )
        .returning();

    if (!updated) {
        setResponseStatus(event, 404);
        return { errors: [{ message: 'Item not found.' }] };
    }

    return updated;
});
