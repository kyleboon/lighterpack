import { createRequire } from 'module';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { resolve } from 'path';
import { readdirSync } from 'node:fs';
import * as schema from './schema.js';
import { createChildLogger } from './utils/logger.js';

const log = createChildLogger({ module: 'db' });

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
    if (!_db) throw new Error('Database not initialized. Call initDb() first.');
    return _db;
}

export function initDb(dbPath: string) {
    // Use process.argv[1] (the server entry point) as the require base so that
    // native modules are resolved from the actual output directory rather than
    // the "file:///_entry.js" fallback URL Nitro uses during module evaluation.
    const _require = createRequire(process.argv[1]);
    const BetterSqlite3 = _require('better-sqlite3') as typeof import('better-sqlite3');

    // Resolve migrations relative to the project root (works in both dev and production).
    const migrationsFolder = resolve(process.cwd(), 'drizzle/migrations');
    log.debug({ migrationsFolder }, 'migrations folder');
    try {
        log.debug({ files: readdirSync(migrationsFolder) }, 'migration files');
    } catch (e) {
        log.warn({ err: e }, 'could not read migrations folder');
    }

    const sqlite = new BetterSqlite3(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('busy_timeout = 5000');
    sqlite.pragma('cache_size = -20000');
    sqlite.pragma('temp_store = MEMORY');

    _db = drizzle(sqlite, { schema });
    try {
        migrate(_db, { migrationsFolder });
        log.info('migrations complete');
    } catch (e) {
        log.error({ err: e }, 'migration error');
        throw e;
    }

    log.info({ path: dbPath }, 'database initialized');
    return _db;
}
