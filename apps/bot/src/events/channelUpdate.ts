import { Events, NonThreadGuildBasedChannel, DMChannel, OverwriteType } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { t } from '../utils/i18n';
import { LoggerClient } from '../client/LoggerClient';

const handler: EventHandler<'channelUpdate'> = {
  name: Events.ChannelUpdate,
  async execute(client: LoggerClient, oldChannel: DMChannel | NonThreadGuildBasedChannel, newChannel: DMChannel | NonThreadGuildBasedChannel) {
    if (newChannel.isDMBased() || !newChannel.guild || oldChannel.isDMBased()) return;

    const config = await ConfigManager.getConfig(newChannel.guild.id);
    if (!config) return;

    const lang = config.otherOptions?.language || 'en-US';
    
    let eventId = -1;
    let description = '';
    let title = '';

    const oldPerms = oldChannel.permissionOverwrites.cache;
    const newPerms = newChannel.permissionOverwrites.cache;

    let permsChanged = false;
    let diffLines: string[] = [];

    const allIds = new Set([...oldPerms.keys(), ...newPerms.keys()]);

    for (const id of allIds) {
      const oldPerm = oldPerms.get(id);
      const newPerm = newPerms.get(id);

      if (!oldPerm && newPerm) {
        permsChanged = true;
        eventId = 47; // Permissions Added
        title = t('channel_perms_added_title', lang);
        
        const typeStr = newPerm.type === OverwriteType.Role ? `<@&${id}>` : `<@${id}>`;
        diffLines.push(`**Target:** ${typeStr}`);
        
        const allowed = newPerm.allow.toArray();
        const denied = newPerm.deny.toArray();
        if (allowed.length) diffLines.push(`✅ **Allowed:** \`${allowed.join(', ')}\``);
        if (denied.length) diffLines.push(`❌ **Denied:** \`${denied.join(', ')}\``);
        diffLines.push('');
      } else if (oldPerm && !newPerm) {
        permsChanged = true;
        eventId = 48; // Permissions Deleted
        title = t('channel_perms_deleted_title', lang);

        const typeStr = oldPerm.type === OverwriteType.Role ? `<@&${id}>` : `<@${id}>`;
        diffLines.push(`**Target:** ${typeStr} *(Removed)*\n`);
      } else if (oldPerm && newPerm) {
        const oldAllow = oldPerm.allow.toArray();
        const newAllow = newPerm.allow.toArray();
        const oldDeny = oldPerm.deny.toArray();
        const newDeny = newPerm.deny.toArray();

        const newlyAllowed = newAllow.filter(p => !oldAllow.includes(p));
        const newlyDenied = newDeny.filter(p => !oldDeny.includes(p));
        const newlyNeutral = [
          ...oldAllow.filter(p => !newAllow.includes(p) && !newDeny.includes(p)), 
          ...oldDeny.filter(p => !newDeny.includes(p) && !newAllow.includes(p))
        ];

        if (newlyAllowed.length || newlyDenied.length || newlyNeutral.length) {
          permsChanged = true;
          eventId = 49;
          title = t('channel_perms_updated_title', lang);
          const typeStr = newPerm.type === OverwriteType.Role ? `<@&${id}>` : `<@${id}>`;
          diffLines.push(`**Target:** ${typeStr}`);
          
          if (newlyAllowed.length) diffLines.push(`✅ **Allowed:** \`${newlyAllowed.join(', ')}\``);
          if (newlyDenied.length) diffLines.push(`❌ **Denied:** \`${newlyDenied.join(', ')}\``);
          if (newlyNeutral.length) diffLines.push(`🔄 **Neutral:** \`${newlyNeutral.join(', ')}\``);
          diffLines.push('');
        }
      }
    }

    if (permsChanged) {
      description = `**${t('name', lang)}:** <#${newChannel.id}>\n\n${diffLines.join('\n')}`;
    } else {
      // Normal update
      let changed = false;
      description = `**${t('name', lang)}:** <#${newChannel.id}>\n\n`;
      
      if (oldChannel.name !== newChannel.name) {
        changed = true;
        description += `**${t('name', lang)}:**\n\`${oldChannel.name}\` ➔ \`${newChannel.name}\`\n`;
      }
      if ((oldChannel as any).topic !== (newChannel as any).topic) {
        changed = true;
        description += `**${t('topic', lang)}:**\n${(oldChannel as any).topic || t('none', lang)} ➔ ${(newChannel as any).topic || t('none', lang)}\n`;
      }
      if (oldChannel.parentId !== newChannel.parentId) {
        changed = true;
        description += `**${t('category', lang)}:**\n${oldChannel.parentId ? `<#${oldChannel.parentId}>` : t('none', lang)} ➔ ${newChannel.parentId ? `<#${newChannel.parentId}>` : t('none', lang)}\n`;
      }
      
      if (!changed) return;
      eventId = 29; // Channel Update
      title = t('channel_updated_title', lang);
    }

    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId: newChannel.guild.id,
      channelId: newChannel.id,
      targetId: '',
      executorId: '', 
    });

    if (isIgnored) return;

    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Channels'] || config.channelRoutes['main'];
    if (!targetChannelId) return;

    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Channels'] || EMBED_COLORS.Channels,
      authorName: title,
      authorIconURL: newChannel.guild.iconURL() || '',
      typeId: eventId,
      description: description
    });

    try {
      const auditLogType = eventId === 29 ? 11 : 13; // 11 is CHANNEL_UPDATE, 13 is CHANNEL_OVERWRITE_CREATE/UPDATE/DELETE
      const auditLogs = await newChannel.guild.fetchAuditLogs({ limit: 1 }).catch(() => null);
      
      const log = auditLogs?.entries.find(e => (e.target as any)?.id === newChannel.id);
      
      let content = `📝 **${title}**`;
      if (log && Date.now() - log.createdTimestamp < 5000) {
        content += ` | ${t('executor', lang)}: <@${log.executor?.id}>`;
      }
      
      const webhook = await webhookManager.getWebhook(targetChannelId);
      if (webhook) {
        await webhook.send({ content, embeds: [embed] }).catch(err => {
          if (err.code === 10015) webhookManager.invalidateWebhook(targetChannelId);
        });
      }
    } catch (err) {
      console.error('Failed to log channelUpdate', err);
    }
  }
};

export default handler;
