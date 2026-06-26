import { GuildBan, AuditLogEvent } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { LoggerClient } from '../client/LoggerClient';
import { AuditLogFetcher } from '../utils/AuditLogFetcher';

const handler: EventHandler<'guildBanAdd'> = {
  name: 'guildBanAdd',
  async execute(client: LoggerClient, ban: GuildBan) {
    if (ban.partial) await ban.fetch();
    
    const guildId = ban.guild.id;
    const targetId = ban.user.id;

    // 1. Fetch Config
    const config = await ConfigManager.getConfig(guildId);
    if (!config) return;

    // Determine Moderator & Reason via Audit Logs
    let executorId = 'Unknown';
    let executorMention = 'Unknown';
    let reason = ban.reason || '[no reason provided]';

    const entry = await AuditLogFetcher.fetchLatestEntry(
      ban.guild,
      AuditLogEvent.MemberBanAdd,
      targetId
    );

    if (entry && entry.executor) {
      executorId = entry.executor.id;
      executorMention = `<@${executorId}>`;
      if (!ban.reason && entry.reason) reason = entry.reason;
    }

    // 2. Filter Engine
    const eventId = 39; // Ban
    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId,
      channelId: '', 
      targetId,
      executorId: executorId !== 'Unknown' ? executorId : '',
    });

    if (isIgnored) return;

    // 3. Find target channel
    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Modlogs'] || config.channelRoutes['main'];
    if (!targetChannelId) return;

    // 4. Build Embed
    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Modlogs'] || EMBED_COLORS.Modlogs,
      authorName: 'Ban',
      authorIconURL: client.user?.displayAvatarURL() || '',
      typeId: eventId,
      description: `**User**\n${ban.user.tag} (<@${targetId}>)\n\n**Moderator**\n${executorMention}\n\n**Reason**\n${reason}`,
      messageId: '', 
    });

    // 5. Dispatch via Webhook
    const webhook = await webhookManager.getWebhook(targetChannelId);
    if (webhook) {
      await webhook.send({ 
        content: `🔨 **User Banned** | User ID: \`${targetId}\``,
        embeds: [embed] 
      }).catch(err => {
        if (err.code === 10015) webhookManager.invalidateWebhook(targetChannelId);
      });
    }
  }
};

export default handler;
