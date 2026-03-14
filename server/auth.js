const config = require('config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { logWithRequest } = require('./log.js');
const { getDb, upsertUser } = require('./db.js');

const moderatorList = config.get('moderators');

const authenticateUser = async function (req, res, next) {
    if (!req.cookies.lp && (!req.body.username || !req.body.password)) {
        return res.status(401).json({ message: 'Please log in.' });
    }

    try {
        let user;
        if (req.body.username && req.body.password) {
            const username = String(req.body.username).toLowerCase().trim();
            const password = String(req.body.password);
            user = await verifyPassword(username, password);
            const token = crypto.randomBytes(48).toString('hex');
            user.token = token;
            upsertUser(user).catch((err) => logWithRequest(req, { message: 'Error saving session token', err }));
            res.cookie('lp', token, {
                path: '/',
                maxAge: 365 * 24 * 60 * 1000,
                httpOnly: true,
                sameSite: 'lax',
            });
        } else {
            const users = await getDb().collection('users').find({ token: req.cookies.lp }).toArray();
            if (!users || !users.length) {
                logWithRequest(req, { message: 'bad cookie!' });
                return res.status(404).json({ message: 'Please log in again.' });
            }
            user = users[0];
        }
        req.lighterpackusername = user.username || 'UNKNOWN';
        req.user = user;
        next();
    } catch (err) {
        logWithRequest(req, err);
        if (err.code && err.message) {
            res.status(err.code).json({ message: err.message });
        } else {
            res.status(500).json({ message: 'An error occurred, please try again later.' });
        }
    }
};

const requireModerator = function (req, res, next) {
    if (!isModerator(req.user.username)) {
        return res.status(403).json({ message: 'Denied.' });
    }
    next();
};

const verifyPassword = async function (username, password) {
    let users;
    try {
        users = await getDb().collection('users').find({ username }).toArray();
    } catch (err) {
        throw { code: 500, message: 'An error occurred, please try again later.' };
    }

    if (!users || !users.length) {
        throw { code: 404, message: 'Invalid username and/or password.' };
    }

    const user = users[0];
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
        throw { code: 404, message: 'Invalid username and/or password.' };
    }
    return user;
};

function isModerator(username) {
    return moderatorList.indexOf(username) > -1;
}

module.exports = {
    authenticateUser,
    requireModerator,
    verifyPassword,
    isModerator,
};
