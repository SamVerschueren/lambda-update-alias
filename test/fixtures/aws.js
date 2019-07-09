'use strict';
const AWS = require('aws-sdk');

const lambda = new AWS.Lambda();

AWS.Lambda = function () {
	return lambda;
};

module.exports = {
	lambda,
	config: AWS.config
};
