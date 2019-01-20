module.exports = {

	// general
	appName:'BookFace-Scraper',
	logLevel: process.env.LOG_LEVEL || 'info',
	retries: parseInt(process.env.RETRIES) || 5,
	scrapeBatchesAmount: 50,
	gracefulShutdownSec: 10,
	resultsPath: './scrapedProfiles.json',
	unhandledRejectionCode: -1,
	unhandledExceptionCode: -2,
	killSignal: 128,

	// BookFace related
	siteUrl: process.env.SITE_URL || 'http://35.188.78.78:8888',
	loginEndpoint:  'api/login',
	userUrl: 'api/user',
	followersEndpoint: 'followers',
	siteRetries: 10,
	siteTimeout: 13500,
	delayBetweenFollowersBatch: 500,

	// ascii values for required chars
	A: 65,
	Z: 90,
	a: 97,
	z: 122,
	0: 48,
	9: 57,

	// DB constants   (generally should be a secret and of course not documented)
	collectionName:'profiles',
	autosaveInterval: 2000,
	databasePath: './profilesdb.json'
};