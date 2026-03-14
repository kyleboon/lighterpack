const bcrypt = require('bcryptjs');
const express = require('express');

const router = express.Router();
const config = require('config');
const { logWithRequest } = require('./log.js');
const { getDb, upsertUser } = require('./db.js');

const { authenticateModerator } = require('./auth.js');

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function search(req, res) {
    const searchQuery = escapeRegExp(String(req.query.q).toLowerCase().trim());
    const users = getDb().collection('users');

    const nameSearch = users.find({ username: { $regex: `${searchQuery}.*`, $options: 'si' } }).toArray();
    const emailSearch = users.find({ email: { $regex: `${searchQuery}.*`, $options: 'si' } }).toArray();

    Promise.all([nameSearch, emailSearch])
        .then(([nameResult, emailResult]) => {
            const allResults = [].concat(nameResult).concat(emailResult)
                .map((user) => ({
                    username: user.username,
                    library: user.library,
                    email: user.email,
                }));

            res.json({ results: allResults });
        })
        .catch((err) => {
            logWithRequest(req, err);
            res.status(500).json({ message: err });
        });
}

router.get('/moderation/search', (req, res) => {
    authenticateModerator(req, res, search);
});

async function resetPassword(req, res) {
    const username = String(req.body.username).toLowerCase().trim();
    logWithRequest(req, { message: 'MODERATION Reset password start', username });

    try {
        const users = await getDb().collection('users').find({ username }).toArray();
        if (!users.length) {
            logWithRequest(req, { message: 'MODERATION Reset password for unknown', username });
            return res.status(500).json({ message: 'An error occurred.' });
        }
        const user = users[0];
        const newPassword = require('crypto').randomBytes(12).toString('hex');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await upsertUser(user);
        logWithRequest(req, { message: 'MODERATION password changed', username });
        return res.status(200).json({ newPassword });
    } catch (err) {
        logWithRequest(req, { message: 'MODERATION Reset password error', username, err });
        return res.status(500).json({ message: 'An error occurred' });
    }
}

router.post('/moderation/reset-password', (req, res) => {
    authenticateModerator(req, res, resetPassword);
});

async function clearSession(req, res) {
    const username = String(req.body.username).toLowerCase().trim();
    logWithRequest(req, { message: 'MODERATION Clear session start', username });

    try {
        const users = await getDb().collection('users').find({ username }).toArray();
        if (!users.length) {
            logWithRequest(req, { message: 'MODERATION Clear session for unknown', username });
            return res.status(500).json({ message: 'An error occurred.' });
        }
        const user = users[0];
        user.token = '';
        await upsertUser(user);
        logWithRequest(req, { message: 'MODERATION Clear session succeeded', username });
        return res.status(200).json({ message: 'success' });
    } catch (err) {
        logWithRequest(req, { message: 'MODERATION Clear session error', username, err });
        return res.status(500).json({ message: 'An error occurred' });
    }
}

router.post('/moderation/clear-session', (req, res) => {
    authenticateModerator(req, res, clearSession);
});

module.exports = router;
