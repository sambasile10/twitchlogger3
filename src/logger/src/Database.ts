import { ChatMessage } from "./Chat";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, GetCommandInput, GetCommand, UpdateCommandInput, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);

const currentWeek: number = dayjs().week();

let dynamoClient: DynamoDBDocument;

export function getDynamoClient(): DynamoDBDocument {
  if (dynamoClient == null) {
    const dynamodbClient = new DynamoDBClient({ region: 'us-west-2' });
    dynamoClient = DynamoDBDocument.from(dynamodbClient);
  }

  return dynamoClient;
}

export async function getByUserId(channel: string, userId: string): Promise<Array<ChatMessage> | null> {
  if (channel == null || userId == null || channel.length < 1 || userId.length < 1) {
    console.warn(`Cannot query DynamoDB for channel: '${channel}' and userId: '${userId}'`);
    return null;
  }

  try {
    const input: GetCommandInput = {
      TableName: channel,
      Key: { ['userId']: userId }
    };

    const command = new GetCommand(input);
    const response = await dynamoClient.send(command);

    return <Array<ChatMessage> | null>(response.Item ?? null);
  } catch (err) {
    console.error(`Failed to fetch item from table '${channel}' where userId=${userId}.`, {
      cause: err
    });

    return null;
  }
}

export async function writeMessage(channel: string, item: ChatMessage): Promise<boolean> {
  const input: UpdateCommandInput = {
    TableName: channel,
    Key: {
      'username': item.username,
      'weekOfYear': currentWeek
    },
    UpdateExpression: 'SET #messages = list_append(if_not_exists(#messages, :emptyList), :newMessage)',
    ExpressionAttributeNames: {
      '#messages': 'messages'
    },
    ExpressionAttributeValues: {
      ':newMessage': [
        {
          message: item.message,
          timestamp: item.timestamp
        }
      ],
      ':emptyList': []
    },
  };

  try {
    const command = new UpdateCommand(input);
    await dynamoClient.send(command);
    return true;
  } catch (err) {
    console.error(`An error occured while writing a message to the table '${channel}'`, {
      cause: err
    });
    return false;
  }
}

getDynamoClient();