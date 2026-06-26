import { Guild, AuditLogEvent, GuildAuditLogsEntry } from 'discord.js';

export class AuditLogFetcher {
  /**
   * Fetches an audit log entry with retries to account for Discord's API delay.
   */
  static async fetchLatestEntry<T extends AuditLogEvent>(
    guild: Guild,
    actionType: T,
    targetId: string,
    maxRetries = 3,
    delayMs = 800
  ): Promise<GuildAuditLogsEntry<T> | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const auditLogs = await guild.fetchAuditLogs({
          limit: 5,
          type: actionType,
        });

        // Find an entry matching the target within the last 10 seconds
        const entry = auditLogs.entries.find((e) => 
          e.targetId === targetId && e.createdTimestamp > Date.now() - 10000
        );

        if (entry) {
          return entry as GuildAuditLogsEntry<T>;
        }
      } catch (error) {
        console.error(`Failed to fetch audit log for action ${actionType}:`, error);
      }

      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return null;
  }
}
