import config from 'config';
import { initDb } from '../db.js';

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

    if (!config.get<string>('mailgunAPIKey')) {
        console.warn('[config] mailgunAPIKey is not set — magic link emails will be logged to console instead of sent');
    }
}

// Initialise the SQLite connection and validate config when the Nitro server starts.
export default defineNitroPlugin(() => {
    validateConfig();
    const dbPath = process.env.DATABASE_PATH ?? config.get<string>('databasePath') ?? './data/lighterpack.db';
    initDb(dbPath);
});
