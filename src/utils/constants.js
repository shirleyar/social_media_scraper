module.exports = {

	// general
	appName:'BookFace-Scraper',
	logLevel: process.env.LOG_LEVEL || info,
	retries: parseInt(process.env.RETRIES) || 3,
	scrapeBatchesAmount: 150,
	gracefulShutdownSec: 5,
	resultsPath: 'scrapedProfiles.json',

	// BookFace related
	siteUrl: process.env.SITE_URL || 'http://35.188.78.78:8888',
	loginEndpoint:  'api/login',
	userUrl: 'api/user',
	followersEndpoint: 'followers',
	siteRetries: 5,

	// ascii values for required chars
	A: 65,
	Z: 90,
	a: 97,
	z: 122,
	0: 48,
	9: 57,

	// DB constants   (generally should be a secret)
	dbUrl: 'mongodb://<dbuser>:<dbpassword>@ds255754.mlab.com:55754/bookface',
	dbUser: 'shirar486W',
	dbPass: 'shirar486W',
	dbName: 'bookface',
	dbCollection: 'profiles',

};