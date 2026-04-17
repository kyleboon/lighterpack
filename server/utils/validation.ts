import { z } from 'zod';
import type { H3Event } from 'h3';

/**
 * Reads and validates the request body against a zod schema.
 * Throws a 400 error with structured per-field validation errors on failure.
 */
export async function readValidatedBody<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.infer<T>> {
    const body = await readBody(event);
    const result = schema.safeParse(body);
    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field: issue.path.join('.') || undefined,
            message: issue.message,
        }));
        throw createError({
            statusCode: 400,
            message: 'Validation failed.',
            data: { errors },
        });
    }
    return result.data;
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const WEIGHT_UNITS = ['oz', 'lb', 'g', 'kg'] as const;
const ENTITY_TYPES = ['item', 'category', 'list'] as const;

/** Non-negative number (coerced from string-like input). */
const nonNegativeNumber = z.coerce.number().min(0, 'Must be zero or greater');

/** Positive integer (coerced). */
const positiveInt = z.coerce.number().int().min(1);

/** Non-negative integer (coerced). */
const nonNegativeInt = z.coerce.number().int().min(0, 'Must be zero or greater');

/** Weight unit enum. */
const weightUnit = z.enum(WEIGHT_UNITS, { message: `Unit must be one of: ${WEIGHT_UNITS.join(', ')}` });

/** Entity type enum. */
export const entityType = z.enum(ENTITY_TYPES, { message: `entityType must be one of: ${ENTITY_TYPES.join(', ')}` });

/** Short text field (e.g. names, currency symbols). */
const shortText = (maxLen: number) => z.string().max(maxLen, `Must be ${maxLen} characters or fewer`);

/** Long text field (e.g. descriptions, URLs). */
const longText = (maxLen: number) => z.string().max(maxLen, `Must be ${maxLen} characters or fewer`);

// ---------------------------------------------------------------------------
// Route schemas
// ---------------------------------------------------------------------------

/** POST /api/categories/[id]/items — create an item */
export const createItemSchema = z.object({
    global_item_id: z.coerce.number().int().nullable().optional(),
    name: shortText(255).default(''),
    description: longText(10000).default(''),
    weight: nonNegativeNumber.default(0),
    author_unit: weightUnit.default('oz'),
    price: nonNegativeNumber.default(0),
    url: longText(2048).default(''),
    qty: positiveInt.default(1),
    worn: z
        .union([z.boolean(), z.number()])
        .transform((v) => (v ? 1 : 0))
        .default(0),
    consumable: z
        .union([z.boolean(), z.number()])
        .transform((v) => (v ? 1 : 0))
        .default(0),
    star: nonNegativeInt.max(3).default(0),
});

/** PATCH /api/categories/[id]/items/[itemId] — update an item (all fields optional) */
export const updateItemSchema = z
    .object({
        name: shortText(255).optional(),
        description: longText(10000).optional(),
        weight: nonNegativeNumber.optional(),
        author_unit: weightUnit.optional(),
        price: nonNegativeNumber.optional(),
        url: longText(2048).optional(),
        qty: positiveInt.optional(),
        worn: z
            .union([z.boolean(), z.number()])
            .transform((v) => (v ? 1 : 0))
            .optional(),
        consumable: z
            .union([z.boolean(), z.number()])
            .transform((v) => (v ? 1 : 0))
            .optional(),
        star: nonNegativeInt.max(3).optional(),
        sort_order: nonNegativeInt.optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'No changes requested.',
    });

/** POST /api/lists — create a list */
export const createListSchema = z.object({
    name: shortText(255).default(''),
    description: longText(10000).default(''),
});

/** PATCH /api/lists/[id] — update a list */
export const updateListSchema = z
    .object({
        name: shortText(255).optional(),
        description: longText(10000).optional(),
        sort_order: nonNegativeInt.optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'No changes requested.',
    });

/** POST /api/categories — create a category */
export const createCategorySchema = z.object({
    list_id: z.coerce.number().int().min(1, 'list_id is required.'),
    name: shortText(255).default(''),
});

/** PATCH /api/categories/[id] — update a category */
export const updateCategorySchema = z
    .object({
        name: shortText(255).optional(),
        sort_order: nonNegativeInt.optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'No changes requested.',
    });

/** PATCH /api/library — update library settings */
export const updateLibrarySettingsSchema = z
    .object({
        total_unit: weightUnit.optional(),
        item_unit: weightUnit.optional(),
        show_sidebar: nonNegativeInt.max(1).optional(),
        currency_symbol: shortText(5).optional(),
        default_list_id: z.coerce.number().int().positive().nullable().optional(),
        opt_images: nonNegativeInt.max(1).optional(),
        opt_price: nonNegativeInt.max(1).optional(),
        opt_worn: nonNegativeInt.max(1).optional(),
        opt_consumable: nonNegativeInt.max(1).optional(),
        opt_list_description: nonNegativeInt.max(1).optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'No changes requested.',
    });

/** POST /api/library/copy-list */
export const copyListSchema = z.object({
    externalId: z.string().min(1, 'externalId is required').max(255),
});

/** POST /api/account/delete */
export const deleteAccountSchema = z.object({
    email: z.string().email('A valid email is required.'),
});

/** POST /api/images/reorder */
export const reorderImagesSchema = z
    .array(
        z.object({
            id: z.number().int().positive(),
            sort_order: z.number().int().min(0),
        }),
    )
    .min(1, 'At least one entry is required.');

/** POST /api/images/url */
export const addImageUrlSchema = z.object({
    entityType,
    entityId: z.number().int().positive('Invalid entityId.'),
    url: z.string().min(1, 'URL is required.').max(2048, 'URL must be 2048 characters or fewer.'),
});
