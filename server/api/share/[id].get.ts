import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const dataTypes = _require('../../../shared/dataTypes.js');

const { Library } = dataTypes;

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({ statusCode: 400, message: 'No list specified' });
    }

    const db = getDb();
    let users: any[];
    try {
        users = await db.collection('users').find({ 'library.lists.externalId': id }).toArray();
    } catch {
        throw createError({ statusCode: 500, message: 'An error occurred' });
    }

    if (!users.length || !users[0]?.library) {
        throw createError({ statusCode: 404, message: 'List not found' });
    }

    const library = new Library();
    library.load(users[0].library);

    let list = null;
    for (const l of library.lists) {
        if (l.externalId && l.externalId == id) {
            library.defaultListId = l.id;
            list = l;
            break;
        }
    }

    if (!list) {
        throw createError({ statusCode: 404, message: 'List not found' });
    }

    return {
        // Return the raw library JSON — the page reconstructs the Library
        // object on both server and client using shared/dataTypes.js.
        library: users[0].library,
        externalId: id,
    };
});
