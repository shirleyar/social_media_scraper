'use strict';

const bunyan = require('bunyan'),
	consts = require('./constants');

const logger = bunyan.createLogger(
	{
		name: consts.appName,
		src: true,
		level: consts.logLevel,
		serializers: {
			savedDoc: savedDoc=>JSON.stringify(savedDoc),
			profiles: profiles=> JSON.stringify(profiles),
			err: bunyan.stdSerializers.err,
			res: bunyan.stdSerializers.res,
		},
	});

logger.fields = {time: 0, level: 1, msg: 2};

module.exports = logger;

