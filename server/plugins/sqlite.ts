import config from 'config';
import { initDb, closeDb } from '../db.js';
import { logger } from '../utils/logger.js';

function validateConfig() {
    const required = ['betterAuthSecret', 'betterAuthBaseURL', 'betterAuthTrustedOrigins'];
    const missing = required.filter((key) => {
        const value = config.get(key);
        if (Array.isArray(value)) return value.length === 0;
        return !value;
    });

    if (missing.length) {
        throw new Error(`Missing required config values: ${missing.join(', ')}`);
    }

    if (!config.get<string>('resendAPIKey')) {
        logger.warn('resendAPIKey not set — magic link emails will be logged to console');
    }
}

// Initialise the SQLite connection and validate config when the Nitro server starts.
// The close hook runs on SIGTERM/SIGINT to cleanly shut down the database.
export default defineNitroPlugin((nitroApp) => {
    validateConfig();
    const dbPath = process.env.DATABASE_PATH ?? config.get<string>('databasePath') ?? './data/baseweight.db';
    initDb(dbPath);

    nitroApp.hooks.hook('close', () => {
        logger.info('shutting down — closing database connection');
        closeDb();
    });
});
