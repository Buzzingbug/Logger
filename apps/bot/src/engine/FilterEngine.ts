import { GuildConfig, LogEvent } from '@logger/shared';

export class FilterEngine {
  /**
   * Determines if a logging event should be ignored based on the guild's configuration.
   * Runs before every log dispatch.
   */
  static shouldIgnore(config: GuildConfig, event: LogEvent): boolean {
    // 1. Check if the specific event ID is enabled
    if (!config.enabledEvents.includes(event.typeId)) {
      return true;
    }

    // 2. Ignore Target Users (e.g. don't log actions happening TO this user)
    if (config.ignoreTargetUsers.includes(event.targetId)) {
      return true;
    }

    // 3. Ignore Executor Users (e.g. don't log actions done BY this user)
    if (config.ignoreExecutorUsers.includes(event.executorId)) {
      return true;
    }

    // 4. Ignore specific channels
    if (config.ignoreChannels.includes(event.channelId)) {
      return true;
    }

    // 5. Ignore specific roles (if target has an ignored role)
    const memberRoles = event.targetRoles ?? [];
    if (memberRoles.some(role => config.ignoreRoles.includes(role))) {
      return true;
    }

    return false; // Proceed to log
  }
}
