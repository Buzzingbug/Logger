import { Message } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { LoggerClient } from '../client/LoggerClient';

const handler: EventHandler<'messageCreate'> = {
  name: 'messageCreate',
  async execute(client: LoggerClient, message: Message) {
    if (!message.guildId || message.author.bot) return;
    
    // Save to our custom TTL map for edit/delete diffing
    client.cacheMessage(message);

  }
};

export default handler;
