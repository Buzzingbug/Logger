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
  }
};

export default interactionCreate;
