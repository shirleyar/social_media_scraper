'use strict';

require('dotenv').config();
require("babel-polyfill");
require('babel-register')({
	presets: ['env', 'es2015', 'stage-0']
});

const Connector = require('./connectors/SiteConnector'),
	Manager = require('./managers/ScrapingManager');

const m = new Manager();
return m.init('user1', 'pass1').then(() => {
	return m.scrapeBookFace()
}).then(data => {
	console.log(data);
}).catch(e => {
	console.error(e);
});