'use strict';
var pify = require('pify');
var objectAssign = require('object-assign');
var Promise = require('pinkie-promise');

function findLatestVersion(lambda, opts) {
	if (opts.FunctionVersion) {
		// Return the function version if it was provided
		return Promise.resolve(opts.FunctionVersion);
	}

	return pify(lambda.listVersionsByFunction.bind(lambda), Promise)({FunctionName: opts.FunctionName})
		.then(function (data) {
			if (!data.Versions || data.Versions.length === 0) {
				throw new Error('No versions found.');
			}

			// Sort all the versions
			data.Versions.sort(function (a, b) {
				var aVersion = a.Version === '$LATEST' ? 0 : parseInt(a.Version, 10);
				var bVersion = b.Version === '$LATEST' ? 0 : parseInt(b.Version, 10);

				return bVersion - aVersion;
			});

			return data.Versions[0].Version;
		});
}

function updateOrCreate(lambda, opts) {
	var options = objectAssign({}, opts);

	return findLatestVersion(lambda, opts)
		.then(function (version) {
			options.FunctionVersion = version;

			// Try to update the version first
			return pify(lambda.updateAlias.bind(lambda), Promise)(options);
		})
		.catch(function (err) {
			if (err.code === 'ResourceNotFoundException') {
				// If the alias does not exist yet, create it
				return pify(lambda.createAlias.bind(lambda), Promise)(options);
			}

			throw err;
		});
}

exports.updateOrCreate = updateOrCreate;
