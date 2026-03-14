const bcrypt = require('bcryptjs');
const express = require('express');

const router = express.Router();
const { logWithRequest } = require('./log.js');
const { getDb, upsertUser } = require('./db.js');

const { authenticateUser, requireModerator } = require('./auth.js');

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

router.get('/moderation/search', authenticateUser, requireModerator, async (req, res) => {
    const searchQuery = escapeRegExp(String(req.query.q).toLowerCase().trim());
    const users = getDb().collection('users');

    const [nameResult, emailResult] = await Promise.all([
        users.find({ username: { $regex: `${searchQuery}.*`, $options: 'si' } }).toArray(),
        users.find({ email: { $regex: `${searchQuery}.*`, $options: 'si' } }).toArray(),
    ]);

    const allResults = []
        .concat(nameResult)
        .concat(emailResult)
        .map((user) => ({
            username: user.username,
            library: user.library,
            email: user.email,
        }));

    res.json({ results: allResults });
});

router.post('/moderation/reset-password', authenticateUser, requireModerator, async (req, res) => {
    const username = String(req.body.username).toLowerCase().trim();
    logWithRequest(req, { message: 'MODERATION Reset password start', username });

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
});

router.post('/moderation/clear-session', authenticateUser, requireModerator, async (req, res) => {
    const username = String(req.body.username).toLowerCase().trim();
    logWithRequest(req, { message: 'MODERATION Clear session start', username });

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
});

module.exports = router;
