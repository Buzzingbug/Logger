import { Message, PartialMessage } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { LoggerClient } from '../client/LoggerClient';
import { t } from '../utils/i18n';

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
    let content = message.content || '';
    const cached = client.messageCache.get(message.id);
    let attachments: { name: string; url: string; proxyURL: string }[] = [];

    if (cached) {
      content = cached.content || content;
      attachments = cached.attachments;
    } else if (!message.partial) {
      attachments = message.attachments.map(a => ({
        name: a.name,
        url: a.url,
        proxyURL: a.proxyURL
      }));
    }

    const hasMedia = attachments.length > 0;

    // Check specific log options
    const logText = config.otherOptions?.logTextMessageDeletes ?? true;
    const logMedia = config.otherOptions?.logMediaMessageDeletes ?? true;

    if (hasMedia && !logMedia) return;
    if (!hasMedia && !logText) return;

    // 5. Build Embed
    const lang = (config.otherOptions as any)?.language || 'en-US';
    
    let description = '';
    
    if (content) {
      description = t('message_deleted_desc', lang, { channel: `<#${message.channelId}>`, content });
    } else if (!hasMedia) {
      description = t('message_deleted_no_content', lang, { channel: `<#${message.channelId}>` });
    } else {
      description = t('message_deleted_media_only', lang, { channel: `<#${message.channelId}>` });
    }

    if (hasMedia) {
      description += t('deleted_media', lang, { count: attachments.length });
      attachments.forEach((a) => {
        description += `[${a.name}](${a.proxyURL})\n`;
      });
    }

    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Messages'] || EMBED_COLORS.Messages,
      authorName: t('message_deleted_title', lang),
      authorIconURL: client.user?.displayAvatarURL() || '',
      typeId: eventId,
      description: description.trim(),
      messageId: message.id,
    });

    // 6. Dispatch via Webhook
    const webhook = await webhookManager.getWebhook(targetChannelId);
    if (webhook) {
      const authorId = message.author?.id || cached?.authorId || t('unknown_user', lang);
      await webhook.send({ 
        content: `🗑️ **${t('message_deleted_title', lang)}** | ${t('author', lang)} ID: \`${authorId}\``,
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
