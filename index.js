'use strict';
const path = require('path');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const utils = require('./lib/utils');

module.exports = function (name, alias, opts) {
	if (!name || typeof name !== 'string') {
		return Promise.reject(new Error('Provide a AWS Lambda function name.'));
	}

	if (!alias || typeof alias !== 'string') {
		return Promise.reject(new Error('Provide an alias name.'));
	}

	opts = opts || {};

	// Load the credentials
	AWS.config.region = opts.awsRegion || 'us-west-1';

	if (opts.awsProfile) {
		// Set the `credentials` property if a profile is provided
		const objectCredentials = {
			profile: opts.awsProfile
		};

		if (opts.awsFilename) {
			objectCredentials.filename = path.resolve(process.cwd(), opts.awsFilename);
		}

		AWS.config.credentials = new AWS.SharedIniFileCredentials(objectCredentials);
	}

	// Create a lambda object
	const lambda = new AWS.Lambda();

	const options = {
		FunctionName: name,
		Name: alias
	};

	if (opts.version) {
		options.FunctionVersion = opts.version;
	}

	return utils.updateOrCreate(lambda, options);
};
