import { GuildBan, AuditLogEvent } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { LoggerClient } from '../client/LoggerClient';
import { AuditLogFetcher } from '../utils/AuditLogFetcher';

const handler: EventHandler<'guildBanRemove'> = {
  name: 'guildBanRemove',
  async execute(client: LoggerClient, ban: GuildBan) {
    if (ban.partial) await ban.fetch();
    
    const guildId = ban.guild.id;
    const targetId = ban.user.id;

    const config = await ConfigManager.getConfig(guildId);
    if (!config) return;

    let executorId = 'Unknown';
    let executorMention = 'Unknown';

    const entry = await AuditLogFetcher.fetchLatestEntry(
      ban.guild,
      AuditLogEvent.MemberBanRemove,
      targetId
    );

    if (entry && entry.executor) {
      executorId = entry.executor.id;
      executorMention = `<@${executorId}>`;
    }

    const eventId = 43; // Unban
    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId,
      channelId: '', 
      targetId,
      executorId: executorId !== 'Unknown' ? executorId : '',
    });

    if (isIgnored) return;

    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Modlogs'] || config.channelRoutes['main'];
    if (!targetChannelId) return;

    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Modlogs'] || EMBED_COLORS.Modlogs,
      authorName: 'Unban',
      authorIconURL: client.user?.displayAvatarURL() || '',
      typeId: eventId,
      description: `**User**\n${ban.user.tag} (<@${targetId}>)\n\n**Moderator**\n${executorMention}`,
      messageId: '', 
    });

    const webhook = await webhookManager.getWebhook(targetChannelId);
    if (webhook) {
      await webhook.send({ 
        content: `🕊️ **User Unbanned** | User ID: \`${targetId}\``,
        embeds: [embed] 
      }).catch(err => {
        if (err.code === 10015) webhookManager.invalidateWebhook(targetChannelId);
      });
    }
  }
};

export default handler;
