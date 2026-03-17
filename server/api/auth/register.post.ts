import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const bcrypt = _require('bcryptjs');
const crypto = _require('crypto');
const dataTypes = _require('../../../shared/dataTypes.js');

const { Library } = dataTypes;

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    const username = String(body.username ?? '').toLowerCase().trim();
    const password = String(body.password ?? '');
    let email = String(body.email ?? '').trim();

    const errors: any[] = [];

    if (!username) errors.push({ field: 'username', message: 'Please enter a username.' });
    if (username && (username.length < 3 || username.length > 32))
        errors.push({ field: 'username', message: 'Please enter a username between 3 and 32 characters.' });
    if (!email) errors.push({ field: 'email', message: 'Please enter an email.' });
    if (!password) errors.push({ field: 'password', message: 'Please enter a password.' });
    if (password && (password.length < 5 || password.length > 60))
        errors.push({ field: 'password', message: 'Please enter a password between 5 and 60 characters.' });

    if (errors.length) {
        setResponseStatus(event, 400);
        return { errors };
    }

    console.log({ message: 'Attempting to register', username });

    const users = getDb().collection('users');

    const existingByUsername = await users.find({ username }).toArray();
    if (existingByUsername.length) {
        setResponseStatus(event, 400);
        return { errors: [{ field: 'username', message: 'That username already exists, please pick a different username.' }] };
    }

    const existingByEmail = await users.find({ email }).toArray();
    if (existingByEmail.length) {
        setResponseStatus(event, 400);
        return { errors: [{ field: 'email', message: 'A user with that email already exists.' }] };
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const token = crypto.randomBytes(48).toString('hex');

    let library;
    if (body.library) {
        try {
            library = JSON.parse(body.library);
        } catch {
            setResponseStatus(event, 400);
            return { errors: [{ message: 'Unable to parse your library. Contact support.' }] };
        }
    } else {
        library = new Library().save();
    }

    const newUser = { username, password: hash, email, token, library, syncToken: 0 };
    console.log({ message: 'Saving new user', username });
    await upsertUser(newUser);

    setCookie(event, 'lp', token, {
        path: '/',
        maxAge: 365 * 24 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
    });

    return { username, library: JSON.stringify(newUser.library), syncToken: 0 };
});
