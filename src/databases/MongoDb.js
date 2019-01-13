'use strict';

const mongoose = require('mongoose'),
	consts = require('../utils/constants'),
	logger = require('../utils/logger'),
	errorHandler = require('../utils/errorHandler'),
	profileModel = require('../models/ProfileModel'),
	assert = require('assert'),
	_ = require('lodash');

const dbServer = consts.dbUrl.replace('<dbuser>', consts.dbUser).replace('<dbpassword>', consts.dbPass);

class MongoDb {
	async init() {
		try {
			await this.connect();
			await this.clearCollection();
		} catch (error) {
			console.error(error); // todo: error handling
		}
	}

	async connect() {
		try {
			await mongoose.connect(dbServer, {useNewUrlParser: true})
			logger.info('Connected successfully to MongoDb server');
		} catch (error) {
			console.error(error); // todo: error handling
		}
	}

	async clearCollection() {
		try {
			await profileModel.deleteMany();
			logger.info('MongoDb cleared all documents');
		} catch (error) {
			console.error(error); // todo: error handling
		}
	}

	async saveProfile({id, firstName, lastName, age, favoriteColor, followers}) {
		const profile = new profileModel({
			_id: id,
			firstName: firstName,
			lastName: lastName,
			favoriteColorRGB: favoriteColor,
			age,
			followers
		});
		try {
			let doc = await profile.save();
			logger.info(`profile ${id} was saved successfully`);
			logger.trace({savedDoc: doc}, 'profile ${id} was saved');
			return doc;
		} catch (error) {
			console.error(error); // todo: error handling
		}
	}

	async getAllProfiles() {
		try {
			const results = await profileModel.find({});
			logger.info(`Fetched profiles successfully`);
			logger.trace({profiles: results}, 'Fetched profiles');
			return results;
		} catch (error) {
			console.error(error); // todo: error handling
		}
	}

	async getAllfollowedByUser(userId) {
		assert(!_.isEmpty(userId), 'user id is invalid');
		try {
			let results = await profileModel.find({
				followers: {$elemMatch: {_id: userId}}
			});
			logger.info(`Fetched profiles that user ${userId} is following successfully`);
			logger.trace({profiles: results}, 'Fetched profiles that user ${userId} is following');
			return results;
		} catch (error) {
			console.error(error); // todo: error handling
		}
	}
}

module.exports = MongoDb;