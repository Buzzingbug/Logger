import { GuildMember } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { ConfigManager } from '../managers/ConfigManager';
import { FilterEngine } from '../engine/FilterEngine';
import { LogEmbedBuilder } from '../utils/LogEmbedBuilder';
import { webhookManager } from '../index';
import { EMBED_COLORS } from '@logger/shared';
import { LoggerClient } from '../client/LoggerClient';

const handler: EventHandler<'guildMemberAdd'> = {
  name: 'guildMemberAdd',
  async execute(client: LoggerClient, member: GuildMember) {
    const config = await ConfigManager.getConfig(member.guild.id);
    if (!config) return;

    const eventId = 1; // Member Join
    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId: member.guild.id,
      channelId: '', // Join events don't have a specific channel
      targetId: member.id,
      executorId: member.id,
    });

    if (isIgnored) return;

    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Members'] || config.channelRoutes['main'];
    if (!targetChannelId) return;

    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Members'] || EMBED_COLORS.Members,
      authorName: 'Member Joined',
      authorIconURL: client.user?.displayAvatarURL() || '',
      typeId: eventId,
      description: `<@${member.id}> (${member.user.tag}) joined the server.\nAccount Created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
      fields: [
        { name: 'Member ID', value: member.id, inline: true },
        { name: 'Server Member Count', value: member.guild.memberCount.toString(), inline: true }
      ],
    });

    const webhook = await webhookManager.getWebhook(targetChannelId);
    if (webhook) {
      await webhook.send({ embeds: [embed] }).catch(err => {
        if (err.code === 10015) webhookManager.invalidateWebhook(targetChannelId);
      });
    }
  }
};

export default handler;
