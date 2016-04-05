# lambda-update-alias

[![Build Status](https://travis-ci.org/SamVerschueren/lambda-update-alias.svg?branch=master)](https://travis-ci.org/SamVerschueren/lambda-update-alias)
[![Coverage Status](https://coveralls.io/repos/github/SamVerschueren/lambda-update-alias/badge.svg?branch=master)](https://coveralls.io/github/SamVerschueren/lambda-update-alias?branch=master)

> Update or create a AWS lambda alias


## Install

```
$ npm install --save lambda-update-alias
```


## Usage

```js
const updateAlias = require('lambda-update-alias');

updateAlias('myLambdaFunction', 'v1'}).then(result => {
	console.log(result);
	/*
	{
		AliasArn: 'arn:aws:lambda:us-west-1:123456789012:function:myLambdaFunction:v1',
		Name: 'v1',
		FunctionVersion: '3',
		Description: 'My lambda function description'
	}
	*/
});
```


## API

### updateAlias(name, alias, [options])

Returns a promise for the result object.

#### name

Type: `string`

Name of the lambda function.

#### alias

Type: `string`

Name of the alias that should be attached to the lambda function.

#### options

##### version

Type: `string`<br>
Default: *`latest`*

Name of the version where the alias should be attached to. If not provided, the alias will be attached to the version
with the highest number. `$LATEST` is treated as version `0`.

##### awsProfile

Type: `string`

[AWS Profile](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html). The user related to the profile should have
admin access to API Gateway and should be able to invoke `lambda:AddPermission`.

Can be overridden globally with the `AWS_PROFILE` environment variable.

##### awsFilename

Type: `string`

[Filename](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SharedIniFileCredentials.html#constructor-property) to use when loading credentials.

##### awsRegion

Type: `string`<br>
Default: `us-west-1`

AWS region.


## User Policy

The profile creating or updating the alias should be able to list the versions of the function and create and update the aliases.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1454507191000",
            "Effect": "Allow",
            "Action": [
                "lambda:CreateAlias",
                "lambda:ListVersionsByFunction",
                "lambda:UpdateAlias"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```


## Related

- [lambda-update-alias-cli](https://github.com/SamVerschueren/lambda-update-alias-cli) - CLI for this module


## License

MIT © [Sam Verschueren](https://github.com/SamVerschueren)
