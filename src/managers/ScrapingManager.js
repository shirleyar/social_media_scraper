'use strict';

const SiteConnector = require('../connectors/SiteConnector'),
	basicDataExtractor = require('../utils/basicDataExtractor'),
	logger = require('../utils/logger'),
	consts = require('../utils/constants'),
	LokiDb = require('../databases/LokiDB'),
	assert = require('assert'),
	_ = require('lodash');

class scrapingManager {
	constructor() {
		this.connector = new SiteConnector();
	}

	// initializes the connection to the database and site
	init(username, password) {
		assert(username, 'username is invalid');
		assert(password, 'password is invalid');
		return Promise.all(
			[
				this.connector.login(username, password),
				LokiDb.init()
			]
		).then(() => {
			logger.info('Manager was initialized successfully');
		}).catch(error => {
			logger.error({error}, 'Error during manager initialization');
			return Promise.reject(error);
		});
	}

	// main function that scrapes the website. first it collects and saves the data, then returns data as requested,
	async scrapeBookFace() {
		try {
			const collectedIds = await this.collectData();   // collects and saves basic data and followers for all accessible users
			await this.updateAllFollowing(collectedIds); //  updates the scraped profiles with the profiles that are followed by it.
			return Promise.resolve(await this.getAllProfilesAsJSON())  // returns all scraped profile. Foreach profile returns: id, name, age, color, followers, following
		} catch (error) {
			logger.error({error}, 'Error during scraping the website');
			return Promise.reject(error);
		}
	}

	/* Collects and saves basic data and followers for all accessible users.
	Based on Graph traversal idea (DFS). Saves a list of profiles we have already scraped and a list of accessible profiles that are pending
	(to prevent infinite loop). In order to increase performance the "parallel" (as much as can be done) scraping is done in batches
	and CollectData is in charge of sync and manage of these batches.
	*/
	async collectData() {
		logger.info('Starting data collection. This will take some time');
		try {
			// initialize loop by scraping the user the app is logged in as.
			let scrapedProfilesTotal = [];  // array of all scraped profiles
			let firstScraped = await this.collectFirstUser();
			let leftToScrapeTotal = firstScraped.followers;
			scrapedProfilesTotal.push(firstScraped.id);
			// collect accessible profiles in batches (batch size in configured by an environment variable
			while (leftToScrapeTotal.length > 0) {
				// prepare current batch
				let promises = [];
				for (let i = 0; i < consts.scrapeBatchesAmount && i < leftToScrapeTotal.length; i++) {
					promises.push(this.collectDataForUSer(leftToScrapeTotal[i]));
				}
				// execute batch
				try {
					let savedProfilesInBatch = await Promise.all(promises);
					// remove successfully scraped profiles
					let successfulIdsInBatch = _.flattenDeep(savedProfilesInBatch.map(profile => profile.id));  // array of ids that were scraped successfully
					scrapedProfilesTotal = _.union(scrapedProfilesTotal, successfulIdsInBatch);
					leftToScrapeTotal = leftToScrapeTotal.filter(id => {
						return !successfulIdsInBatch.includes(id);
					});
					// manage pending profiles list (remove already scraped and already pending profiles, add new profile to pending)
					let followers = savedProfilesInBatch.map(profile => profile.followers);
					followers = _.uniq(_.flattenDeep(followers));
					followers = followers.filter(follower => {
						return !scrapedProfilesTotal.includes(follower)
					});

					leftToScrapeTotal = _.union(leftToScrapeTotal, followers);
				} catch (error) {
					logger.trace({error}, `Having some issues scraping data for some users, will retry to scrape them again in a moment. error: ${error.message}`)
				}
			}
			logger.info('Finished collecting data');
			return scrapedProfilesTotal;
		} catch (error) {
			logger.error({error}, 'Error during data collection main function');
			return Promise.reject(error);
		}
	}

	// Gets logged-in user's data. The followers will be an initialization of pending profiles to scrape
	async collectFirstUser() {
		try {
			return await this.collectDataForUSer('me');
		} catch (error) {
			logger.error({error}, 'Error during scraping logged in user');
			return Promise.reject(error);
		}
	}

	// scrapes data for a user by it's id and saves it in database.
	collectDataForUSer(userId) {
		logger.info(`Scraping user ${userId}`);
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
				return LokiDb.insertProfile(data)
			}).then(saved => {
				logger.info(`Saved collected data for user ${userId}`);
				followers = followers.map(follower => follower.id);
				return {
					followers,
					id: saved.id
				}
			}).catch(error => {
				logger.error({error}, `Error during scraping user ${userId}`);
				return Promise.reject(error);
			});
	}

	// Fetches all saved profiles from database, cleans it from unnecessary data, and for each profile adds the followed by list
	async getAllProfilesAsJSON() {
		try {
			const profiles = await LokiDb.getAllProfiles();
			return Promise.resolve(this.dataToModel(profiles));
		} catch (error) {
			logger.error({error}, 'Error during fetching data as JSON');
			return Promise.reject(error);
		}
	}

	// updates all profiles with their following profiles list
	async updateAllFollowing(collectedIds) {
		logger.info(`Preparing scraped data for output. This Will take some time`);
		try {
			let i = 0;
			let j;
			let promisesBatch;
			while (i < collectedIds.length) {
				// build batch -  each batch will get the stored data of the user and the users that are followed by the user
				promisesBatch = [];
				for (j = 0; j < consts.scrapeBatchesAmount && i + j < collectedIds.length; j++) {
					promisesBatch.push(
						this.updateUserWithFollowing(collectedIds[i + j])
					);
				}
				await Promise.all(promisesBatch);
				i += j;
			}
		} catch (error) {
			logger.error({error}, 'Error during fetching profiles / computing followed by user list');
			return Promise.reject(error);
		}
	}

	// updates the user with a list of users that are followed by the user
	async updateUserWithFollowing(id) {
		try {
			let followedByUser = await LokiDb.getProfilesFollowedByUser(id);
			await LokiDb.updateFollowedByUserInDatabase(id, followedByUser);
		} catch (error) {
			logger.error({error}, `Error occurred while updating followed profiles by user ${id}`);
			return Promise.reject(error);
		}
	}

	/* Transforms data that was returned from Lokijs database to a general JSON object that can be read by any platform that accepts JSON.
The model is:
{
	id (uuid),
	firstName (string),
	lastName (string),
	age (int),
	favoriteColor (object: {r (int), g (int), b(int)},
	followers (array of objects: {id (uuid), firstName (string), lastName(string)}),
	following(array of objects: {id (uuid), firstName (string), lastName(string)})
}
The function returns an array of the above model.
 */
	async dataToModel(data) {
		try {
			return Promise.resolve(
				(data || []).map(profile => (
					{
						id: profile.id,
						firstName: profile.firstName,
						lastName: profile.lastName,
						age: profile.age,
						favoriteColor: profile.favoriteColor,
						followers: profile.followers,
						following: profile.following
					})));
		} catch (error) {
			logger.error({error}, 'Error while parsing data from database to JSON');
			return Promise.reject(error);
		}
	}
}

module.exports = scrapingManager;