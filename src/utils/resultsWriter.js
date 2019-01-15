'use strict';

const fs = require('fs'),
	logger = require('./logger'),
	consts = require('./constants');

async function writeToFile(results) {
	results = JSON.stringify(results, null, 2); // make a pretty json string
	try {
		await fs.writeFile(consts.resultsPath, results, {flag: 'w+'});
		logger.info(`Wrote results to file ./${consts.resultsPath} successfully.`);
	} catch (error) {
		logger.error({err: error}, 'Error during writing results to file');
		throw error;
	}
}

module.exports = writeToFile;