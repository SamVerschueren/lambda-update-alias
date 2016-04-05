'use strict';
var AWS = require('aws-sdk');

var lambda = new AWS.Lambda();

AWS.Lambda = function () {
	return lambda;
};

module.exports = {
	lambda: lambda,
	config: AWS.config
};
