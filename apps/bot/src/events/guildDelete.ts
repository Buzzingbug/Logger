import { Events, Guild } from 'discord.js';
import { EventHandler } from '../engine/EventRegistry';
import { prisma, redis } from '@logger/db';

const guildDelete: EventHandler<'guildDelete'> = {
  name: 'guildDelete',
  execute: async (client, guild: Guild) => {
    try {
      console.log(`[GUILD DELETE] Bot removed from guild ${guild.id}, cleaning up data...`);
      
      // Delete from Database
      await prisma.guildConfig.delete({
        where: { guildId: guild.id }
      }).catch(() => null); // Catch if it doesn't exist
      
      // Remove from Redis Cache
      await redis.del(`config:${guild.id}`);
      
      console.log(`[GUILD DELETE] Successfully cleaned up data for guild ${guild.id}`);
    } catch (error) {
      console.error(`[GUILD DELETE] Error cleaning up data for guild ${guild.id}:`, error);
    }
  }
};

export default guildDelete;
