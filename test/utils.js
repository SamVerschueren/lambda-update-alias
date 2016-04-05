import test from 'ava';
import sinon from 'sinon';
import {updateOrCreate} from '../lib/utils';

const resourceNotFoundException = new Error('Resource not found');
resourceNotFoundException.code = 'ResourceNotFoundException';

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

test.beforeEach(t => {
	const listVersionsStub = sinon.stub();
	listVersionsStub.withArgs({FunctionName: 'foo'}).yields(undefined, fooVersions);
	listVersionsStub.withArgs({FunctionName: 'bar'}).yields(undefined, barVersions);
	listVersionsStub.withArgs({FunctionName: 'baz'}).yields(undefined, {Versions: []});
	listVersionsStub.withArgs({FunctionName: 'bax'}).yields(undefined, {});

	const updateAliasStub = sinon.stub();
	updateAliasStub.withArgs({FunctionName: 'foo', FunctionVersion: '2'}).yields(undefined, {foo: 'bar'});
	updateAliasStub.yields(resourceNotFoundException);

	const createAliasStub = sinon.stub();
	createAliasStub.yields(undefined, {foo: 'bar'});

	const lambda = {};
	lambda.listVersionsByFunction = listVersionsStub;
	lambda.updateAlias = updateAliasStub;
	lambda.createAlias = createAliasStub;

	t.context.lambda = lambda;
});

test('`listVersionsByFunction` should be called if no `version` is provided', async t => {
	const lambda = t.context.lambda;
	await updateOrCreate(lambda, {FunctionName: 'foo'});
	t.same(lambda.listVersionsByFunction.args[0][0], {FunctionName: 'foo'});
});

test('`listVersionsByFunction` should not be called if `version` is provided', async t => {
	const lambda = t.context.lambda;
	await updateOrCreate(lambda, {FunctionName: 'foo', FunctionVersion: '1'});
	t.true(lambda.listVersionsByFunction.callCount === 0);
});

test('error if no versions could be found', t => {
	const lambda = t.context.lambda;
	t.throws(updateOrCreate(lambda, {FunctionName: 'baz'}), 'No versions found.');
	t.throws(updateOrCreate(lambda, {FunctionName: 'bax'}), 'No versions found.');
});

test('`updateAlias` should be called', async t => {
	const lambda = t.context.lambda;
	await updateOrCreate(lambda, {FunctionName: 'foo'});
	t.same(lambda.updateAlias.args[0][0], {
		FunctionName: 'foo',
		FunctionVersion: '2'
	});
});

test('`createAlias` if alias does not exist', async t => {
	const lambda = t.context.lambda;
	await updateOrCreate(lambda, {FunctionName: 'bar'});
	t.same(lambda.createAlias.args[0][0], {
		FunctionName: 'bar',
		FunctionVersion: '$LATEST'
	});
});
