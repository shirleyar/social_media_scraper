'use strict';

const SiteConnector = require('../connectors/SiteConnector'),
	basicDataExtractor = require('../utils/basicDataExtractor'),
	errorHandler = require('../utils/errorHandler'),
	logger = require('../utils/logger'),
	consts = require('../utils/constants'),
	assert = require('assert'),
	_ = require('lodash');

class scrapingManager {
	constructor() {
		this.connector = new SiteConnector();
	}

	scrapeBookFace(username, password) {
		return this.connector.login(username, password)
			.then(() => {
				return this.collectData()
			}).catch(error => {
				console.log(error); // todo: error handling
			})
	}

	collectData() {
		let data = {};
		let followers;
		let promises = [
			this.connector.getBasicData(),
			this.connector.getFollowers()
		];
		return Promise.all(promises)
			.then(results => {
				followers = results[1];
				return basicDataExtractor(results[0])
			}).then(basicData => {
				data = basicData;
				return this.getFollowedByUser(followers, basicData.id)
			}).then(followed => {
				data.following = followed;
				data.followers = followers;
				return data;
			}).catch(error => {
				console.log(error); // todo: error handling
			});
	}

	async getFollowedByUser(initialFollowers, userIdOrigin) {
		assert(!_.isNil(initialFollowers) && Array.isArray(initialFollowers), 'initialFollowers in invalid');
		assert(!_.isNil(userIdOrigin), 'user id is not valid');
		let following = [];
		let checked = [userIdOrigin];
		let leftToCheck = initialFollowers;
		// let leftToCheck = _.take(initialFollowers, 10);  //debug
		while (leftToCheck.length > 0) {
			let promises = [];
			for (let i = 0; i < 150 && i < leftToCheck.length; i++) {
				checked.push(leftToCheck[i].id);
				promises.push(this.checkUser(leftToCheck[i], following, userIdOrigin));
			}
			for (let i = 0; i < 150 || i < leftToCheck.length; i++) {
				leftToCheck.shift();
			}
			await Promise.all(promises)
				.then(discoveredUsers => {
					discoveredUsers = _.uniqBy(_.flatten(discoveredUsers), 'id');
					// discoveredUsers = _.take(discoveredUsers, 10); // debug
					discoveredUsers = discoveredUsers.filter(user => {
						return !checked.includes(user.id)
					});
					leftToCheck = _.unionBy(leftToCheck, discoveredUsers, 'id');
				}).catch(error => {
					console.error(error); // todo: error handling
				});
		}
		return following
	}

	checkUser(user, following, userIdOrigin) {
		// let followers = await this.connector.getFollowers(leftToCheck[0].id);
		return this.connector.getFollowers(user.id)
			.then(followers => {		// if userId is in the followers of leftToCheck[i] - add leftToCheck[i] to followed
				if (followers.find(user => user.id === userIdOrigin)) {
					following.push(user);
				}
				return followers;
			}).catch(error => {
				console.error(error); // todo: error handling
			});
	}
}

module.exports = scrapingManager;