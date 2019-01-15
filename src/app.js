'use strict';

require('dotenv').config();
require("babel-polyfill");
require('babel-register')({
	presets: ['env', 'es2015', 'stage-0']
});

const Manager = require('./managers/ScrapingManager'),
	MongoDb = require('./databases/MongoDb'),
	logger = require('./utils/logger'),
	consts = require('./utils/constants'),
	resultsWriter = require('./utils/resultsWriter'),
	args = require('minimist')(process.argv.slice(2)); // get user and password from cli

const m = new Manager();

function start() {
	return m.init(args._[0], args._[1])
		.then(() => {
			return m.scrapeBookFace()
		}).then(data => {
			return resultsWriter(data) // write results to json file
		}).then(() => {
			logger.info('Scraping process has completed successfully');
			gracefulShutdown(0);
		}).catch(error => {
			throw error;
		});
}

process.on('uncaughtException', error => {
	logger.fatal({err: error}, 'Error has occurred. App will exit now');
	gracefulShutdown(consts.unhandledExceptionCode);
});

process.on('unhandledRejection', (reason, promise) => {
	logger.fatal({promise}, 'Error has occurred. App will exit now');
	gracefulShutdown(consts.unhandledRejectionCode);
});

function gracefulShutdown(code) {
	logger.info(`App is about to exit with code ${code}. Starting shutdown.`);
	logger.info(`App will exit in ${consts.gracefulShutdownSec} seconds (graceful shutdown procedure)`);
	MongoDb.close();
	setTimeout(() => {
		logger.info('Bye bye');
		process.exit(code);
	}, 10 * 1000);
}

start();