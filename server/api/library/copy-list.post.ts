import { eq, count } from 'drizzle-orm';
import config from 'config';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';
import { generateUniqueExternalId } from '../../utils/library.js';
import { readValidatedBody, copyListSchema } from '../../utils/validation.js';

const MAX_ITEMS = config.get<number>('maxItemsPerUser');

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Authentication required' });
    }

    const body = await readValidatedBody(event, copyListSchema);
    const { externalId } = body;

    const db = getDb();

    // Find the source list
    const sourceLists = db.select().from(schema.lists).where(eq(schema.lists.external_id, externalId)).all();
    if (!sourceLists.length) {
        throw createError({ statusCode: 404, message: 'List not found' });
    }
    const sourceList = sourceLists[0]!;

    // Verify the authenticated user owns the source list
    if (sourceList.user_id !== user.id) {
        throw createError({ statusCode: 403, message: 'You do not have permission to copy this list' });
    }

    // Count how many items the copy would add
    const sourceItemCount = db
        .select()
        .from(schema.category_items)
        .innerJoin(schema.categories, eq(schema.category_items.category_id, schema.categories.id))
        .where(eq(schema.categories.list_id, sourceList.id))
        .all().length;

    const [{ currentTotal }] = db
        .select({ currentTotal: count() })
        .from(schema.category_items)
        .where(eq(schema.category_items.user_id, user.id))
        .all();

    if (currentTotal + sourceItemCount > MAX_ITEMS) {
        throw createError({
            statusCode: 400,
            message: `Copying this list would exceed the maximum of ${MAX_ITEMS} items. You currently have ${currentTotal} items and this list contains ${sourceItemCount}.`,
        });
    }

    const now = Math.floor(Date.now() / 1000);

    let newList;
    try {
        newList = db.transaction((tx) => {
            // Create new list for the authenticated user
            const newExternalId = generateUniqueExternalId(tx);
            const [created] = tx
                .insert(schema.lists)
                .values({
                    user_id: user.id,
                    name: sourceList.name || '',
                    description: sourceList.description || '',
                    external_id: newExternalId,
                    sort_order: 0,
                    created_at: now,
                })
                .returning()
                .all();

            // Copy categories and their items
            const sourceCategories = tx
                .select()
                .from(schema.categories)
                .where(eq(schema.categories.list_id, sourceList.id))
                .all();

            for (const sourceCat of sourceCategories) {
                const [newCat] = tx
                    .insert(schema.categories)
                    .values({
                        user_id: user.id,
                        list_id: created.id,
                        name: sourceCat.name || '',
                        sort_order: sourceCat.sort_order ?? 0,
                    })
                    .returning()
                    .all();

                // Copy items in this category
                const sourceItems = tx
                    .select()
                    .from(schema.category_items)
                    .where(eq(schema.category_items.category_id, sourceCat.id))
                    .all();

                for (const sourceItem of sourceItems) {
                    tx.insert(schema.category_items)
                        .values({
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
                        })
                        .run();
                }
            }

            return created;
        });
    } catch (err) {
        if ((err as any)?.statusCode) throw err;
        throw createError({ statusCode: 500, message: 'Failed to copy list.' });
    }

    return { listId: newList.id };
});
