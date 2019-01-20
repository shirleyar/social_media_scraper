'use strict';

const lokijs = require('lokijs'),
	logger = require('../utils/logger'),
	consts = require('../utils/constants'),
	assert = require('assert'),
	_ = require('lodash');

class LokiDB {
	constructor() {
		this.database = undefined;
		this.profiles = undefined;  // collection in database
	}

	// initializes a Lokijs database (in memory javascript database. for reference:  http://lokijs.org/#/)
	init() {
		try {
			this.database = new lokijs(consts.resultsPath, {
				autosave: true,
				autosaveInterval: consts.autosaveInterval
			});
			this.profiles = this.database.addCollection(consts.collectionName, {indeces: ['id']});
			this.profiles.ensureUniqueIndex('id');
			return Promise.resolve();
		} catch (error) {
			logger.error({error}, 'Error occurred during database initialization');
			return Promise.reject(error);
		}
	};

	// closes the database during script shutdown (clears memory and deletes database) --- data is saved in a consumable JSON file in the end
	close() {
		logger.info('Started database closure procedure');
		this.database.removeCollection('profiles');
		logger.info('Removed collection from database');
		this.database.close(() => {
			logger.info('Closed database');
			this.database.deleteDatabase(() => {
				logger.info('deleted database from files system. Done database closure procedure.');
			});
		});
	}

	// inserts a new profile to database. Gets all Handles duplicates as well.
	async insertProfile({id, firstName, lastName, age, favoriteColor, followers}) {
		try {
			assert(!_.isEmpty(id), 'id is invalid');
			assert(!_.isEmpty(firstName), 'firstName is invalid');
			assert(!_.isEmpty(lastName), 'lastName is invalid');
			assert(!isNaN(age) && age > 0, 'age is invalid');
			assert(!_.isEmpty(favoriteColor), 'favoriteColor is empty');
			assert(!_.isEmpty(followers) && Array.isArray(followers), 'followers is invalid');
			const profile = {
				id,
				firstName,
				lastName,
				favoriteColor,
				age,
				followers
			};
			let doc = this.profiles.insert(profile);
			logger.info(`profile ${id} was saved successfully`);
			logger.trace({savedDoc: doc}, `profile ${id} was saved`);
			return Promise.resolve(doc);
		} catch (error) {
			if (error.message.includes('Duplicate key')) {
				logger.info(`User ${id} is already saved in database`);
				return Promise.resolve();
			} else {
				logger.error({error}, `Error occurred while saving user ${id} in database`);
				return Promise.reject(error);
			}
		}
	}

	// returns all data in database. if empty - returns []
	async getAllProfiles() {
		try {
			return Promise.resolve(this.profiles.find({}))
		} catch (error) {
			logger.error({error}, `Error occurred while getting all users in database`);
			return Promise.reject(error);
		}
	}

	// returns a profiles by it's id. if not found - returns undefined
	async getProfileById(id) {
		try {
			return Promise.resolve(this.profiles.find({id})[0]);
		} catch (error) {
			logger.error({err: error}, `Error occurred while fetching user ${id} from database`);
			return Promise.reject(error);
		}
	}

	async getProfilesFollowedByUser(id) {
		try {
			const existsProfile = await this.getProfileById(id);
			if (existsProfile) {
				let followed = this.profiles.where(profile => {
					return !!_.find(profile.followers, {id});
				});
				followed = followed.map(user => (
						{
							id: user.id,
							firstName: user.firstName,
							lastName: user.lastName
						}
					)
				);
				logger.info(`Fetched profiles that user ${id} is following successfully`);
				logger.trace({profiles: followed}, 'Fetched profiles that user ${userId} is following');
				return Promise.resolve(followed);
			} else {
				logger.info(`User ${id} does not exist in database`);
			}
		} catch (error) {
			logger.error({err: error}, 'Error occurred while fetching followed by user profiles from database');
			return Promise.reject(error);
		}
	}

	async updateFollowedByUserInDatabase(id, following) {
		try {
			let profile = await this.getProfileById(id);
			profile.following = following;
			this.profiles.update(profile);
			return Promise.resolve();
		} catch (error) {
			logger.error({err: error}, `Error occurred while updating followed by user ${id} field`);
			return Promise.reject(error);
		}
	}
}

module.exports = new LokiDB();