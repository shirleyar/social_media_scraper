module.exports = {

	// general
	appName:'BookFace-Scraper',
	logLevel: process.env.LOG_LEVEL || info,
	retries: parseInt(process.env.RETRIES) || 3,
	scrapeBatchesAmount: 150,
	gracefulShutdownSec: 5,
	resultsPath: 'scrapedProfiles.json',
	unhandledRejectionCode: -1,
	unhandledExceptionCode: -2,

	// BookFace related
	siteUrl: process.env.SITE_URL || 'http://35.188.78.78:8888',
	loginEndpoint:  'api/login',
	userUrl: 'api/user',
	followersEndpoint: 'followers',
	siteRetries: 5,
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
	dbUrl: process.env.DB_URL,
	dbUser: process.env.DB_USER,
	dbPass: process.env.DB_PASS,
	dbName: process.env.DB_NAME,
	dbCollection: process.env.DB_COLLECTION,
};