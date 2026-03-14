const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const FormData = require('form-data');

const router = express.Router();
const fs = require('fs');
const axios = require('axios');
const formidable = require('formidable');
const config = require('config');
const { logWithRequest } = require('./log.js');
const { getDb, upsertUser } = require('./db.js');

const { authenticateUser, verifyPassword } = require('./auth.js');

function generateId(alphabet, size) {
    const bytes = crypto.randomBytes(size * 2);
    return Array.from(bytes).map(b => alphabet[b % alphabet.length]).join('').slice(0, size);
}

let mg;

if (config.get('mailgunAPIKey')) {
    const Mailgun = require('mailgun.js');
    const mailgunClient = new Mailgun(FormData);
    mg = mailgunClient.client({ username: 'api', key: config.get('mailgunAPIKey') });
}

const dataTypes = require('../client/dataTypes.js');

const Item = dataTypes.Item;
const Category = dataTypes.Category;
const List = dataTypes.List;
const Library = dataTypes.Library;

router.post('/register', async (req, res) => {
    const username = String(req.body.username).toLowerCase().trim();
    const password = String(req.body.password);
    let email = String(req.body.email);

    const errors = [];

    if (!username) {
        errors.push({ field: 'username', message: 'Please enter a username.' });
    }

    if (username && (username.length < 3 || username.length > 32)) {
        errors.push({ field: 'username', message: 'Please enter a username between 3 and 32 characters.' });
    }

    if (!email) {
        errors.push({ field: 'email', message: 'Please enter an email.' });
    }

    email = email.trim();

    if (!password) {
        errors.push({ field: 'password', message: 'Please enter a password.' });
    }

    if (password && (password.length < 5 || password.length > 60)) {
        errors.push({ field: 'password', message: 'Please enter a password between 5 and 60 characters.' });
    }

    if (errors.length) {
        return res.status(400).json({ errors });
    }

    logWithRequest(req, { message: 'Attempting to register', username });

    try {
        const users = getDb().collection('users');

        const existingByUsername = await users.find({ username }).toArray();
        if (existingByUsername.length) {
            logWithRequest(req, { message: 'User exists', username });
            return res.status(400).json({ errors: [{ field: 'username', message: 'That username already exists, please pick a different username.' }] });
        }

        const existingByEmail = await users.find({ email }).toArray();
        if (existingByEmail.length) {
            logWithRequest(req, { message: 'User email exists', email });
            return res.status(400).json({ errors: [{ field: 'email', message: 'A user with that email already exists.' }] });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const token = crypto.randomBytes(48).toString('hex');

        let library;
        if (req.body.library) {
            try {
                library = JSON.parse(req.body.library);
            } catch (e) {
                logWithRequest(req, { message: 'Library parsing issue', username });
                return res.status(400).json({ errors: [{ message: 'Unable to parse your library. Contact support.' }] });
            }
        } else {
            library = new Library().save();
        }

        const newUser = {
            username,
            password: hash,
            email,
            token,
            library,
            syncToken: 0,
        };
        logWithRequest(req, { message: 'Saving new user', username });
        await upsertUser(newUser);
        const out = { username, library: JSON.stringify(newUser.library), syncToken: 0 };
        res.cookie('lp', token, { path: '/', maxAge: 365 * 24 * 60 * 1000 });
        return res.status(200).json(out);
    } catch (err) {
        logWithRequest(req, { message: 'Error on register', username, err });
        return res.status(500).json({ errors: [{ message: 'An error occurred. Please try again.' }] });
    }
});

router.post('/signin', (req, res) => {
    authenticateUser(req, res, returnLibrary);
});

function returnLibrary(req, res, user) {
    logWithRequest(req, { message: 'signed in', username: user.username });
    if (!user.syncToken) {
        user.syncToken = 0;
        upsertUser(user).catch((err) => logWithRequest(req, { message: 'Error saving syncToken', err }));
    }
    return res.json({ username: user.username, library: JSON.stringify(user.library), syncToken: user.syncToken });
}

router.post('/saveLibrary', (req, res) => {
    authenticateUser(req, res, saveLibrary);
});

async function saveLibrary(req, res, user) {
    if (typeof req.body.syncToken === 'undefined') {
        logWithRequest(req, { message: 'Missing syncToken', username: user.username });
        return res.status(400).send('Please refresh this page to upgrade to the latest version of LighterPack.');
    }
    if (!req.body.username || !req.body.data) {
        logWithRequest(req, { message: 'bad save: missing username or data', username: user.username });
        return res.status(400).json({ message: 'An error occurred while saving your data. Please refresh your browser and try again.' });
    }

    if (req.body.username != user.username) {
        logWithRequest(req, { message: 'bad save: bad username', initatedby: user.username, initiatedfor: req.body.username });
        return res.status(401).json({ message: 'An error occurred while saving your data. Please refresh your browser and login again.' });
    }

    if (req.body.syncToken != user.syncToken) {
        logWithRequest(req, { message: 'out of date syncToken', username: user.username });
        return res.status(400).json({ message: 'Your list is out of date - please refresh your browser.' });
    }

    let library;
    try {
        library = JSON.parse(req.body.data);
    } catch (e) {
        logWithRequest(req, { message: 'Library parsing issue', username: user.username });
        return res.status(400).json({ errors: [{ message: 'An error occurred while saving your data - unable to parse library. If this persists, please contact support.' }] });
    }

    user.library = library;
    user.syncToken++;

    try {
        await upsertUser(user);
        logWithRequest(req, { message: 'saved library', username: user.username });
        return res.status(200).json({ message: 'success', syncToken: user.syncToken });
    } catch (err) {
        logWithRequest(req, { message: 'Error saving library', username: user.username, err });
        return res.status(500).json({ message: 'An error occurred while saving your data. Please try again.' });
    }
}

router.post('/externalId', (req, res) => {
    authenticateUser(req, res, externalId);
});

async function externalId(req, res, user) {
    const id = generateId('1234567890abcdefghijklmnopqrstuvwxyz', 6);
    logWithRequest(req, { message: 'Id generated', id });

    try {
        const users = await getDb().collection('users')
            .find({ 'library.lists.externalId': id })
            .toArray();

        if (!users.length) {
            if (typeof user.externalIds === 'undefined') user.externalIds = [id];
            else user.externalIds.push(id);

            await upsertUser(user);
            logWithRequest(req, { message: 'Id saved', id, username: user.username });
            res.status(200).json({ externalId: id });
        } else {
            logWithRequest(req, { message: 'Id collision detected', id });
            externalId(req, res, user);
        }
    } catch (err) {
        logWithRequest(req, { message: 'Id lookup error', id, err });
        res.status(500).send('An error occurred.');
    }
}

router.post('/forgotPassword', async (req, res) => {
    logWithRequest(req);
    const username = String(req.body.username).toLowerCase().trim();
    if (!username || username.length < 1 || username.length > 32) {
        logWithRequest(req, { message: 'Bad forgot password', username });
        return res.status(400).json({ errors: [{ message: 'Please enter a username.' }] });
    }

    try {
        const users = await getDb().collection('users').find({ username }).toArray();
        if (!users.length) {
            logWithRequest(req, { message: 'Forgot password for unknown user', username });
            return res.status(500).json({ message: 'An error occurred.' });
        }
        const user = users[0];
        const newPassword = crypto.randomBytes(12).toString('hex');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        const email = user.email;

        const message = `Hello ${username},\n Apparently you forgot your password. Here's your new one: \n\n Username: ${username}\n Password: ${newPassword}\n\n If you continue to have problems, please reply to this email with details.\n\n Thanks!`;

        const mailOptions = {
            from: 'LighterPack <info@mg.lighterpack.com>',
            to: email,
            'h:Reply-To': 'LighterPack <info@lighterpack.com>',
            subject: 'Your new LighterPack password',
            text: message,
        };

        logWithRequest(req, { message: 'Attempting to send new password', email });
        const response = await mg.messages.create(config.get('mailgunDomain'), mailOptions);
        await upsertUser(user);
        logWithRequest(req, { message: 'Message sent', response: response.message });
        logWithRequest(req, { message: 'password changed for user', username });
        return res.status(200).json({ username });
    } catch (err) {
        logWithRequest(req, err);
        return res.status(500).json({ message: 'An error occurred' });
    }
});

router.post('/forgotUsername', async (req, res) => {
    logWithRequest(req);
    const email = String(req.body.email).toLowerCase().trim();
    if (!email || email.length < 1) {
        logWithRequest(req, { message: 'Bad forgot username', email });
        return res.status(400).json({ errors: [{ message: 'Please enter a valid email.' }] });
    }

    try {
        const users = await getDb().collection('users').find({ email }).toArray();
        if (!users.length) {
            logWithRequest(req, { message: 'Forgot email for unknown user', email });
            return res.status(400).json({ message: 'An error occurred' });
        }
        const user = users[0];
        const username = user.username;

        const message = `Hello ${username},\n Apparently you forgot your username. Here It is: \n\n Username: ${username}\n\n If you continue to have problems, please reply to this email with details.\n\n Thanks!`;

        const mailOptions = {
            from: 'LighterPack <info@mg.lighterpack.com>',
            to: email,
            'h:Reply-To': 'LighterPack <info@lighterpack.com>',
            subject: 'Your LighterPack username',
            text: message,
        };

        logWithRequest(req, { message: 'Attempting to send username', email, username });
        const response = await mg.messages.create(config.get('mailgunDomain'), mailOptions);
        logWithRequest(req, { message: 'Message sent', response: response.message });
        logWithRequest(req, { message: 'sent username message for user', username, email });
        return res.status(200).json({ email });
    } catch (err) {
        logWithRequest(req, err);
        return res.status(500).json({ message: 'An error occurred' });
    }
});

router.post('/account', (req, res) => {
    authenticateUser(req, res, account);
});

async function account(req, res, user) {
    logWithRequest(req, { message: 'Starting account changes', username: user.username });

    try {
        const verified = await verifyPassword(user.username, String(req.body.currentPassword));

        if (req.body.newPassword) {
            const newPassword = String(req.body.newPassword);
            const errors = [];

            if (newPassword.length < 5 || newPassword.length > 60) {
                errors.push({ field: 'newPassword', message: 'Please enter a password between 5 and 60 characters.' });
            }

            if (errors.length) {
                return res.status(400).json({ errors });
            }

            const salt = await bcrypt.genSalt(10);
            verified.password = await bcrypt.hash(newPassword, salt);
            logWithRequest(req, { message: 'Changing PW', username: verified.username });

            if (req.body.newEmail) {
                verified.email = String(req.body.newEmail);
                logWithRequest(req, { message: 'Changing Email', username: verified.username });
            }

            await upsertUser(verified);
            return res.status(200).json({ message: 'success' });
        } else if (req.body.newEmail) {
            verified.email = String(req.body.newEmail);
            logWithRequest(req, { message: 'Changing Email', username: verified.username });
            await upsertUser(verified);
            return res.status(200).json({ message: 'success' });
        }
    } catch (err) {
        logWithRequest(req, { message: 'Account bad current password', username: user.username });
        res.status(400).json({ errors: [{ field: 'currentPassword', message: 'Your current password is incorrect.' }] });
    }
}

router.post('/delete-account', (req, res) => {
    authenticateUser(req, res, deleteAccount);
});

async function deleteAccount(req, res, user) {
    logWithRequest(req, { message: 'Starting account delete', username: user.username });

    try {
        const verified = await verifyPassword(user.username, String(req.body.password));

        if (req.body.username !== verified.username) {
            logWithRequest(req, { message: 'Bad account deletion - wrong user', requestedUsername: req.body.username, initiatedby: user.username });
            return res.status(400).json({ errors: [{ message: 'An error occurred, please try logging out and in again.' }] });
        }

        await getDb().collection('users').deleteOne({ _id: verified._id });
        logWithRequest(req, { message: 'Completed account delete', username: user.username });
        return res.status(200).json({ message: 'success' });
    } catch (err) {
        logWithRequest(req, { message: 'Bad account deletion - invalid password', username: req.body.username });
        res.status(400).json({ errors: [{ field: 'currentPassword', message: 'Your current password is incorrect.' }] });
    }
}

router.post('/imageUpload', (req, res) => {
    // authenticateUser(req, res, imageUpload);
    imageUpload(req, res, {});
});

function imageUpload(req, res, user) {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            logWithRequest(req, 'form parse error');
            return res.status(500).json({ message: 'An error occurred' });
        }
        if (!files || !files.image) {
            logWithRequest(req, 'No image in upload');
            return res.status(500).json({ message: 'An error occurred' });
        }

        const filePath = files.image[0].filepath;
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));
        formData.append('type', 'file');
        axios.post('https://api.imgur.com/3/image', formData, {
            headers: {
                Authorization: `Client-ID ${config.get('imgurClientID')}`,
                ...formData.getHeaders(),
            },
        }).then(({ data, status }) => {
            if (status !== 200 || data.error) {
                logWithRequest(req, 'imgur post fail!!!');
                logWithRequest(req, data);
                return res.status(500).json({ message: 'An error occurred.' });
            }
            logWithRequest(req, data);
            return res.send(data);
        }).catch((e) => {
            logWithRequest(req, 'imgur post fail!');
            logWithRequest(req, e);
            return res.status(500).json({ message: 'An error occurred.' });
        });
    });
}

module.exports = router;
