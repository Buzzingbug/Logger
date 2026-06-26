import { MessageReaction, User, PartialMessageReaction, PartialUser } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { LoggerClient } from '../client/LoggerClient';

const handler: EventHandler<'messageReactionRemove'> = {
  name: 'messageReactionRemove',
  async execute(client: LoggerClient, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    if (!reaction.message.guildId) return;

    // Fetch full reaction and user if partial
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Failed to fetch partial reaction: ', error);
        return;
      }
    }
    if (user.partial) {
      try {
        await user.fetch();
      } catch (error) {
        console.error('Failed to fetch partial user: ', error);
        return;
      }
    }

    const guildId = reaction.message.guildId;
    const channelId = reaction.message.channelId;

    // 1. Fetch Config
    const config = await ConfigManager.getConfig(guildId);
    if (!config) return;

    // 2. Filter Engine
    const eventId = 51; // Reaction Removed
    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId: guildId,
      channelId: channelId,
      targetId: reaction.message.author?.id || '',
      executorId: user.id,
    });

    if (isIgnored) return;

    // 3. Find target channel for routing
    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Messages'] || config.channelRoutes['main'];
    if (!targetChannelId) return;

    // Format emoji info
    const emoji = reaction.emoji;
    const emojiString = emoji.id ? `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>` : emoji.name;
    const emojiLink = emoji.url ? `[${emoji.name}_](${emoji.url})` : 'None (Standard Emoji)';

    const jumpUrl = `https://discord.com/channels/${guildId}/${channelId}/${reaction.message.id}`;

    // 4. Build Embed
    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Messages'] || EMBED_COLORS.Messages,
      authorName: 'Reaction Removed',
      authorIconURL: client.user?.displayAvatarURL() || '',
      typeId: eventId,
      description: `<@${user.id}> removed a reaction from a message\n\n**Emoji:** ${emojiString}\n**Link to emoji:** ${emojiLink}\n[Jump to message](${jumpUrl})`,
      messageId: reaction.message.id,
    });

    // 5. Dispatch via Webhook
    const webhook = await webhookManager.getWebhook(targetChannelId);
    if (webhook) {
      await webhook.send({ 
        content: `**Reaction Removed** | User ID: \`${user.id}\``,
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
