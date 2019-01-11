module.exports = {
	appName:'BookFace-Scraper',
	logLevel: process.env.LOG_LEVEL || info,
	retries: parseInt(process.env.RETRIES) || 3,

	siteUrl: process.env.SITE_URL || 'http://35.188.78.78:8888',
	loginEndpoint:  'api/login',
	userUrl: 'api/user',
	followersEndpoint: 'followers',

	A: 65,
	Z: 90,
	a: 97,
	z: 122,
	0: 48,
	9: 57,
};