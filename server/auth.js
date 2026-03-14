const config = require('config');
const mongojs = require('mongojs');

const collections = ['users', 'libraries'];
const db = mongojs(config.get('databaseUrl'), collections);

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { logWithRequest } = require('./log.js');

const moderatorList = config.get('moderators');

const authenticateModerator = function (req, res, callback) {
    authenticateUser(req, res, (req, res, user) => {
        if (!isModerator(user.username)) {
            return res.status(403).json({ message: 'Denied.' });
        }
        callback(req, res, user);
    });
};

const authenticateUser = function (req, res, callback) {
    if (!req.cookies.lp && (!req.body.username || !req.body.password)) {
        return res.status(401).json({ message: 'Please log in.' });
    }
    if (req.body.username && req.body.password) {
        const username = String(req.body.username).toLowerCase().trim();
        const password = String(req.body.password);
        verifyPassword(username, password)
            .then((user) => {
                generateSession(req, res, user, callback);
            })
            .catch((err) => {
                logWithRequest(req, err);
                if (err.code && err.message) {
                    logWithRequest(req, { message: `error on verifyPassword for: ${username}`, error: err.message });
                    res.status(err.code).json({ message: err.message });
                } else {
                    res.status(500).json({ message: 'An error occurred, please try again later.' });
                }
            });
    } else {
        db.users.find({ token: req.cookies.lp }, (err, users) => {
            if (err) {
                logWithRequest(req, { message: 'Error on authenticateUser else', error: err });
                return res.status(500).json({ message: 'An error occurred, please try again later.' });
            } if (!users || !users.length) {
                logWithRequest(req, { message: 'bad cookie!' });
                return res.status(404).json({ message: 'Please log in again.' });
            }
            req.lighterpackusername = users[0].username || 'UNKNOWN';
            callback(req, res, users[0]);
        });
    }
};

const verifyPassword = function (username, password) {
    return new Promise((resolve, reject) => {
        db.users.find({ username }, (err, users) => {
            if (err) {
                return reject({ code: 500, message: 'An error occurred, please try again later.' });
            } if (!users || !users.length) {
                return reject({ code: 404, message: 'Invalid username and/or password.' });
            }

            const user = users[0];

            bcrypt.compare(password, user.password, (err, result) => {
                if (err) {
                    return reject({ code: 500, message: 'An error occurred, please try again later.' });
                }
                if (!result) {
                    return reject({ code: 404, message: 'Invalid username and/or password.' });
                }
                resolve(user);
            });
        });
    });
};

const generateSession = function (req, res, user, callback) {
    crypto.randomBytes(48, (ex, buf) => {
        const token = buf.toString('hex');
        user.token = token;
        db.users.save(user);
        res.cookie('lp', token, { path: '/', maxAge: 365 * 24 * 60 * 1000 });
        callback(req, res, user);
    });
};

function isModerator(username) {
    return moderatorList.indexOf(username) > -1;
}

module.exports = {
    authenticateModerator,
    authenticateUser,
    verifyPassword,
    generateSession,
    isModerator,
};
