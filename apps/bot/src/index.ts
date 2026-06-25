import { GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import 'dotenv/config';
import { prisma, redis } from '@logger/db';
import { LoggerClient } from './client/LoggerClient';
import { EventRegistry } from './engine/EventRegistry';
import { WebhookManager } from './managers/WebhookManager';

const client = new LoggerClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

export const webhookManager = new WebhookManager(client);
export const eventRegistry = new EventRegistry(client);

client.once('ready', async () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
  
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
  }

  try {
    await redis.ping();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }

  // Load events
  await eventRegistry.loadAllEvents();

  // Register commands
  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check bot, database, and Redis latency')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
      .setName('dashboard')
      .setDescription('Get a link to the logger dashboard')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  ];

  try {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: commands }
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Failed to register application commands:', error);
  }

  // Sync guilds to ensure database has records for servers the bot is already in
  try {
    for (const guild of client.guilds.cache.values()) {
      await prisma.guildConfig.upsert({
        where: { guildId: guild.id },
        update: {},
        create: { guildId: guild.id }
      });
    }
    console.log(`Synced ${client.guilds.cache.size} guilds to database.`);
  } catch (error) {
    console.error('Failed to sync guilds:', error);
  }
});

client.login(process.env.DISCORD_TOKEN);
