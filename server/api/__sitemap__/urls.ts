import { getDb } from '../../db.js';
import * as schema from '../../schema.js';

export default defineSitemapEventHandler(async () => {
    const db = getDb();

    const allLists = await db
        .select({ externalId: schema.lists.external_id })
        .from(schema.lists);

    const shareUrls = allLists.map((row) => ({
        loc: `/r/${row.externalId}`,
        changefreq: 'weekly' as const,
    }));

    return [
        {
            loc: '/welcome',
            changefreq: 'monthly' as const,
            priority: 1.0,
        },
        ...shareUrls,
    ];
});
