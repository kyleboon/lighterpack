// Re-export the MongoDB helper from the legacy CJS module so Nitro API routes
// can import it with a clean TypeScript path.
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const { getDb, upsertUser } = _require('../db.js');

export { getDb, upsertUser };
