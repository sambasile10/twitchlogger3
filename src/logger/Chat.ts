import * as tmi from 'tmi.js';
import dayjs from 'dayjs';
import { writeMessage } from './Database';

export interface ChatMessage {
  userId: string,
  timestamp: number,
  message: string
}

interface ChatSession {
  isConnected: boolean,
  joinTime: number,
  totalMessages?: number
};

const sessions: Map<string, ChatSession> = new Map<string, ChatSession>();

const client: tmi.Client = new tmi.Client({
  options: { },
  connection: {
    reconnect: true,
    secure: true
  },
  channels: []
});

async function join(channel: string): Promise<void> {
  try {
    await client.join(channel);

    if (sessions.has(channel)) sessions.delete(channel);
    sessions.set(channel, {
      isConnected: true,
      joinTime: dayjs().unix()
    });

    console.log(`Joined channel ${channel}.`);
  } catch (err) {
    console.error(`An error occured while joining channel ${channel}.`);
    console.error(err);
  }
}

async function leave(channel: string): Promise<void> {
  if (!sessions.has(channel)) {
    console.warn(`No channel '${channel}' was found in the sessions list.`);
    return;
  }

  try {
    await client.part(channel);

    sessions.set(channel, {
      ...sessions.get(channel)!,
      isConnected: false
    });

    console.log(`Left channel ${channel}.`);
  } catch (err) {
    console.error(`An error occured while leaving channel ${channel}.`);
  }
}

function listen(): void {
  client.on('message', (channel, tags, message, self) => {
    if(self) return;

    console.log(`[${channel}] ${message} ${JSON.stringify(tags)}`);
    console.log(message);

    if (tags['user-id'] == undefined) return;

    const messageObject: ChatMessage = {
      userId: tags['user-id'],
      timestamp: dayjs().unix(),
      message: message
    };

    // TODO: To await or not to await?
    writeMessage(channel.substring(1), messageObject);
  });
}

async function start() {
  await client.connect();
  await join('xQc');
  listen();
}

// Remove me later
start();