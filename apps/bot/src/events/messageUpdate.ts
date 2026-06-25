import { Message, PartialMessage } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { LoggerClient } from '../client/LoggerClient';

const handler: EventHandler<'messageUpdate'> = {
  name: 'messageUpdate',
  async execute(client: LoggerClient, oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    if (!newMessage.guildId || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // Only log actual content edits

    const config = await ConfigManager.getConfig(newMessage.guildId);
    if (!config) return;

    const eventId = 7; // Edit Message
    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId: newMessage.guildId,
      channelId: newMessage.channelId,
      targetId: newMessage.author?.id || '',
      executorId: newMessage.author?.id || '',
    });

    if (isIgnored) return;

    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Messages'];
    if (!targetChannelId) return;

    let oldContent = oldMessage.content || '*Old content not cached.*';
    const cached = client.messageCache.get(newMessage.id);
    if (cached) {
      oldContent = cached.content;
    }

    const jumpUrl = `https://discord.com/channels/${newMessage.guildId}/${newMessage.channelId}/${newMessage.id}`;

    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Messages'] || EMBED_COLORS.Messages,
      authorName: 'Message Edited',
      authorIconURL: client.user?.displayAvatarURL() || '',
      typeId: eventId,
      description: `**Author:** <@${newMessage.author?.id}>\n**Channel:** <#${newMessage.channelId}>\n\n**Before:**\n${oldContent}\n\n**After:**\n${newMessage.content}\n\n[Jump to message](${jumpUrl})`,
      messageId: newMessage.id,
    });

    const webhook = await webhookManager.getWebhook(targetChannelId);
    if (webhook) {
      await webhook.send({ embeds: [embed] }).catch(err => {
        if (err.code === 10015) webhookManager.invalidateWebhook(targetChannelId);
      });
    }

    // Update the cache with the new content
    if (newMessage.partial) await newMessage.fetch();
    client.cacheMessage(newMessage as Message);
  }
};

export default handler;
