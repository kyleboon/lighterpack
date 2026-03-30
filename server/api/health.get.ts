import { sql } from 'drizzle-orm';
import { getDb } from '../db.js';

export default defineEventHandler((event) => {
    try {
        const db = getDb();
        db.run(sql`SELECT 1`);
        return { status: 'ok' };
    } catch {
        setResponseStatus(event, 503);
        return { status: 'error', message: 'Database unavailable' };
    }
});
