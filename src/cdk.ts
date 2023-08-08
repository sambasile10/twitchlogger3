import * as cdk from 'aws-cdk-lib';
import { APIStack } from './api/stack';
import { TwitchLoggerStack } from './logger/stack';

const app = new cdk.App();
const apiStack = new APIStack(app, 'APIStack');
const loggerStack = new TwitchLoggerStack(app, 'LoggerStack');
app.synth();