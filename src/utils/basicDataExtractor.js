'use strict';

const consts = require('./constants'),
	logger = require('./logger'),
	_ = require('lodash'),
	Promise = require('bluebird'),
	assert = require('assert');
require("google-closure-library");
goog.require('goog.crypt.base64');

/*
* Basic data is Base64 encoded. The function decodes it and returns the user's id, name, age, and favorite RGB color.
*/
function extractBasicData(data) {
	assert(data, 'data is not valid');
	return new Promise((resolve, reject) => {
			try {
				// prepares variables to pass by reference
				const userId = {value: undefined};
				const fName = {value: undefined};
				const lName = {value: undefined};
				const age = {value: undefined};
				const favoriteColor = {r: undefined, g: undefined, b: undefined};
				// decode encoded string to bytes array
				const bytes = goog.crypt.base64.decodeStringToByteArray(data);
				let i = 0;
				//skip preceding blank chars. order is based on the returned string pattern.
				i = extractUnicode(bytes, i, userId);
				i = extractUnicode(bytes, i, fName);
				i = extractUnicode(bytes, i, lName);
				i = extractAge(bytes, i, age);
				i = extractColor(bytes, i, favoriteColor);  // for readability, maintainability and consistency purposes
				resolve({
					id: userId.value,
					firstName: fName.value,
					lastName: lName.value,
					age: age.value,
					favoriteColor
				});
			} catch (error) {
				logger.error({err: error}, 'Error during basic data extraction');
				reject(error);
			}
		}
	);

	// skips all blank characters (not alpha-numeric) from current index i and returns the index of the first valid character (alpha-numeric).
	function skipBlankChars(bytes, i) {
		while (isBlankChar(bytes[i])) {
			i++;
		}
		return i;
	}

	// checks if the current byte represents an alpha-numeric character
	function isBlankChar(byte) {
		// +1 since inRange by lodash exclude the upper bound
		return !(_.inRange(byte, consts.A, consts.Z + 1) || _.inRange(byte, consts.a, consts.z + 1) || _.inRange(byte, consts['0'], consts['9'] + 1));
	}

	// extracts strings such as names and id. Returns the index of the next byte to process after the extracted info.
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

	// extract the user's age. Returns the index of the next byte to process after the extracted info.
	function extractAge(bytes, i, age) {
		age.value = bytes[++i];
		return i + 1;
	}

	// extracts the RGB color value from the bytes array. currently will extract the B value. Returns the index of the next byte to process after the extracted info.
	function extractColor(bytes, i, favoriteColor) {
		favoriteColor.b = bytes[++i];
		favoriteColor.g = bytes[++i];
		favoriteColor.r = bytes[++i];
		return i;
	}
}

module.exports = extractBasicData;