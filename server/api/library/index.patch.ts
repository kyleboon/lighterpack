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
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const body = await readBody(event);
    const updates: Partial<Record<AllowedField, unknown>> = {};
    for (const field of ALLOWED_FIELDS) {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    }

    if (!Object.keys(updates).length) {
        setResponseStatus(event, 400);
        return { errors: [{ message: 'No changes requested.' }] };
    }

    const result = await updateLibrarySettings(user.id, updates as any);
    return { settings: result };
});
