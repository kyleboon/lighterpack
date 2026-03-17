// Initialise the MongoDB connection once when the Nitro server starts.
// The existing server/db.js singleton is reused by all API routes via
// server/utils/db.ts.
export default defineNitroPlugin(async () => {
    const { connect } = await import('../db.js');
    await connect();
});
