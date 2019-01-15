'use strict';

const SiteConnector = require('../connectors/SiteConnector'),
	basicDataExtractor = require('../utils/basicDataExtractor'),
	logger = require('../utils/logger'),
	consts = require('../utils/constants'),
	MongoDb = require('../databases/MongoDb'),
	assert = require('assert'),
	_ = require('lodash');

class scrapingManager {
	constructor() {
		this.connector = new SiteConnector();
	}

	// initializes the connection to the database and site
	init(username, password) {
		return Promise.all(
			[
				this.connector.login(username, password),
				MongoDb.init()
			]
		).then(() => {
			logger.info('Manager was initialized successfully');
		}).catch(error => {
			logger.error({err: error}, 'Error during manager initialization');
			throw error;
		});
	}

	// main function that scrapes the website. first it collects and saves the data, then returns data as requested,
	async scrapeBookFace() {
		try {
			await this.collectData();   // collects and saves basic data and followers for all accessible users
			return await this.getAllData(); // returns all scraped profile. Foreach profile returns: id, name, age, color, followers, following
		} catch (error) {
			logger.error({err: error}, 'Error during scraping the website');
			throw error;
		}
	}

	/* Collects and saves basic data and followers for all accessible users.
	Based on Graph traversal idea (DFS). Saves a list of profiles we have already scraped and a list of accessible profiles that are pending
	(to prevent infinite loop). In order to increase performance the "parallel" (as much as can be done) scraping is done in batches
	and CollectData is in charge of sync and manage of these batches.
	*/
	async collectData() {
		try {
			// initialize loop by scraping the user the app is logged in as.
			const scrapedProfiles = [];
			let firstScraped = await this.collectFirstUser();
			let leftToScrape = firstScraped.followers;
			scrapedProfiles.push(firstScraped.id);
			// collect accessible profiles in batches (batch size in configured by an environment variable
			while (leftToScrape.length > 0) {
				// prepare current batch
				let promises = [];
				for (let i = 0; i < consts.scrapeBatchesAmount && i < leftToScrape.length; i++) {
					promises.push(this.collectDataForUSer(leftToScrape[i].id));
				}
				for (let i = 0; i < consts.scrapeBatchesAmount || i < leftToScrape.length; i++) {
					leftToScrape.shift();
				}
				// execute batch
				let savedProfiles = await Promise.all(promises);
				// manage pending profiles list (remove already scraped and already pending profiles, add new profile to pending)
				let followers = savedProfiles.map(profile => profile.followers);
				followers = _.uniqBy(_.flattenDeep(followers), 'id');
				followers = followers.filter(profile => {
					return !scrapedProfiles.includes(profile.id)
				});
				leftToScrape = _.unionBy(leftToScrape, followers, 'id');
			}
		} catch (error) {
			logger.error({err: error}, 'Error during data collection main function');
			throw error;
		}
	}

	// Gets logged-in user's data. The followers will be an initialization of pending profiles to scrape
	async collectFirstUser() {
		try {
			return await this.collectDataForUSer('me');
		} catch (error) {
			logger.error({err: error}, 'Error during scraping logged in user');
			throw error;
		}
	}

	// scrapes data for a user by it's id and saves it in database.
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
				return basicDataExtractor(results[0])  // decodes basic data and returns name, age, favorite color and id.
			}).then(basicData => {
				data = basicData;
				data.followers = followers;
				return MongoDb.saveProfile(data)
			}).then(saved => {
				logger.info(`Saved collected data for user ${userId}`);
				return {
					followers: _.get(saved, '_doc.followers', []),
					id: _.get(saved, '_doc._id', '')
				}
			}).catch(error => {
				logger.error({err: error}, `Error during scraping user ${userId}`);
				throw error;
			});
	}

	// Fetches all saved profiles from db, cleans it from unnecessary data, and for each profile adds the followed by list
	async getAllData() {
		try {
			let profiles = await MongoDb.getAllProfiles();  // todo: check returned profiles structure
			return (profiles || []).map(async profile => ({
				id: profile._id,
				firstName: profile.firstName,
				lastName: profile.lastName,
				age: profile.age,
				followers: profile.followers,
				following: await MongoDb.getAllFollowedByUser(profile._id)  // add a list of profiles that the current profile is following
			}));
		} catch (error) {
			logger.error({err: error}, 'Error during fetching profiles / computing followed by user list');
			throw error;
		}
	}

	//todo: delete this when finished
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
					logger.error({err: error}, '');
					throw error;
				});
		}
		return following
	}
}

module.exports = scrapingManager;