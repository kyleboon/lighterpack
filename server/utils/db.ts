import { getDb } from '../db.js';
export { getDb };

import { eq } from 'drizzle-orm';
import * as schema from '../schema.js';

// ---------------------------------------------------------------------------
// Library settings helpers
// ---------------------------------------------------------------------------

export async function getLibrarySettings(userId: string) {
    const db = getDb();
    const rows = await db.select().from(schema.library_settings).where(eq(schema.library_settings.user_id, userId));
    return rows[0] ?? null;
}

export async function createLibrarySettings(userId: string) {
    const db = getDb();
    const result = await db.insert(schema.library_settings).values({ user_id: userId }).returning();
    return result[0]!;
}

export async function updateLibrarySettings(
    userId: string,
    data: Partial<typeof schema.library_settings.$inferInsert>,
) {
    const db = getDb();
    const result = await db
        .update(schema.library_settings)
        .set(data)
        .where(eq(schema.library_settings.user_id, userId))
        .returning();
    return result[0] ?? null;
}
