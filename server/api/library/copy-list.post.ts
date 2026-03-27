import { eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';
import { generateUniqueExternalId } from '../../utils/library.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Authentication required' });
    }

    const body = await readBody(event);
    const { externalId } = body;

    if (!externalId) {
        throw createError({ statusCode: 400, message: 'externalId is required' });
    }

    const db = getDb();

    // Find the source list
    const sourceLists = await db.select().from(schema.lists).where(eq(schema.lists.external_id, externalId));
    if (!sourceLists.length) {
        throw createError({ statusCode: 404, message: 'List not found' });
    }
    const sourceList = sourceLists[0]!;

    const now = Math.floor(Date.now() / 1000);

    // Create new list for the authenticated user
    const newExternalId = await generateUniqueExternalId();
    const [newList] = await db
        .insert(schema.lists)
        .values({
            user_id: user.id,
            name: sourceList.name || '',
            description: sourceList.description || '',
            external_id: newExternalId,
            sort_order: 0,
            created_at: now,
        })
        .returning();

    // Copy categories and their items
    const sourceCategories = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.list_id, sourceList.id));

    for (const sourceCat of sourceCategories) {
        const [newCat] = await db
            .insert(schema.categories)
            .values({
                user_id: user.id,
                list_id: newList.id,
                name: sourceCat.name || '',
                sort_order: sourceCat.sort_order ?? 0,
            })
            .returning();

        // Copy items in this category
        const sourceItems = await db
            .select()
            .from(schema.category_items)
            .where(eq(schema.category_items.category_id, sourceCat.id));

        for (const sourceItem of sourceItems) {
            await db.insert(schema.category_items).values({
                category_id: newCat.id,
                user_id: user.id,
                name: sourceItem.name || '',
                description: sourceItem.description || '',
                weight: sourceItem.weight ?? 0,
                author_unit: sourceItem.author_unit || 'oz',
                price: sourceItem.price ?? 0,
                url: sourceItem.url || '',
                qty: sourceItem.qty ?? 1,
                worn: sourceItem.worn ?? 0,
                consumable: sourceItem.consumable ?? 0,
                star: sourceItem.star ?? 0,
                sort_order: sourceItem.sort_order ?? 0,
            });
        }
    }

    return { listId: newList.id };
});
