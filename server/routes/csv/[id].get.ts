import { eq } from 'drizzle-orm';
import * as schema from '../../schema.js';
import { getDb } from '../../db.js';
import { buildLibraryBlob } from '../../utils/library.js';
import dataTypes from '#shared/dataTypes';
import { MgToWeight } from '#shared/utils/weight';
import type { WeightUnit } from '#shared/types';

const { Library } = dataTypes;

const fullUnits: Record<string, string> = {
    oz: 'ounce',
    lb: 'pound',
    g: 'gram',
    kg: 'kilogram',
};

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({ statusCode: 400, message: 'No list specified!' });
    }

    const db = getDb();

    let lists;
    try {
        lists = await db.select().from(schema.lists).where(eq(schema.lists.external_id, id));
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to look up list.' });
    }

    if (!lists.length) {
        throw createError({ statusCode: 400, message: 'Invalid list specified.' });
    }

    const dbList = lists[0]!;

    let libraryBlob;
    try {
        libraryBlob = await buildLibraryBlob(dbList.user_id);
    } catch (err) {
        throw createError({ statusCode: 500, message: 'Failed to load library data.' });
    }

    const library = new Library();
    library.load(libraryBlob);

    let list: any = null;
    for (const l of library.lists) {
        if (l.externalId && l.externalId == id) {
            library.defaultListId = l.id;
            list = l;
            break;
        }
    }

    if (!list) {
        throw createError({ statusCode: 404, message: 'List not found.' });
    }

    let out = 'Item Name,Category,desc,qty,weight,unit,url,price,worn,consumable\n';

    for (const categoryId of list.categoryIds) {
        const category = library.getCategoryById(categoryId);
        if (category) {
            for (const categoryItem of category.categoryItems) {
                if (categoryItem) {
                    const item = library.getItemById(categoryItem.itemId);
                    const itemRow = [
                        item.name,
                        category.name,
                        item.description,
                        `${categoryItem.qty}`,
                        `${MgToWeight(item.weight, item.authorUnit as WeightUnit)}`,
                        fullUnits[item.authorUnit] ?? item.authorUnit,
                        item.url,
                        `${item.price}`,
                        categoryItem.worn ? 'Worn' : '',
                        categoryItem.consumable ? 'Consumable' : '',
                    ];

                    for (let k = 0; k < itemRow.length; k++) {
                        const field = itemRow[k];
                        if (k > 0) out += ',';
                        if (typeof field === 'string' && field.indexOf(',') > -1) {
                            out += `"${field.replace(/"/g, '""')}"`;
                        } else {
                            out += field;
                        }
                    }
                    out += '\n';
                }
            }
        }
    }

    let filename = list.name || id;
    filename = filename.replace(/[^a-z0-9-]/gi, '_');

    setResponseHeader(event, 'Content-Type', 'text/csv');
    setResponseHeader(event, 'Content-Disposition', `attachment;filename=${filename}.csv`);
    return out;
});
