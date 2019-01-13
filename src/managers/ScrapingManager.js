'use strict';

const SiteConnector = require('../connectors/SiteConnector'),
	basicDataExtractor = require('../utils/basicDataExtractor'),
	errorHandler = require('../utils/errorHandler'),
	logger = require('../utils/logger'),
	consts = require('../utils/constants'),
	MongoDb = require('../databases/MongoDb'),
	assert = require('assert'),
	_ = require('lodash');

class scrapingManager {
	constructor() {
		this.connector = new SiteConnector();
		this.mongodb = new MongoDb();
	}

	init(username, password) {
		return Promise.all([
			this.connector.login(username, password),
			this.mongodb.init()
		]).then(() => {
			logger.info('Manager was initialized successfully');
		}).catch(error => {
			console.error(error); // todo: error handling
		});
	}

	async scrapeBookFace() {
		try {
			await this.collectData();
			console.log();
		} catch (error) {
			console.error(error); // todo: error handling

		}
	}

	async collectData() {
		try {
			// initialize loop
			const scrapedProfiles = [];
			let firstScraped = await this.collectFirstUser();
			let leftToScrape = firstScraped.followers;
			scrapedProfiles.push(firstScraped.id);
			// collect profiles in batches
			while (leftToScrape.length > 0) {
				let promises = [];
				for (let i = 0; i < 150 && i < leftToScrape.length; i++) {
					scrapedProfiles.push(leftToScrape[i].id);
					promises.push(this.collectDataForUSer(leftToScrape[i].id));
				}
				for (let i = 0; i < 150 || i < leftToScrape.length; i++) {
					leftToScrape.shift();
				}
				await Promise.all(promises)
					.then(savedProfiles => {
						savedProfiles = _.uniqBy(_.flatten(savedProfiles), 'id');
						savedProfiles = savedProfiles.filter(profile => {
							return !scrapedProfiles.includes(profile._id)
						});
						leftToScrape = _.unionBy(leftToScrape, savedProfiles, 'id');
					}).catch(error => {
						console.error(error); // todo: error handling
					});
			}
		} catch (error) {
			console.log(error); // todo: error handling
		}
	}

	async collectFirstUser() {
		try {
			return await this.collectDataForUSer('me');
		} catch (error) {
			console.error(error); // todo: error handling
		}
	}

	collectDataForUSer(userId) {
		let data = {};
		let followers;
		let promises = [
			this.connector.getBasicData(userId),
			this.connector.getFollowers(userId)
		];
		return Promise.all(promises)
			.then(results => {
				followers = results[1];
				return basicDataExtractor(results[0])
			}).then(basicData => {
				data = basicData;
				data.followers = followers;
				return this.mongodb.saveProfile(data)
			}).then(saved => {
				logger.info(`Saved collected data for user ${userId}`);
				return {followers: saved._doc.followers, id: saved._doc._id}
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
				// promises.push(this.checkUser(leftToCheck[i], following, userIdOrigin));
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