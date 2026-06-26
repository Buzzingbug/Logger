import { GuildMember, PartialGuildMember, AuditLogEvent } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { LoggerClient } from '../client/LoggerClient';
import { AuditLogFetcher } from '../utils/AuditLogFetcher';

const handler: EventHandler<'guildMemberRemove'> = {
  name: 'guildMemberRemove',
  async execute(client: LoggerClient, member: GuildMember | PartialGuildMember) {
    const guildId = member.guild.id;
    const targetId = member.id;

    const config = await ConfigManager.getConfig(guildId);
    if (!config) return;

    // Check if it was a Kick
    let isKick = false;
    let executorId = 'Unknown';
    let executorMention = 'Unknown';
    let reason = '[no reason provided]';

    const kickEntry = await AuditLogFetcher.fetchLatestEntry(
      member.guild,
      AuditLogEvent.MemberKick,
      targetId
    );

    if (kickEntry && kickEntry.executor) {
      isKick = true;
      executorId = kickEntry.executor.id;
      executorMention = `<@${executorId}>`;
      if (kickEntry.reason) reason = kickEntry.reason;
    }

    const eventId = isKick ? 41 : 2; // 41 = Kick, 2 = Member Leave
    const categoryName = isKick ? 'Modlogs' : 'Members';

    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId,
      channelId: '', 
      targetId,
      executorId: isKick && executorId !== 'Unknown' ? executorId : '',
    });

    if (isIgnored) return;

    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes[categoryName] || config.channelRoutes['main'];
    if (!targetChannelId) return;

    let description = `**User**\n${member.user.tag} (<@${targetId}>)`;
    if (isKick) {
      description += `\n\n**Moderator**\n${executorMention}\n\n**Reason**\n${reason}`;
    }

    const embed = LogEmbedBuilder.build({
      color: config.embedColors[categoryName] || EMBED_COLORS[categoryName],
      authorName: isKick ? 'Kick' : 'Member Left',
      authorIconURL: client.user?.displayAvatarURL() || '',
      typeId: eventId,
      description,
      messageId: '', 
    });

    const webhook = await webhookManager.getWebhook(targetChannelId);
    if (webhook) {
      const emoji = isKick ? '👢' : '👋';
      const text = isKick ? 'User Kicked' : 'Member Left';
      await webhook.send({ 
        content: `${emoji} **${text}** | User ID: \`${targetId}\``,
        embeds: [embed] 
      }).catch(err => {
        if (err.code === 10015) webhookManager.invalidateWebhook(targetChannelId);
      });
    }
  }
};

export default handler;
