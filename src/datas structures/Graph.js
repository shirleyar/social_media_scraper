'use strict';

const _ = require('lodash'),
	assert = require('assert');

class Graph {
	constructor() {
		this._adjacencyList = {};
	}

	addNode(id, adjArr) {
		assert(!_.isNil(id) && !this.includes(id), "Invalid id in addNode arguments");
		assert(!_.isNil(adjArr) && Array.isArray(adjArr), "Invalid adjArr in addNode arguments");
		this._adjacencyList[id] = adjArr;
	}

	includes(id) {
		return !_.isNil(this._adjacencyList[id]);
	}
}

module.exports = Graph;