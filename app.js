const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('config');
const express = require('express');
const morgan = require('morgan');
const uuid = require('uuid');

const { logger } = require('./server/log.js');
const { connect } = require('./server/db.js');

morgan.token('username', function getUsername(req) {
    return req.lighterpackusername;
});

morgan.token('requestid', function getUsername(req) {
    return req.uuid;
});

const app = express();
app.set('trust proxy', 1); // Trust one hop (nginx/load balancer in front of app)

app.use(function (req, res, next) {
    req.uuid = uuid.v4();
    next();
});

app.use(
    morgan(
        function (tokens, req, res) {
            return JSON.stringify({
                timestamp: tokens.date(req, res, 'iso'),
                requestid: tokens.requestid(req, res),
                'remote-addr': tokens['remote-addr'](req, res),
                method: tokens.method(req, res),
                'http-version': tokens['http-version'](req, res),
                'user-agent': tokens['user-agent'](req, res),
                url: tokens.url(req, res),
                status: tokens.status(req, res),
                referrer: tokens.referrer(req, res),
                'content-length': tokens.res(req, res, 'content-length'),
                'response-time': tokens['response-time'](req, res),
                username: tokens.username(req, res),
            });
        },
        { stream: logger.stream.write },
    ),
);

const oneDay = 86400000;

app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again later.' },
});
app.use('/signin', authLimiter);
app.use('/register', authLimiter);
app.use('/forgotPassword', authLimiter);
app.use('/forgotUsername', authLimiter);

app.use(express.static(`${__dirname}/public/`, { maxAge: oneDay }));
const endpoints = require('./server/endpoints.js');
const moderationEndpoints = require('./server/moderation-endpoints.js');
const views = require('./server/views.js');

app.use('/', endpoints);
app.use('/', moderationEndpoints);
app.use('/', views);

logger.info('Starting up Lighterpack...');

(async () => {
    try {
        await connect();
        logger.info('Connected to MongoDB.');
        config.get('bindings').map((bind) => {
            app.listen(config.get('port'), bind);
            logger.info(`Listening on [${bind}]:${config.get('port')}`);
        });
    } catch (err) {
        logger.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
})();
