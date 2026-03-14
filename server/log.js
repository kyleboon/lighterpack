const winston = require('winston');

class TimestampFirst {
    constructor(enabled = true) {
        this.enabled = enabled;
    }

    transform(obj) {
        if (this.enabled) {
            return { timestamp: obj.timestamp, ...obj };
        }
        return obj;
    }
}

const logger = winston.createLogger({
    format: winston.format.combine(winston.format.timestamp(), new TimestampFirst(true), winston.format.json()),
    transports: [new winston.transports.Console()],
});

const logWithRequest = function (req, data) {
    const logData = typeof data === 'string' ? { message: data } : data;

    if (req && req.uuid) {
        logger.info({ ...logData, requestid: req.uuid });
        return;
    }
    logger.info(logData);
};

module.exports = {
    logWithRequest,
    logger,
};
