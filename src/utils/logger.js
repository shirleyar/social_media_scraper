'use strict';

const bunyan = require('bunyan'),
	consts = require('./constants'),
	_ = require('lodash');

const logger = bunyan.createLogger(
	{
		name: consts.appName,
		src: true,
		level: consts.logLevel,
		serializers: {
			data: echoSerializer,
			err: errorSerializer,
			res: bunyan.stdSerializers.res,
		},
	});

function echoSerializer(obj) {
	return obj;
}

function errorSerializer(error) {
	return {message, name, source, stack} = error;
}

logger.fields={time: 0, level: 1, poll_id: 2, msg: 3};

module.exports = logger;

