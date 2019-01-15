'use strict';

const mongoose = require('mongoose'),
	consts = require('../utils/constants'),
	logger = require('../utils/logger'),
	profileModel = require('../models/ProfileModel'),
	assert = require('assert'),
	_ = require('lodash');

const dbServer = consts.dbUrl.replace('<dbuser>', consts.dbUser).replace('<dbpassword>', consts.dbPass);

mongoose.connection.on("error", error => {
	logger.error({err: error}, "Could not connect to mongo server!");
	throw error;
});

class MongoDb {
	static async init() {
		try {
			await MongoDb.connect();
			logger.info('Connected successfully to MongoDb server');
			await MongoDb.clearCollection();
			logger.info('MongoDb cleared all documents');
		} catch (error) {
			logger.error({err: error}, 'Error occurred during database initialization');
			throw error;
		}
	}

	static async connect() {
		try {
			await mongoose.connect(dbServer, {useNewUrlParser: true});
		} catch (error) {
			logger.error({err: error}, 'Error occurred during database connection');
			throw error;
		}
	}

	static async clearCollection() {
		try {
			await profileModel.deleteMany();
		} catch (error) {
			logger.error({err: error}, 'Error occurred during database clearing process');
			throw error;
		}
	}

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

	static async getAllfollowedByUser(userId) {
		assert(!_.isEmpty(userId), 'user id is invalid');
		try {
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

	static close() {
			mongoose.connection.close(() => {
				logger.info('MongoDb server disconnected');
			});

	}
}

module.exports = MongoDb;