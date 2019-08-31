'use strict';
var pify = require('pify');
var objectAssign = require('object-assign');
var Promise = require('pinkie-promise');

function getAllVersions(lambda, opts, previousVersions, maxItems, marker) {
	var params = { FunctionName: opts.FunctionName };

	if (marker) {
		params.Marker = marker;
	}

	if (maxItems) {
		// By default, AWS returns 50 items
		params.MaxItems = maxItems
	}

	return pify(lambda.listVersionsByFunction.bind(lambda), Promise)(params)
		.then(function (data) {
			if (!data.Versions || data.Versions.length === 0) {
				if (previousVersions.length === 0) {
					throw new Error('No versions found.');
				}

				return previousVersions;
			}

			var newVersions = previousVersions.concat(data.Versions);
			if (data.NextMarker) {
				return getAllVersions(lambda, opts, newVersions, maxItems, data.NextMarker);
			}

			return newVersions;
		});
}

function findLatestVersion(lambda, opts) {
	if (opts.FunctionVersion) {
		// Return the function version if it was provided
		return Promise.resolve(opts.FunctionVersion);
	}

	return getAllVersions(lambda, opts, [])
		.then(function (versions) {
			// Sort all the versions
			versions.sort(function (a, b) {
				var aVersion = a.Version === '$LATEST' ? 0 : parseInt(a.Version, 10);
				var bVersion = b.Version === '$LATEST' ? 0 : parseInt(b.Version, 10);

				return bVersion - aVersion;
			});

			return versions[0].Version;
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
