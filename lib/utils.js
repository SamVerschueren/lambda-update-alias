/* eslint-disable prefer-arrow-callback */
'use strict';
const objectAssign = require('object-assign');
const Promise = require('bluebird');

const MAX_RECURSION = 10;

function findAllVersions(lambda, opts) {
	// Recursive function to continually call the Lambda paginated
	// endpoint to get list of versions by function with the specified
	// MAX_RECURSION limit in the case that the number of versions
	// available for the lambda exceeds the page limit.
	function listAllVersions(params = {}, numOfRec = MAX_RECURSION, currentListOfVersions = []) {
		if (numOfRec <= 0) {
			return {
				Versions: currentListOfVersions
			};
		}

		return lambda.listVersionsByFunction(params)
			.promise()
			.then(function (result) {
				if (!result.Versions || result.Versions.length === 0) {
					return {
						Versions: currentListOfVersions
					};
				}

				const truncatedVersions = result.Versions.concat(currentListOfVersions);
				if (!result.NextMarker) {
					return {
						Versions: truncatedVersions
					};
				}

				return listAllVersions(
					objectAssign({}, params, {Marker: result.NextMarker}),
					numOfRec - 1,
					truncatedVersions
				);
			});
	}

	return listAllVersions({FunctionName: opts.FunctionName});
}

function findLatestVersion(lambda, opts) {
	if (opts.FunctionVersion) {
		// Return the function version if it was provided
		return Promise.resolve(opts.FunctionVersion);
	}

	return findAllVersions(lambda, opts)
		.then(function (data) {
			if (!data.Versions || data.Versions.length === 0) {
				return Promise.reject(new Error('No versions found.'));
			}

			// Sort all the versions
			data.Versions.sort(function (a, b) {
				const aVersion = a.Version === '$LATEST' ? 0 : parseInt(a.Version, 10);
				const bVersion = b.Version === '$LATEST' ? 0 : parseInt(b.Version, 10);

				return bVersion - aVersion;
			});

			return data.Versions[0].Version;
		});
}

function updateOrCreate(lambda, opts) {
	const options = objectAssign({}, opts);

	return findLatestVersion(lambda, opts)
		.then(function (version) {
			options.FunctionVersion = version;

			// Try to update the version first
			return lambda.updateAlias(options).promise();
		})
		.catch(function (error) {
			if (error.code === 'ResourceNotFoundException') {
				// If the alias does not exist yet, create it
				return lambda.createAlias(options).promise();
			}

			throw error;
		});
}

exports.updateOrCreate = updateOrCreate;
exports.MAX_RECURSION = MAX_RECURSION;
