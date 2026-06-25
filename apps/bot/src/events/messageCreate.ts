import { Message } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { LoggerClient } from '../client/LoggerClient';

const handler: EventHandler<'messageCreate'> = {
  name: 'messageCreate',
  async execute(client: LoggerClient, message: Message) {
    if (!message.guildId || message.author.bot) return;
    
    // Save to our custom TTL map for edit/delete diffing
    client.cacheMessage(message);

    // If the message has attachments, ping the files microservice
    if (message.attachments.size > 0) {
      for (const [id, attachment] of message.attachments) {
        fetch('http://localhost:4000/api/v1/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guildId: message.guildId,
            channelId: message.channelId,
            fileId: attachment.id,
            fileUrl: attachment.url
          })
        }).catch(err => console.error(`Failed to send attachment to files service:`, err));
      }
    }
  }
};

export default handler;
