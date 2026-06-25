import { prisma, redis } from '@logger/db';
import { GuildConfig } from '@logger/shared';

const CACHE_TTL = 60; // 60 seconds

export class ConfigManager {
  /**
   * Fetches the guild configuration from Redis cache, falling back to PostgreSQL.
   */
  static async getConfig(guildId: string): Promise<GuildConfig | null> {
    const cacheKey = `config:${guildId}`;
    
    // 1. Try Redis cache
    const cachedConfig = await redis.get(cacheKey);
    if (cachedConfig) {
      return JSON.parse(cachedConfig) as GuildConfig;
    }

    // 2. Try Database
    const dbConfig = await prisma.guildConfig.findUnique({
      where: { guildId },
    });

    if (!dbConfig) {
      return null;
    }

    // Map Prisma result to our Shared interface
    const config: GuildConfig = {
      guildId: dbConfig.guildId,
      enabledEvents: dbConfig.enabledEvents,
      ignoreTargetUsers: dbConfig.ignoreTargetUsers,
      ignoreExecutorUsers: dbConfig.ignoreExecutorUsers,
      ignoreRoles: dbConfig.ignoreRoles,
      ignoreChannels: dbConfig.ignoreChannels,
      channelRoutes: dbConfig.channelRoutes as Record<string, string>,
      embedColors: dbConfig.embedColors as Record<string, number>,
    };

    // 3. Save to Redis
    await redis.set(cacheKey, JSON.stringify(config), 'EX', CACHE_TTL);

    return config;
  }

  /**
   * Invalidates the cache for a specific guild. Used when dashboard updates config.
   */
  static async invalidateCache(guildId: string): Promise<void> {
    await redis.del(`config:${guildId}`);
  }
}
