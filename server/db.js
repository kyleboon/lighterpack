const { MongoClient } = require('mongodb');
const config = require('config');

let client = null;
let db = null;

async function connect() {
    const uri = config.get('databaseUrl');
    client = new MongoClient(uri);
    await client.connect();
    const dbName = new URL(uri).pathname.replace(/^\//, '');
    db = client.db(dbName);
}

function getDb() {
    if (!db) throw new Error('Database not connected. Call connect() first.');
    return db;
}

/**
 * Mirrors mongojs save() semantics:
 * - If doc has an _id, replace the full document in place.
 * - If doc has no _id, insert and attach the generated _id back onto the object.
 */
async function upsertUser(user) {
    const users = getDb().collection('users');
    if (user._id) {
        await users.replaceOne({ _id: user._id }, user, { upsert: true });
    } else {
        const result = await users.insertOne(user);
        user._id = result.insertedId;
    }
    return user;
}

async function close() {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}

module.exports = { connect, getDb, upsertUser, close };
