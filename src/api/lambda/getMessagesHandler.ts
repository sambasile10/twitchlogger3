import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, GetCommand, GetCommandInput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);

const currentWeek: number = dayjs().week();

export const handler = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const dynamoClient = DynamoDBDocument.from(new DynamoDBClient({ region: 'us-west-2' }));

  const channel: string = event.pathParameters!.channel!.toLowerCase();
  const username: string = event.pathParameters!.username!.toLowerCase();
  const week: number = Number(event.queryStringParameters?.week) ?? dayjs().week();

  try {
    const input: GetCommandInput = {
      TableName: channel,
      Key: { 
        'username': username,
        'weekOfYear': currentWeek
      }
    };

    const command = new GetCommand(input);
    const response = await dynamoClient.send(command);

    if(response) {
      return {
        statusCode: 200,
        body: JSON.stringify(response)
      }
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No messages found' })
      }
    }
  } catch (err) {
    console.error(`An error occured while fetching logs for channel '${channel}' and user '${username}'`, err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    }
  }
}