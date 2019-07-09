import test from 'ava';
import sinon from 'sinon';
import {MAX_RECURSION, updateOrCreate} from '../lib/utils';
import {
	fooVersions,
	barVersions,
	largeNumOfVersions,
	largeNumOfVersionsPastRecursionLimit
} from './fixtures/versions';

const resourceNotFoundException = new Error('Resource not found');
resourceNotFoundException.code = 'ResourceNotFoundException';

test.beforeEach(t => {
	const listVersionsStub = sinon.stub();

	listVersionsStub.callsFake(({FunctionName, Marker}) => {
		Marker = Marker || 0;
		if (FunctionName === 'large') {
			return {
				promise: () => Promise.resolve(largeNumOfVersions[Marker])
			};
		}

		if (FunctionName === 'overflow') {
			return {
				promise: () => Promise.resolve(largeNumOfVersionsPastRecursionLimit[Marker])
			};
		}
	});

	listVersionsStub.withArgs({FunctionName: 'foo'}).returns({
		promise: () => Promise.resolve(fooVersions)
	});

	listVersionsStub.withArgs({FunctionName: 'bar'}).returns({
		promise: () => Promise.resolve(barVersions)
	});

	listVersionsStub.withArgs({FunctionName: 'baz'}).returns({
		promise: () => Promise.resolve({Versions: []})
	});

	listVersionsStub.withArgs({FunctionName: 'bax'}).returns({
		promise: () => Promise.resolve({})
	});

	const updateAliasStub = sinon.stub();
	updateAliasStub.withArgs({FunctionName: 'foo', FunctionVersion: '2'}).returns({
		promise: () => Promise.resolve({foo: 'bar'})
	});
	updateAliasStub.returns({
		promise: () => Promise.reject(resourceNotFoundException)
	});

	const createAliasStub = sinon.stub();
	createAliasStub.returns({
		promise: () => Promise.resolve({foo: 'bar'})
	});

	const lambda = {};
	lambda.listVersionsByFunction = listVersionsStub;
	lambda.updateAlias = updateAliasStub;
	lambda.createAlias = createAliasStub;

	t.context.lambda = lambda;
});

test('`listVersionsByFunction` should be called if no `version` is provided', async t => {
	const {lambda} = t.context;
	await updateOrCreate(lambda, {FunctionName: 'foo'});
	t.deepEqual(lambda.listVersionsByFunction.args[0][0], {FunctionName: 'foo'});
});

test('`listVersionsByFunction` should not be called if `version` is provided', async t => {
	const {lambda} = t.context;
	await updateOrCreate(lambda, {FunctionName: 'foo', FunctionVersion: '1'});
	t.is(lambda.listVersionsByFunction.callCount, 0);
});

test('`listVersionsByFunction` should be called multiple times if paginated', async t => {
	const {lambda} = t.context;
	await updateOrCreate(lambda, {FunctionName: 'large'});
	t.is(lambda.listVersionsByFunction.callCount, 3);
	const returnValues = [
		await lambda.listVersionsByFunction.returnValues[0].promise(),
		await lambda.listVersionsByFunction.returnValues[1].promise(),
		await lambda.listVersionsByFunction.returnValues[2].promise()
	];

	t.is(returnValues[0].Versions.length, 5);
	t.is(returnValues[1].Versions.length, 5);
	t.is(returnValues[2].Versions.length, 5);
	t.deepEqual(lambda.listVersionsByFunction.args[0][0], {FunctionName: 'large'});
	t.deepEqual(lambda.listVersionsByFunction.args[1][0], {FunctionName: 'large', Marker: 1});
	t.deepEqual(lambda.listVersionsByFunction.args[2][0], {FunctionName: 'large', Marker: 2});
});

test('`listVersionsByFunction` should be limited to MAX_RECURSION limit', async t => {
	const {lambda} = t.context;
	await updateOrCreate(lambda, {FunctionName: 'overflow'});
	t.is(lambda.listVersionsByFunction.callCount, MAX_RECURSION);
	t.deepEqual(lambda.updateAlias.args[0][0], {
		FunctionName: 'overflow',
		FunctionVersion: 49
	});
});

test('error if no versions could be found', async t => {
	const {lambda} = t.context;
	await t.throwsAsync(() => updateOrCreate(lambda, {FunctionName: 'baz'}), 'No versions found.');
	await t.throwsAsync(() => updateOrCreate(lambda, {FunctionName: 'bax'}), 'No versions found.');
});

test('`updateAlias` should be called', async t => {
	const {lambda} = t.context;
	await updateOrCreate(lambda, {FunctionName: 'foo'});
	t.deepEqual(lambda.updateAlias.args[0][0], {
		FunctionName: 'foo',
		FunctionVersion: '2'
	});
});

test('`createAlias` if alias does not exist', async t => {
	const {lambda} = t.context;
	await updateOrCreate(lambda, {FunctionName: 'bar'});
	t.deepEqual(lambda.createAlias.args[0][0], {
		FunctionName: 'bar',
		FunctionVersion: '$LATEST'
	});
});
