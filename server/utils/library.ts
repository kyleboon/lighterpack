import { randomBytes } from 'node:crypto';
import { getDb } from '../db.js';
import { eq, inArray } from 'drizzle-orm';
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import * as schema from '../schema.js';

// ---------------------------------------------------------------------------
// External ID generation
// ---------------------------------------------------------------------------

function generateExternalId(): string {
    const alphabet = '1234567890abcdefghijklmnopqrstuvwxyz';
    const bytes = randomBytes(12);
    return Array.from(bytes)
        .map((b: number) => alphabet[b % alphabet.length])
        .join('')
        .slice(0, 6);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbOrTx = ReturnType<typeof getDb> | SQLiteTransaction<'sync', any, any, any>;

export function generateUniqueExternalId(tx?: DbOrTx): string {
    const conn = tx ?? getDb();
    while (true) {
        const id = generateExternalId();
        const existing = conn.select().from(schema.lists).where(eq(schema.lists.external_id, id)).all();
        if (!existing.length) return id;
    }
}

// ---------------------------------------------------------------------------
// New-user library initialisation
// ---------------------------------------------------------------------------

export function initNewUserLibrary(userId: string) {
    const db = getDb();

    try {
        db.transaction((tx) => {
            const now = Math.floor(Date.now() / 1000);

            tx.insert(schema.library_settings).values({ user_id: userId }).run();

            const externalId = generateUniqueExternalId(tx);
            const [list] = tx
                .insert(schema.lists)
                .values({ user_id: userId, name: '', external_id: externalId, sort_order: 0, created_at: now })
                .returning()
                .all();

            tx.update(schema.library_settings)
                .set({ default_list_id: list.id })
                .where(eq(schema.library_settings.user_id, userId))
                .run();

            const [category] = tx
                .insert(schema.categories)
                .values({ user_id: userId, list_id: list.id, name: '', sort_order: 0 })
                .returning()
                .all();

            tx.insert(schema.category_items).values({ category_id: category.id, user_id: userId, sort_order: 0 }).run();
        });
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to initialize user library.' });
    }
}

// ---------------------------------------------------------------------------
// Library blob serialisation
// ---------------------------------------------------------------------------

export async function buildLibraryBlob(userId: string) {
    const db = getDb();

    let settingsRows;
    try {
        settingsRows = await db
            .select()
            .from(schema.library_settings)
            .where(eq(schema.library_settings.user_id, userId));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load library settings.' });
    }
    const settings = settingsRows[0] ?? {
        total_unit: 'oz',
        item_unit: 'oz',
        show_sidebar: 0,
        currency_symbol: '$',
        default_list_id: null,
        opt_images: 0,
        opt_price: 0,
        opt_worn: 1,
        opt_consumable: 1,
        opt_list_description: 0,
    };

    let dbLists;
    try {
        dbLists = await db
            .select()
            .from(schema.lists)
            .where(eq(schema.lists.user_id, userId))
            .orderBy(schema.lists.sort_order);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load lists.' });
    }

    if (!dbLists.length) {
        // No data yet — return a minimal blank library
        return buildBlankBlob();
    }

    const listIds = dbLists.map((l) => l.id);

    let dbCategories;
    try {
        dbCategories = await db
            .select()
            .from(schema.categories)
            .where(inArray(schema.categories.list_id, listIds))
            .orderBy(schema.categories.sort_order);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load categories.' });
    }

    const categoryIds = dbCategories.map((c) => c.id);

    let dbItems;
    try {
        dbItems = categoryIds.length
            ? await db
                  .select()
                  .from(schema.category_items)
                  .where(inArray(schema.category_items.category_id, categoryIds))
                  .orderBy(schema.category_items.sort_order)
            : [];
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load items.' });
    }

    let dbImages;
    try {
        dbImages = await db
            .select()
            .from(schema.images)
            .where(eq(schema.images.user_id, userId))
            .orderBy(schema.images.sort_order);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load images.' });
    }

    // Build lookup: "item:123" -> [{id, url, sort_order}, ...]
    const imagesByKey: Record<string, { id: number; url: string; sort_order: number }[]> = {};
    for (const img of dbImages) {
        const key = `${img.entity_type}:${img.entity_id}`;
        if (!imagesByKey[key]) imagesByKey[key] = [];
        imagesByKey[key].push({
            id: img.id,
            url: img.is_local ? `/uploads/${img.filename}` : img.filename,
            sort_order: img.sort_order ?? 0,
        });
    }

    // Build items array — each category_item becomes a library item with id = category_item.id
    const items = dbItems.map((ci) => ({
        id: ci.id,
        name: ci.name ?? '',
        description: ci.description ?? '',
        weight: ci.weight ?? 0,
        authorUnit: ci.author_unit ?? 'oz',
        price: ci.price ?? 0,
        url: ci.url ?? '',
        images: imagesByKey[`item:${ci.id}`] ?? [],
    }));

    // Build categories with categoryItems referencing item IDs
    const categories = dbCategories.map((cat) => ({
        id: cat.id,
        name: cat.name ?? '',
        images: imagesByKey[`category:${cat.id}`] ?? [],
        categoryItems: dbItems
            .filter((ci) => ci.category_id === cat.id)
            .map((ci) => ({
                itemId: ci.id,
                qty: ci.qty ?? 1,
                worn: ci.worn ?? 0,
                consumable: (ci.consumable ?? 0) === 1,
                star: ci.star ?? 0,
            })),
    }));

    // Build lists
    const listsData = dbLists.map((list) => ({
        id: list.id,
        name: list.name ?? '',
        description: list.description ?? '',
        externalId: list.external_id,
        images: imagesByKey[`list:${list.id}`] ?? [],
        categoryIds: dbCategories.filter((cat) => cat.list_id === list.id).map((cat) => cat.id),
    }));

    // Compute a safe sequence value above all used IDs
    const maxId = Math.max(
        0,
        ...dbItems.map((i) => i.id),
        ...dbCategories.map((c) => c.id),
        ...dbLists.map((l) => l.id),
    );

    return {
        version: '0.3',
        totalUnit: settings.total_unit ?? 'oz',
        itemUnit: settings.item_unit ?? 'oz',
        defaultListId:
            settings.default_list_id != null && listsData.some((l) => l.id === settings.default_list_id)
                ? settings.default_list_id
                : (listsData[0]?.id ?? 0),
        sequence: maxId + 100,
        showSidebar: settings.show_sidebar === 1,
        optionalFields: {
            images: settings.opt_images === 1,
            price: settings.opt_price === 1,
            worn: settings.opt_worn === 1,
            consumable: settings.opt_consumable === 1,
            listDescription: settings.opt_list_description === 1,
        },
        currencySymbol: settings.currency_symbol ?? '$',
        items,
        categories,
        lists: listsData,
    };
}

function buildBlankBlob() {
    return {
        version: '0.3',
        totalUnit: 'oz',
        itemUnit: 'oz',
        defaultListId: 0,
        sequence: 1,
        showSidebar: false,
        optionalFields: { images: false, price: false, worn: true, consumable: true, listDescription: false },
        currencySymbol: '$',
        items: [],
        categories: [],
        lists: [],
    };
}
