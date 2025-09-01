// logger.js
const winston = require('winston');
const { WinstonTransport: AxiomTransport } = require('@axiomhq/winston');

// Load environment variables if needed
require('dotenv').config();

const axiomTransport = new AxiomTransport({
    dataset: process.env.AXIOM_DATASET,
    token: process.env.AXIOM_TOKEN,
});

const { combine, errors, json } = winston.format;

const logger = winston.createLogger({
    level: 'info',
    format: combine(errors({ stack: true }), json()),
    defaultMeta: { service: 'user-service' },
    transports: [axiomTransport],
    exceptionHandlers: [axiomTransport],
    rejectionHandlers: [axiomTransport],
});

module.exports = logger;
