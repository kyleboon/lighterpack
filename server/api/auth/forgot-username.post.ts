import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const FormData = _require('form-data');
const config = _require('config');

let mg: any;
if (config.get('mailgunAPIKey')) {
    const Mailgun = _require('mailgun.js');
    mg = new Mailgun(FormData).client({ username: 'api', key: config.get('mailgunAPIKey') });
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const email = String(body.email ?? '').toLowerCase().trim();

    if (!email || email.length < 1) {
        setResponseStatus(event, 400);
        return { errors: [{ message: 'Please enter a valid email.' }] };
    }

    const users = await getDb().collection('users').find({ email }).toArray();
    if (!users.length) {
        setResponseStatus(event, 400);
        return { message: 'An error occurred' };
    }

    const { username } = users[0];
    const message = `Hello ${username},\n Apparently you forgot your username. Here it is: \n\n Username: ${username}\n\n If you continue to have problems, please reply to this email with details.\n\n Thanks!`;

    if (mg) {
        const response = await mg.messages.create(config.get('mailgunDomain'), {
            from: 'LighterPack <info@mg.lighterpack.com>',
            to: email,
            'h:Reply-To': 'LighterPack <info@lighterpack.com>',
            subject: 'Your LighterPack username',
            text: message,
        });
        console.log({ message: 'Message sent', response: response.message });
    } else {
        console.log({ message: 'Mailgun not configured, skipping email', email, username });
    }

    return { email };
});
