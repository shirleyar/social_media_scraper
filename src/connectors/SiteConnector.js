'use strict';

const axios = require('axios'),
	axiosRetry = require('axios-retry'),
	assert = require('assert'),
	consts = require('../utils/constants'),
	httpStatusCodes = require('http-status-codes'),
	logger = require('../utils/logger'),
	_ = require('lodash'),
	Promise = require('bluebird');

class SiteConnector {
	constructor() {
		this.cookie = "";
		this.axiosClient = axios.create();
		axiosRetry(this.axiosClient, {
			retries: consts.siteRetries,
			retryDelay: (retryCount) => {
				return retryCount * 100;
			}
		});
	}

	/*
	Logs in the social media website using the given username and password and returns the cookie token that was created in the website,
	 */
	login(username, password) {
		assert(username, 'username is empty');
		assert(password, 'password is empty');
		logger.debug('Logging in to website');
		const options = {
			method: 'post',
			timeout: consts.siteTimeout,
			url: `${consts.siteUrl}/${consts.loginEndpoint}`,
			data: {username, password}
		};
		return this.axiosClient(options)
			.then(response => {
				if (response.status === httpStatusCodes.OK && response.data.status === 'success') {
					logger.info('Connected successfully to website');
					this.cookie = _.get(response.headers, 'set-cookie[0]');
				} else {
					return Promise.reject(response);
				}
			}).catch(error => {
				logger.error({err: error}, 'Error during login to website');
				throw error;
			})
	}

	// Gets encoded basic data (name, age, favorite color, id) for given user id
	getBasicData(userId) {
		logger.debug(`Fetching basic info for user ${userId}`);
		const options = {
			method: 'get',
			timeout: consts.siteTimeout,
			url: `${consts.siteUrl}/${consts.userUrl}/${userId}`,
			headers: {'Cookie': this.cookie}
		};
		return this.axiosClient(options)
			.then(response => {
				if (response.status === httpStatusCodes.OK) {
					return Promise.resolve(response.data);
				}
			}).catch(error => {
				logger.error({err: error}, `Error during GET of basic data for user ${userId}`);
				throw error;
			})
	}

	/* Gets all followers for a given user id - wrapper function to recursive one
	Starts the recursion with initial parameters.
	Returns a list of all user (by id) followers in format [{id, firstName, lastName}]
	*/
	getFollowers(userId) {
		return this.getFollowersRecursively(userId, [], 0)
			.then(followers => {
				logger.info(`Retrieved followers for user ${userId} successfully`);
				logger.trace({profiles: followers}, `Retrieved followers for user ${userId} successfully`);
				return Promise.resolve(followers);
			}).catch(error => {
				logger.error({err: error}, `Error during GET of followers for user ${userId}`);
				throw error;
			});
	}

	/* Recursive function that utilized by getFollowers(userId).
	Each time the api will return 10 or less followers.
	This function calls the next followers batch, based on a 'more' flag in the previous batch.
	*/
	getFollowersRecursively(userId, followers, skip) {
		const options = {
			method: 'get',
			url: `${consts.siteUrl}/${consts.userUrl}/${userId}/${consts.followersEndpoint}`,
			headers: {'Cookie': this.cookie},
			params: {
				skip
			},
			timeout: consts.siteTimeout,
		};
		return this.axiosClient(options)
			.then(response => {
					assert(response.status === httpStatusCodes.OK, `Response from server has a faulty status: ${response.status}`);
					followers = followers.concat(response.data.followers);
					logger.debug(`So far ${followers.length} followers for user ${userId}`);
					if (_.get(response, 'data.more')) {
						logger.debug(`Fetching more followers`);
						return Promise.resolve(() => setTimeout(() => this.getFollowersRecursively(userId, followers, skip + response.data.followers.length), consts.delayBetweenFollowersBatch));
					} else {
						logger.debug(`Done fetching followers for user ${userId}`);
						return Promise.resolve(followers);
					}
				}
			).catch(error => {
				logger.error({err: error}, `Error during followers fetch for user ${userId} (skip: ${skip})`);
				throw error;
			})
	}

}

module.exports = SiteConnector;