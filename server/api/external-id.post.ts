import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const crypto = _require('crypto');

function generateId(alphabet: string, size: number): string {
    const bytes = crypto.randomBytes(size * 2);
    return Array.from(bytes as Uint8Array)
        .map((b: number) => alphabet[b % alphabet.length])
        .join('')
        .slice(0, size);
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    let id: string;
    while (true) {
        id = generateId('1234567890abcdefghijklmnopqrstuvwxyz', 6);
        const existing = await getDb().collection('users').find({ 'library.lists.externalId': id }).toArray();
        if (!existing.length) break;
    }

    if (!user.externalIds) user.externalIds = [id];
    else user.externalIds.push(id);

    await upsertUser(user);
    console.log({ message: 'Id saved', id, username: user.username });
    return { externalId: id };
});
