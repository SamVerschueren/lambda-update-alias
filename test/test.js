import path from 'path';
import test from 'ava';
import sinon from 'sinon';
import utils from '../lib/utils';
import aws from './fixtures/aws';

import m from '..';

test.before(() => {
	sinon.stub(utils, 'updateOrCreate');
});

test('throw error if no lambda function name is provided', async t => {
	await t.throwsAsync(() => m(), 'Provide a AWS Lambda function name.');
});

test('throw error if no alias name is provided', async t => {
	await t.throwsAsync(() => m('foo'), 'Provide an alias name.');
});

test('specify the aws profile', async t => {
	await m('foo', 'v1', {awsProfile: 'foo-profile'});
	t.is(aws.config.credentials.profile, 'foo-profile');
});

test('specify the aws filename', async t => {
	await m('foo', 'v1', {awsProfile: 'foo-profile', awsFilename: './credentials'});
	t.is(aws.config.credentials.filename, path.resolve(process.cwd(), 'credentials'));
});

test.serial('use `us-west-1` as default region', async t => {
	await m('foo', 'v1');
	t.is(aws.config.region, 'us-west-1');
});

test.serial('provide region property', async t => {
	await m('foo', 'v1', {awsRegion: 'eu-west-1'});
	t.is(aws.config.region, 'eu-west-1');
});

test.serial('update or create the alias', async t => {
	await m('foo', 'v1');
	t.deepEqual(utils.updateOrCreate.lastCall.args[1], {
		FunctionName: 'foo',
		Name: 'v1'
	});
});

test.serial('update or create the alias on a specific version', async t => {
	await m('foo', 'v1', {version: '1'});
	t.deepEqual(utils.updateOrCreate.lastCall.args[1], {
		FunctionName: 'foo',
		FunctionVersion: '1',
		Name: 'v1'
	});
});
