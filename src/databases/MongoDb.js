'use strict';

const mongoose = require('mongoose'),
	consts = require('../utils/constants'),
	logger = require('../utils/logger'),
	profileModel = require('../models/ProfileModel'),
	assert = require('assert'),
	_ = require('lodash');

const dbServer = consts.dbUrl.replace('<dbuser>', consts.dbUser).replace('<dbpassword>', consts.dbPass);


mongoose.connection.on('error', error => {
	logger.error({err: error}, 'Could not connect to MongoDb server!');
	throw error;
});

mongoose.connection.once('open', () => {
	logger.info('Connected successfully to MongoDb server');
});

class MongoDb {
	// initializes the connection to the database server (stored in mLab)
	// since currently stored data is irrelevant in current scrape - the db is cleared each time.
	static async init() {
		try {
			await MongoDb.connect();
			await MongoDb.clearCollection();
			logger.info('MongoDb cleared all documents');
		} catch (error) {
			logger.error({err: error}, 'Error occurred during database initialization');
			throw error;
		}
	}

	// handles initial connection to database
	static async connect() {
		try {
			await mongoose.connect(dbServer, {useNewUrlParser: true});
		} catch (error) {
			logger.error({err: error}, 'Error occurred during database connection');
			throw error;
		}
	}

	// clears all stored data
	static async clearCollection() {
		try {
			await profileModel.deleteMany();
		} catch (error) {
			logger.error({err: error}, 'Error occurred during database clearing process');
			throw error;
		}
	}

	// saves a scraped user in db
	static async saveProfile({id, firstName, lastName, age, favoriteColor, followers}) {
		try {
			const profile = new profileModel({
				_id: id,
				firstName: firstName,
				lastName: lastName,
				favoriteColorRGB: favoriteColor,
				age,
				followers
			});
			let doc = await profile.save();
			logger.info(`profile ${id} was saved successfully`);
			logger.trace({savedDoc: doc}, 'profile ${id} was saved');
			return doc;
		} catch (error) {
			logger.error({err: error}, 'Error occurred while saving a profile to database');
			throw error;
		}
	}

	// getches all stored data from database
	static async getAllProfiles() {
		try {
			const results = await profileModel.find({});
			logger.info(`Fetched profiles successfully`);
			logger.trace({profiles: results}, 'Fetched profiles');
			return results;
		} catch (error) {
			logger.error({err: error}, 'Error occurred while fetching profiles from database');
			throw error;
		}
	}

	// gets all users that the user with the userId is following (all users that the user is in their followers)
	static async getAllFollowedByUser(userId) {
		try {
			assert(!_.isEmpty(userId), 'user id is invalid');
			let results = await profileModel.find({
				followers: {$elemMatch: {_id: userId}}
			});
			logger.info(`Fetched profiles that user ${userId} is following successfully`);
			logger.trace({profiles: results}, 'Fetched profiles that user ${userId} is following');
			return results;
		} catch (error) {
			logger.error({err: error}, 'Error occurred while fetching followed by user profiles from database');
			throw error;
		}
	}

	// closes the connection to the database when done
	static close() {
		mongoose.connection.close(false, () => {
			logger.info('MongoDb connection is close');
		});
	}
}

module.exports = MongoDb;