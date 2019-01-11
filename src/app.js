'use strict';

require('dotenv').config();

// const Base64 = require('base64-js');
require("google-closure-library");
goog.require('goog.crypt.base64');
const Connector = require('./connectors/SiteConnector');

const Scraper = require('./utils/ScrapingUtilBookFace');

const scraper = new Scraper();

// // scraper.login({username: 'user1', password: 'pass1'})
// // 	.then(() => {
// // 		scraper.getDryData().then(data => console.log(data))
// // 	}).catch(error => console.error(error));
// // //
// const cypher = "CiBmM2VjODUzY2JjMjM1OTY3NjE2Yjg2NGZhZmQxOWI2NhIHS3Jpc3RpbhoEWm9vayAyKPzbxwY=";
// let buf = goog.crypt.base64.decodeStringToByteArray(cypher);
// let buf2 = goog.crypt.base64.decodeString(cypher);
// console.log(buf);
// console.log(buf2);

const connector = new Connector();

connector.login('user1', 'pass1')
.then(result=> {
	return connector.getBasicData('b1f389d5f1bd7d8815d3600057929832')
}).then(result=> {
	console.log(result);
	// return connector.getFollowers()
	return scraper.decodeBasicData(result);
}).then(result=> {
	console.log(result);
}).catch(error=>{
	console.err(error);
});