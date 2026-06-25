import { GatewayIntentBits } from 'discord.js';
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
});

client.login(process.env.DISCORD_TOKEN);
