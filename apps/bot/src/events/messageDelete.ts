import { Message, PartialMessage } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { LoggerClient } from '../client/LoggerClient';

const handler: EventHandler<'messageDelete'> = {
  name: 'messageDelete',
  async execute(client: LoggerClient, message: Message | PartialMessage) {
    if (!message.guildId) return;

    // 1. Fetch Config
    const config = await ConfigManager.getConfig(message.guildId);
    if (!config) return;

    // 2. Filter Engine & PluralKit Check
    const eventId = 5; // Delete Single Message
    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId: message.guildId,
      channelId: message.channelId,
      targetId: message.author?.id || '',
      executorId: '', 
    });

    if (isIgnored) return;

    // PluralKit Integration: If a webhook message with similar content was just created,
    // this was a proxy replacement. Skip logging to prevent spam.
    const recentMessages = await message.channel.messages.fetch({ limit: 5 }).catch(() => null);
    if (recentMessages) {
      const isPluralKitProxy = message.content && recentMessages.some(m => 
        m.webhookId && m.content === message.content
      );
      if (isPluralKitProxy) {
        console.log(`Skipped proxy message delete for ${message.id}`);
        return;
      }
    }

    // 3. Find target channel for routing
    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Messages'] || config.channelRoutes['main'];
    if (!targetChannelId) return;

    // 4. Try to recover content from cache
    let content = message.content || '*Message content not cached.*';
    const cached = client.messageCache.get(message.id);
    if (cached) {
      content = cached.content || '*No content.*';
    }

    // 5. Build Embed
    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Messages'] || EMBED_COLORS.Messages,
      authorName: 'Message Deleted',
      authorIconURL: client.user?.displayAvatarURL() || '',
      typeId: eventId,
      description: `**Author:** <@${message.author?.id || cached?.authorId || 'Unknown'}>\n**Channel:** <#${message.channelId}>\n\n**Content:**\n${content}`,
      messageId: message.id,
    });

    // 6. Dispatch via Webhook
    const webhook = await webhookManager.getWebhook(targetChannelId);
    if (webhook) {
      const authorId = message.author?.id || cached?.authorId || 'Unknown';
      await webhook.send({ 
        content: `🗑️ **Message Deleted** | User ID: \`${authorId}\``,
        embeds: [embed] 
      }).catch(err => {
        if (err.code === 10015) {
          webhookManager.invalidateWebhook(targetChannelId);
        }
      });
    }
  }
};

export default handler;
