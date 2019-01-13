'use strict';

const consts = require('./constants'),
	logger = require('./logger'),
	errorHandler = require('./errorHandler'),
	_ = require('lodash'),
	Promise = require('bluebird'),
	assert = require('assert');
require("google-closure-library");
goog.require('goog.crypt.base64');

/*
* Basic data is partially encoded to Base64. The function decodes it and returns the user's is, name, age, and favorite RGB color.
*/
function extractBasicData(data) {
	assert(!_.isEmpty(data), 'data is not valid');
	return new Promise((resolve, reject) => {
			try {
				const userId = {value: undefined};
				const fName = {value: undefined};
				const lName = {value: undefined};
				const age = {value: undefined};
				const favoriteColor = {r: undefined, g: undefined, b: undefined};
				const bytes = goog.crypt.base64.decodeStringToByteArray(data);
				let i = 0;
				//skip preceding blank chars
				i = extractUnicode(bytes, i, userId);
				i = extractUnicode(bytes, i, fName);
				i = extractUnicode(bytes, i, lName);
				i = extractAge(bytes, i, age);
				i = extractColor(bytes, i, favoriteColor);
				resolve({
					id: userId.value,
					firstName: fName.value,
					lastName: lName.value,
					age: age.value,
					favoriteColor
				});
			} catch
				(error) {
				logger.error({err: error}); // todo: error handling
				reject(error);
			}
		}
	);


	function skipBlankChars(bytes, i) {
		while (isBlankChar(bytes[i])) {
			i++;
		}
		return i;
	}

	function isBlankChar(byte) {
		return !(_.inRange(byte, consts.A, consts.Z + 1) || _.inRange(byte, consts.a, consts.z + 1) || _.inRange(byte, consts['0'], consts['9'] + 1));
	}

	function extractUnicode(bytes, i, field) {
		i = skipBlankChars(bytes, i);
		let str = '';
		while (i < bytes.length && !isBlankChar(bytes[i])) {
			str = str.concat(String.fromCharCode(bytes[i]));
			i++;
		}
		if (i === bytes.length) {
			throw new Error('Reached end of input too soon!');
		}
		field.value = str;
		return i;
	}

	function extractAge(bytes, i, age) {
		age.value = bytes[++i];
		return i + 1;
	}

	function extractColor(bytes, i, favoriteColor) {
		favoriteColor.b = bytes[++i];
		favoriteColor.g = bytes[++i];
		favoriteColor.r = bytes[++i];
		return i;
	}
}

module.exports = extractBasicData;