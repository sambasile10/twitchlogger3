import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class APIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getMessagesLambda = new lambda.Function(this, 'MyLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getMessagesHandler.handler',
      code: lambda.Code.fromAsset('api/lambda'),
    });

    const dynamoDBGrantReadPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:BatchGetItem',
        'dynamodb:Scan',
        'dynamodb:Query',
      ],
      resources: ['*']
    });

    getMessagesLambda.addToRolePolicy(dynamoDBGrantReadPolicy);

    const api = new RestApi(this, 'TwitchLoggerAPI');
    const messagesResource = api.root.addResource('messages');
    const channelResource = messagesResource.addResource('{channel}');
    const userResource = channelResource.addResource('{username}');
    
    userResource.addMethod('GET', new LambdaIntegration(getMessagesLambda), {
      requestParameters: {
        'method.request.path.channel': true,
        'method.request.path.username': true,
        'method.request.querystring.week': false
      }
    });
  }
}