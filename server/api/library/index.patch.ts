const ALLOWED_FIELDS = [
    'total_unit',
    'item_unit',
    'show_sidebar',
    'currency_symbol',
    'default_list_id',
    'opt_images',
    'opt_price',
    'opt_worn',
    'opt_consumable',
    'opt_list_description',
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, message: 'Please log in.' });
    }

    const body = await readBody(event);
    const updates: Partial<Record<AllowedField, unknown>> = {};
    for (const field of ALLOWED_FIELDS) {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    }

    if (!Object.keys(updates).length) {
        throw createError({ statusCode: 400, message: 'No changes requested.' });
    }

    let result;
    try {
        result = await updateLibrarySettings(user.id, updates as any);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to update library settings.' });
    }

    return { settings: result };
});
