'use strict';

const mongoose = require('mongoose');

const profileStructure = {
	_id: {
		type: String,
		required: true
	},
	firstName: {
		type: String,
		required: true
	},
	lastName: {
		type: String,
		required: true
	},
	favoriteColorRGB: {
		type: Object,
		required: true
	},
	age:
		{ type: Number,
			min: 0,
			max: 120,
			required: true
		},
	followers: [Object]
};

const profileSchema = new mongoose.Schema(profileStructure);

const profiles = mongoose.model('Profiles', profileSchema);

module.exports = profiles;