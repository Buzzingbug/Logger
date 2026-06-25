export const EVENT_CATEGORIES = {
  Messages:      [0, 3, 4, 5, 6, 7, 10, 11, 34, 35, 51, 86],
  Members:       [1, 2, 25, 26, 44, 45, 46, 57, 58],
  Voice:         [8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 54, 59, 60, 61, 62, 63, 64],
  Actions:       [23, 24, 36, 37, 38, 65, 66, 67],
  Channels:      [27, 28, 29, 47, 48, 49, 79, 80, 81, 82, 83, 84, 85],
  Server:        [30, 52, 55, 56],
  Roles:         [31, 32, 33, 50, 53],
  Modlogs:       [39, 40, 41, 42, 43],
  Internal:      [68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78],
};

export const EMBED_COLORS = {
  Messages:  0xED4245,
  Members:   0x57F287,
  Voice:     0x5865F2,
  Actions:   0xFEE75C,
  Channels:  0xEB459E,
  Server:    0xED4245,
  Roles:     0x5865F2,
  Modlogs:   0xED4245,
};

export interface GuildConfig {
  guildId: string;
  enabledEvents: number[];
  ignoreTargetUsers: string[];
  ignoreExecutorUsers: string[];
  ignoreRoles: string[];
  ignoreChannels: string[];
  channelRoutes: Record<string, string>; // category/eventId -> channelId
  embedColors: Record<string, number>; // category -> color
}

export interface LogEvent {
  typeId: number;
  guildId: string;
  channelId: string;
  targetId: string;
  executorId: string;
  targetRoles?: string[];
  // Additional event payload data
  data?: any;
}
