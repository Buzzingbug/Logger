import { Events, NonThreadGuildBasedChannel, DMChannel } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { t } from '../utils/i18n';
import { LoggerClient } from '../client/LoggerClient';

const handler: EventHandler<'webhooksUpdate'> = {
  name: Events.WebhooksUpdate,
  async execute(client: LoggerClient, channel: DMChannel | NonThreadGuildBasedChannel) {
    if (channel.isDMBased() || !channel.guild) return;

    const config = await ConfigManager.getConfig(channel.guild.id);
    if (!config) return;

    const lang = config.otherOptions?.language || 'en-US';

    try {
      // Fetch latest audit logs for webhooks (types 50, 51, 52)
      const auditLogs = await channel.guild.fetchAuditLogs({ limit: 1 }).catch(() => null);
      if (!auditLogs) return;

      const log = auditLogs.entries.first();
      if (!log || Date.now() - log.createdTimestamp > 5000) return; // Ignore old logs

      let eventId = -1;
      let title = '';
      
      if (log.action === 50) { // WEBHOOK_CREATE
        eventId = 79;
        title = t('webhook_created_title', lang);
      } else if (log.action === 51) { // WEBHOOK_UPDATE
        eventId = 81;
        title = t('webhook_modified_title', lang);
      } else if (log.action === 52) { // WEBHOOK_DELETE
        eventId = 80;
        title = t('webhook_deleted_title', lang);
      } else {
        return; // Not a webhook event
      }

      const isIgnored = FilterEngine.shouldIgnore(config, {
        typeId: eventId,
        guildId: channel.guild.id,
        channelId: channel.id,
        targetId: (log.target as any)?.id || '',
        executorId: log.executor?.id || '', 
      });

      if (isIgnored) return;

      const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Channels'] || config.channelRoutes['main'];
      if (!targetChannelId) return;

      let description = `**${t('name', lang)}:** \`${(log.target as any)?.name || 'Unknown'}\`\n**${t('channel_id', lang)}:** <#${channel.id}>\n`;

      const embed = LogEmbedBuilder.build({
        color: config.embedColors['Channels'] || EMBED_COLORS.Channels,
        authorName: title,
        authorIconURL: channel.guild.iconURL() || '',
        typeId: eventId,
        description: description
      });

      const content = `🔗 **${title}** | ${t('executor', lang)}: <@${log.executor?.id}>`;
      
      const webhook = await webhookManager.getWebhook(targetChannelId);
      if (webhook) {
        await webhook.send({ content, embeds: [embed] }).catch(err => {
          if (err.code === 10015) webhookManager.invalidateWebhook(targetChannelId);
        });
      }
    } catch (err) {
      console.error('Failed to log webhookUpdate', err);
    }
  }
};

export default handler;
