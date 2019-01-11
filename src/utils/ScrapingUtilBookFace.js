'use strict';

const axios = require('axios'),
	Graph = require('../datas structures/Graph'),
	consts = require('./constants'),
	logger = require('./logger'),
	errorHandler = require('./error-handler'),
	httpStatusCodes = require('http-status-codes'),
	_ = require('lodash'),
	Promise = require('bluebird'),
	assert = require('assert');
require("google-closure-library");
goog.require('goog.crypt.base64');

class ScrapingUtilBookFace {
	constructor() {
		this._userId = {value: undefined};
		this._fName = {value: undefined};
		this._lName = {value: undefined};
		this._age = undefined;
		this._favoriteColor = {r: undefined, g: undefined, b: undefined};
	}

	getFollowingByUser() {
		const usersGraph = new Graph();
	}

	/*
	* Basic data is partially encoded to Base64. The function decodes it and returns the user's is, name, age, and favorite RGB color.
	*/
	decodeBasicData(data) {
		assert(!_.isEmpty(data), 'data is not valid');
		return new Promise((resolve, reject) => {
				try {
					const bytes = goog.crypt.base64.decodeStringToByteArray(data);
					let i = 0;
					//skip preceding blank chars
					i = this.extractUnicode(bytes, i, this._userId);
					i = this.extractUnicode(bytes, i, this._fName);
					i = this.extractUnicode(bytes, i, this._lName);
					i = this.extractAge(bytes, i);
					i = this._extractColor(bytes, i);
					resolve({
						id: this._userId.value,
						firstName: this._fName.value,
						lastName: this._lName.value,
						age: this._age,
						favoriteColor: this._favoriteColor
					});
				} catch
					(error) {
					logger.error({err: error}); // todo: error handling
					reject(error);
				}
			}
		);
	}

	skipBlankChars(bytes, i) {
		while (this.isBlankChar(bytes[i])) {
			i++;
		}
		return i;
	}


	isBlankChar(byte) {
		return !(_.inRange(byte, consts.A, consts.Z+1) || _.inRange(byte, consts.a, consts.z+1) || _.inRange(byte, consts['0'], consts['9']+1));
	}

	extractUnicode(bytes, i, field) {
		i = this.skipBlankChars(bytes,i);
		let str='';
		while (i< bytes.length && !this.isBlankChar(bytes[i])) {
			str = str.concat(String.fromCharCode(bytes[i]));
			i++;
		}
		if (i === bytes.length) {
			throw new Error ('Reached end of input too soon!');
		}
		field.value = str;
		return i;
	}

	extractAge(bytes, i) {
		this._age = bytes[++i];
		return i+1;
	}

	_extractColor(bytes, i) {
		this._favoriteColor.r = bytes[++i];
		this._favoriteColor.g = bytes[++i];
		this._favoriteColor.b = bytes[++i];
		return i;
	}

}

module.exports = ScrapingUtilBookFace;