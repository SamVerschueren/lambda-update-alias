'use strict';

const fooVersions = {
	Versions: [
		{Version: '$LATEST'},
		{Version: '1'},
		{Version: '2'}
	]
};

const barVersions = {
	Versions: [
		{Version: '$LATEST'}
	]
};

const VERSIONS_PER_RESPONSE = 5;
const NUM_RESPONSES_IN_LARGE = 3;
const NUM_RESPONSES_IN_OVERFLOW = 50;

const largeNumOfVersions = [];
for (let i = 0; i < NUM_RESPONSES_IN_LARGE; i++) {
	largeNumOfVersions.push(
		{
			NextMarker: (i === NUM_RESPONSES_IN_LARGE - 1) ? null : i + 1,
			Versions: []
		}
	);
	for (let j = 0; j < VERSIONS_PER_RESPONSE; j++) {
		largeNumOfVersions[i].Versions.push(
			{Version: (VERSIONS_PER_RESPONSE * i) + j}
		);
	}
}

const largeNumOfVersionsPastRecursionLimit = [];
for (let i = 0; i < NUM_RESPONSES_IN_OVERFLOW; i++) {
	largeNumOfVersionsPastRecursionLimit.push(
		{
			NextMarker: (i === NUM_RESPONSES_IN_OVERFLOW - 1) ? null : i + 1,
			Versions: []
		}
	);
	for (let j = 0; j < VERSIONS_PER_RESPONSE; j++) {
		largeNumOfVersionsPastRecursionLimit[i].Versions.push(
			{Version: (VERSIONS_PER_RESPONSE * i) + j}
		);
	}
}

module.exports = {
	fooVersions,
	barVersions,
	largeNumOfVersions,
	largeNumOfVersionsPastRecursionLimit
};
