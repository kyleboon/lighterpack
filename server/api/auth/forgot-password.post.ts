import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const bcrypt = _require('bcryptjs');
const crypto = _require('crypto');
const FormData = _require('form-data');
const config = _require('config');

let mg: any;
if (config.get('mailgunAPIKey')) {
    const Mailgun = _require('mailgun.js');
    mg = new Mailgun(FormData).client({ username: 'api', key: config.get('mailgunAPIKey') });
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const username = String(body.username ?? '').toLowerCase().trim();

    if (!username || username.length < 1 || username.length > 32) {
        setResponseStatus(event, 400);
        return { errors: [{ message: 'Please enter a username.' }] };
    }

    const users = await getDb().collection('users').find({ username }).toArray();
    if (!users.length) {
        setResponseStatus(event, 500);
        return { message: 'An error occurred.' };
    }

    const user = users[0];
    const newPassword = crypto.randomBytes(12).toString('hex');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    const message = `Hello ${username},\n Apparently you forgot your password. Here's your new one: \n\n Username: ${username}\n Password: ${newPassword}\n\n If you continue to have problems, please reply to this email with details.\n\n Thanks!`;

    if (mg) {
        const response = await mg.messages.create(config.get('mailgunDomain'), {
            from: 'LighterPack <info@mg.lighterpack.com>',
            to: user.email,
            'h:Reply-To': 'LighterPack <info@lighterpack.com>',
            subject: 'Your new LighterPack password',
            text: message,
        });
        console.log({ message: 'Message sent', response: response.message });
    } else {
        console.log({ message: 'Mailgun not configured, skipping email', username });
    }

    await upsertUser(user);
    console.log({ message: 'password changed for user', username });
    return { username };
});
