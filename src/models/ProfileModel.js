'use strict';

const mongoose = require('mongoose');

const profileStructure = {
	_id: String,
	firstName: String,
	lastName: String,
	favoriteColorRGB: Object,
	age: { type: Number, min: 0, max: 120 },
	followers: [Object]
};

const profileSchema = new mongoose.Schema(profileStructure);

const profiles = mongoose.model('Profiles', profileSchema);

module.exports = profiles;