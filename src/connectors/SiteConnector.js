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
			retries: 10,
			retryDelay: (retryCount) => {
				return retryCount * 500;
			}
		});
	}

	/*
	Logs in the social media website using the given username and password and returns the cookie token that was created in the website,
	 */
	login(username, password) {
		assert(username);
		assert(password);
		logger.debug('Logging in to website');
		const options = {
			method: 'post',
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
				//todo: error handling
				console.log(error);
			})
	}

	getBasicData(userId) {
		logger.debug(`Fetching basic info for user ${userId}`);
		const options = {
			method: 'get',
			url: `${consts.siteUrl}/${consts.userUrl}/${userId}`,
			headers: {'Cookie': this.cookie}
		};
		return this.axiosClient(options)
			.then(response => {
				if (response.status === httpStatusCodes.OK) {
					return Promise.resolve(response.data);
				}
			}).catch(error => {
				logger.error({err: error}); // todo: error handling
			})
	}

	getFollowers(userId) {
		return this.getFollowersRecursively(userId, [], 0)
			.then(followers => {
				logger.info(`Retrieved followers for user ${userId} successfully`);
				logger.trace({followers}, `Retrieved followers for user ${userId} successfully`);
				return Promise.resolve(followers);
			}).catch(error => {
				console.log(error); // todo: error handling
			});
	}

	getFollowersRecursively(userId, followers, skip) {
		const options = {
			method: 'get',
			url: `${consts.siteUrl}/${consts.userUrl}/${userId}/${consts.followersEndpoint}`,
			headers: {'Cookie': this.cookie},
			params: {
				skip
			}
		};
		return this.axiosClient(options)
			.then(response => {
					assert(response.status === httpStatusCodes.OK, `Response from server has a faulty status: ${response.status}`);
					followers = followers.concat(response.data.followers);
					logger.debug(`So far ${followers.length} followers for user ${userId}`);
					if (response.data.more) {
						logger.debug(`Fetching more followers`);
						return new Promise((resolve, reject) => {
							return setTimeout(() => resolve(this.getFollowersRecursively(userId, followers, skip + response.data.followers.length), 500));
						});
					} else {
						logger.debug(`Done fetching followers for user ${userId}`);
						return Promise.resolve(followers);
					}
				}
			).catch(error => {
				// todo: error handling
				console.log(error);
			})
	}

}

module.exports = SiteConnector;