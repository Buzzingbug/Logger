import { Events, NonThreadGuildBasedChannel, DMChannel } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { t } from '../utils/i18n';
import { LoggerClient } from '../client/LoggerClient';

const handler: EventHandler<'channelDelete'> = {
  name: Events.ChannelDelete,
  async execute(client: LoggerClient, channel: DMChannel | NonThreadGuildBasedChannel) {
    if (channel.isDMBased() || !channel.guild) return;

    const config = await ConfigManager.getConfig(channel.guild.id);
    if (!config) return;

    const eventId = 28; // Channel Delete
    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId: channel.guild.id,
      channelId: channel.id,
      targetId: '',
      executorId: '', 
    });

    if (isIgnored) return;

    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Channels'] || config.channelRoutes['main'];
    if (!targetChannelId) return;

    const lang = config.otherOptions?.language || 'en-US';

    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Channels'] || EMBED_COLORS.Channels,
      authorName: t('channel_deleted_title', lang),
      authorIconURL: channel.guild.iconURL() || '',
      typeId: eventId,
      description: `**${t('name', lang)}:** \`${channel.name}\`\n**${t('type', lang)}:** ${channel.type}\n**${t('category', lang)}:** ${channel.parentId ? `<#${channel.parentId}>` : t('none', lang)}\n**ID:** \`${channel.id}\``
    });

    try {
      const auditLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: 12 }).catch(() => null); // 12 is CHANNEL_DELETE
      const log = auditLogs?.entries.first();
      
      let content = `🗑️ **${t('channel_deleted_title', lang)}**`;
      if (log && (log.target as any)?.id === channel.id && Date.now() - log.createdTimestamp < 5000) {
        content += ` | ${t('executor', lang)}: <@${log.executor?.id}>`;
      }
      
      const webhook = await webhookManager.getWebhook(targetChannelId);
      if (webhook) {
        await webhook.send({ content, embeds: [embed] }).catch(err => {
          if (err.code === 10015) webhookManager.invalidateWebhook(targetChannelId);
        });
      }
    } catch (err) {
      console.error('Failed to log channelDelete', err);
    }
  }
};

export default handler;
