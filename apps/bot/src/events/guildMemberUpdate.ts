import { GuildMember, PartialGuildMember, AuditLogEvent } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { LoggerClient } from '../client/LoggerClient';
import { AuditLogFetcher } from '../utils/AuditLogFetcher';

const handler: EventHandler<'guildMemberUpdate'> = {
  name: 'guildMemberUpdate',
  async execute(client: LoggerClient, oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
    const guildId = newMember.guild.id;
    const targetId = newMember.id;

    const config = await ConfigManager.getConfig(guildId);
    if (!config) return;

    const changes = [];

    // 1. Check for Timeout / Timeout Removed
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;
    
    if (oldTimeout !== newTimeout) {
      const isTimeout = newTimeout !== null && newTimeout > Date.now();
      changes.push({
        type: isTimeout ? 'timeout' : 'timeout_removed',
        eventId: isTimeout ? 40 : 42,
        category: 'Modlogs'
      });
    }

    // 2. Check for Roles Given / Taken
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    
    if (oldRoles.size !== newRoles.size) {
      const addedRoles = newRoles.filter(r => !oldRoles.has(r.id));
      const removedRoles = oldRoles.filter(r => !newRoles.has(r.id));

      if (addedRoles.size > 0) {
        changes.push({
          type: 'role_given',
          eventId: 44,
          category: 'Members',
          roles: addedRoles.map(r => `<@&${r.id}>`).join(', ')
        });
      }
      if (removedRoles.size > 0) {
        changes.push({
          type: 'role_taken',
          eventId: 45,
          category: 'Members',
          roles: removedRoles.map(r => `<@&${r.id}>`).join(', ')
        });
      }
    }

    // 3. Check for Nickname Update
    if (oldMember.nickname !== newMember.nickname) {
      changes.push({
        type: 'nickname_update',
        eventId: 25,
        category: 'Members',
        oldNick: oldMember.nickname || 'None',
        newNick: newMember.nickname || 'None'
      });
    }

    // Process each change
    for (const change of changes) {
      let executorId = 'Unknown';
      let executorMention = 'Unknown';
      let reason = '[no reason provided]';

      let auditLogType: AuditLogEvent | null = null;
      if (change.type === 'timeout' || change.type === 'timeout_removed' || change.type === 'nickname_update') {
        auditLogType = AuditLogEvent.MemberUpdate;
      } else if (change.type === 'role_given' || change.type === 'role_taken') {
        auditLogType = AuditLogEvent.MemberRoleUpdate;
      }

      if (auditLogType) {
        const entry = await AuditLogFetcher.fetchLatestEntry(newMember.guild, auditLogType, targetId);
        if (entry && entry.executor) {
          executorId = entry.executor.id;
          executorMention = `<@${executorId}>`;
          if (entry.reason) reason = entry.reason;
        }
      }

      const isIgnored = FilterEngine.shouldIgnore(config, {
        typeId: change.eventId,
        guildId,
        channelId: '', 
        targetId,
        executorId: executorId !== 'Unknown' ? executorId : '',
      });

      if (isIgnored) continue;

      const targetChannelId = config.channelRoutes[String(change.eventId)] || config.channelRoutes[change.category] || config.channelRoutes['main'];
      if (!targetChannelId) continue;

      let authorName = '';
      let description = '';
      let emoji = '👤';

      if (change.type === 'timeout') {
        authorName = 'Timeout';
        description = `**User**\n${newMember.user.tag} (<@${targetId}>)\n\n**Moderator**\n${executorMention}\n\n**Reason**\n${reason}\n\n**Until**\n<t:${Math.floor(newTimeout! / 1000)}:F>`;
        emoji = '⏱️';
      } else if (change.type === 'timeout_removed') {
        authorName = 'Timeout Removed';
        description = `**User**\n${newMember.user.tag} (<@${targetId}>)\n\n**Moderator**\n${executorMention}`;
        emoji = '⏱️';
      } else if (change.type === 'role_given') {
        authorName = 'Roles Given';
        description = `<@${targetId}> was given multiple roles\n\n**Given by:** ${executorMention}\n**Roles:** ${change.roles}`;
        emoji = '➕';
      } else if (change.type === 'role_taken') {
        authorName = 'Roles Taken';
        description = `<@${targetId}> had multiple roles removed\n\n**Taken by:** ${executorMention}\n**Roles:** ${change.roles}`;
        emoji = '➖';
      } else if (change.type === 'nickname_update') {
        authorName = 'Nickname Update';
        description = `**User:** <@${targetId}>\n**Before:** ${change.oldNick}\n**After:** ${change.newNick}\n\n**Updated by:** ${executorMention}`;
        emoji = '✏️';
      }

      const embed = LogEmbedBuilder.build({
        color: config.embedColors[change.category] || EMBED_COLORS[change.category as keyof typeof EMBED_COLORS],
        authorName,
        authorIconURL: client.user?.displayAvatarURL() || '',
        typeId: change.eventId,
        description,
        messageId: '', 
      });

      const webhook = await webhookManager.getWebhook(targetChannelId);
      if (webhook) {
        await webhook.send({ 
          content: `${emoji} **${authorName}** | User ID: \`${targetId}\``,
          embeds: [embed] 
        }).catch(err => {
          if (err.code === 10015) webhookManager.invalidateWebhook(targetChannelId);
        });
      }
    }
  }
};

export default handler;
