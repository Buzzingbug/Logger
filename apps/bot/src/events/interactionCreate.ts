import { EventHandler } from '../engine/EventRegistry';
import { Interaction, EmbedBuilder, Colors } from 'discord.js';
import { prisma, redis } from '@logger/db';

const interactionCreate: EventHandler<'interactionCreate'> = {
  name: 'interactionCreate',
  execute: async (client, interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
      const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
      
      const wsPing = interaction.client.ws.ping;
      
      // Redis ping
      const redisStart = Date.now();
      await redis.ping();
      const redisPing = Date.now() - redisStart;

      // DB ping
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbPing = Date.now() - dbStart;

      const embed = new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .setColor(Colors.Fuchsia)
        .addFields(
          { name: 'Bot Latency', value: `\`${sent.createdTimestamp - interaction.createdTimestamp}ms\``, inline: true },
          { name: 'WebSocket (API) Ping', value: `\`${wsPing}ms\``, inline: true },
          { name: '\u200B', value: '\u200B', inline: false },
          { name: 'Redis Latency', value: `\`${redisPing}ms\``, inline: true },
          { name: 'Database Latency', value: `\`${dbPing}ms\``, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
    }

    if (interaction.commandName === 'dashboard') {
      const dashboardUrl = process.env.NEXTAUTH_URL || 'https://your-dashboard-url.up.railway.app';
      
      const embed = new EmbedBuilder()
        .setTitle('🛠️ Logger Dashboard')
        .setDescription(`Access the configuration dashboard here:\n\n[**Open Dashboard**](${dashboardUrl})\n\n*Note: Only whitelisted administrators can log in.*`)
        .setColor(Colors.Fuchsia)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === 'data-request') {
      const embed = new EmbedBuilder()
        .setTitle('📊 Data Request')
        .setDescription('**Good news!** We do not store any personal data, message content, or user profiles in our database. We only store server configurations (which channels to log to, which events to track, etc.).\n\nBecause we hold no personal data about you, there is no data to export!')
        .setColor(Colors.Green)
        .setTimestamp();
        
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === 'delete-my-data') {
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Data Deletion')
        .setDescription('**Nothing to delete!**\n\nWe do not store any personal data, message content, or user profiles. We only store server configurations. Since we hold no personal data about you, your data footprint with us is already zero.')
        .setColor(Colors.Green)
        .setTimestamp();
        
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === 'privacy') {
      const embed = new EmbedBuilder()
        .setTitle('🔒 Privacy Policy Summary')
        .setDescription('We take your privacy very seriously. Here is how we handle data:\n\n**1. No Message Storage**\nWe do not store any message content in our database. Messages are only temporarily cached in memory to detect edits/deletions and are instantly discarded.\n\n**2. No User Profiles**\nWe do not track XP, warnings, or build user profiles. We only store server-level configurations (like which channel to send logs to).\n\n**3. Data Deletion**\nIf the bot is removed from a server, all configurations for that server are immediately and permanently deleted.\n\n*For full details, please contact the bot administrators.*')
        .setColor(Colors.Blue)
        .setTimestamp();
        
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};

export default interactionCreate;
