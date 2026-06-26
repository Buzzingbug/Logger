import { VoiceState, AuditLogEvent } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { LoggerClient } from '../client/LoggerClient';

const handler: EventHandler<'voiceStateUpdate'> = {
  name: 'voiceStateUpdate',
  async execute(client: LoggerClient, oldState: VoiceState, newState: VoiceState) {
    if (!newState.guild) return;

    const guildId = newState.guild.id;

    // 1. Fetch Config
    const config = await ConfigManager.getConfig(guildId);
    if (!config) return;

    // Determine what changed
    let eventId: number | null = null;
    let actionName = '';
    let emoji = '';
    let auditLogAction: AuditLogEvent | null = null;

    if (!oldState.serverMute && newState.serverMute) {
      eventId = 19; // Server Mute
      actionName = 'Server Muted';
      emoji = '🔇';
      auditLogAction = AuditLogEvent.MemberUpdate;
    } else if (oldState.serverMute && !newState.serverMute) {
      eventId = 21; // Server Unmute
      actionName = 'Server Unmuted';
      emoji = '🔊';
      auditLogAction = AuditLogEvent.MemberUpdate;
    } else if (!oldState.serverDeaf && newState.serverDeaf) {
      eventId = 16; // Server Deafen
      actionName = 'Server Deafened';
      emoji = '🎧'; // Or muted headphones
      auditLogAction = AuditLogEvent.MemberUpdate;
    } else if (oldState.serverDeaf && !newState.serverDeaf) {
      eventId = 20; // Server Undeafen
      actionName = 'Server Undeafened';
      emoji = '🎧';
      auditLogAction = AuditLogEvent.MemberUpdate;
    }

    if (!eventId || !auditLogAction) return;

    // Try to find the executor in Audit Logs
    let executorId = 'Unknown';
    let executorMention = 'Unknown';
    
    try {
      // Wait a tiny bit to let Discord populate the audit log
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const auditLogs = await newState.guild.fetchAuditLogs({
        limit: 5,
        type: auditLogAction
      });
      
      // Find the audit log entry for this target user within the last 5 seconds
      const entry = auditLogs.entries.find(e => 
        e.targetId === newState.member?.id &&
        e.createdTimestamp > Date.now() - 5000
      );

      if (entry && entry.executor) {
        executorId = entry.executor.id;
        executorMention = `<@${executorId}>`;
      }
    } catch (error) {
      console.error('Failed to fetch audit logs for voice state update:', error);
    }

    // 2. Filter Engine
    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId: guildId,
      channelId: newState.channelId || '',
      targetId: newState.member?.id || '',
      executorId: executorId !== 'Unknown' ? executorId : '',
    });

    if (isIgnored) return;

    // 3. Find target channel for routing
    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Voice'] || config.channelRoutes['main'];
    if (!targetChannelId) return;

    // 4. Build Embed
    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Voice'] || EMBED_COLORS.Voice,
      authorName: actionName,
      authorIconURL: client.user?.displayAvatarURL() || '',
      typeId: eventId,
      description: `**Target:** <@${newState.member?.id}>\n**Executor:** ${executorMention}\n**Channel:** ${newState.channelId ? `<#${newState.channelId}>` : 'None'}\n\n*Action tracked via Audit Logs.*`,
      messageId: '', // No specific message ID for voice events
    });

    // 5. Dispatch via Webhook
    const webhook = await webhookManager.getWebhook(targetChannelId);
    if (webhook) {
      await webhook.send({ 
        content: `${emoji} **${actionName}** | Target ID: \`${newState.member?.id}\``,
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
