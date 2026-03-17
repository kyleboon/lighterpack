import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const bcrypt = _require('bcryptjs');
const config = _require('config');

/** Look up a user by username and verify their bcrypt password. Throws on failure. */
export async function verifyPassword(username: string, password: string) {
    let users: any[];
    try {
        users = await getDb().collection('users').find({ username }).toArray();
    } catch {
        throw { code: 500, message: 'An error occurred, please try again later.' };
    }

    if (!users?.length) {
        throw { code: 404, message: 'Invalid username and/or password.' };
    }

    const user = users[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
        throw { code: 404, message: 'Invalid username and/or password.' };
    }
    return user;
}

export function isModerator(username: string): boolean {
    const moderatorList: string[] = config.get('moderators') || [];
    return moderatorList.includes(username);
}
