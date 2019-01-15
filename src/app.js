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
			process.exit();
		}).catch(error => {
			throw error;
		});
}

process.on('uncaughtException', error => {
	logger.fatal({err: error}, 'Error has occurred. App will exit now');
	process.exit(-1);
});

process.on('unhandledRejection', (reason, promise) => {
	logger.fatal({reason, promise}, 'Error has occurred. App will exit now');
	process.exit(-1);
});

// graceful shutdown
process.on('exit', code => {
	logger.info(`App is about to exit with code ${code}`);
	MongoDb.close();
	logger.info(`App will wait ${consts.gracefulShutdownSec} seconds and exit (graceful shutdown)`)
	setTimeout(() => process.exit(), consts.gracefulShutdownSec * 1000);
});

start();