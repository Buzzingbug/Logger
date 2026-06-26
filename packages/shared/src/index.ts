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

export const EVENT_NAMES: Record<number, string> = {
  0: 'Delete Attachment',
  1: 'Member Join',
  2: 'Member Leave',
  3: 'Delete Multiple Messages',
  4: 'Delete Thread Message',
  5: 'Delete Single Message',
  6: 'Edit Thread Message',
  7: 'Edit Message',
  8: 'Stream Start',
  9: 'Stream End',
  10: 'Thread Create',
  11: 'Thread Delete',
  12: 'Video Start',
  13: 'Video Stop',
  14: 'Moved',
  15: 'Voice Channel Change',
  16: 'Server Deafen',
  17: 'Voice Channel Join',
  18: 'Voice Channel Leave',
  19: 'Server Mute',
  20: 'Server Undeafen',
  21: 'Server Unmute',
  22: 'Disconnected',
  23: 'Invite Create',
  24: 'Invite Delete',
  25: 'Nickname Update',
  26: 'Server Avatar Changed',
  27: 'Channel Create',
  28: 'Channel Delete',
  29: 'Channel Update',
  30: 'Server Modified',
  31: 'Role Create',
  32: 'Role Delete',
  33: 'Role Update',
  34: 'Message Pinned',
  35: 'Message Unpinned',
  36: 'Emoji Create',
  37: 'Emoji Delete',
  38: 'Emoji Update',
  39: 'Ban',
  40: 'Timeout',
  41: 'Kick',
  42: 'Timeout Removed',
  43: 'Unban',
  44: 'Role Given',
  45: 'Role Taken',
  46: 'Members Pruned',
  47: 'Channel Permissions Added',
  48: 'Channel Permissions Deleted',
  49: 'Channel Permissions Updated',
  50: 'Role Permissions Updated',
  51: 'Reaction Removed',
  52: 'Server Icon Update',
  53: 'Role Icon Update',
  54: 'Voice Channel Status Change',
  55: 'Server Boosted',
  56: 'Server Boost Removed',
  57: 'Bot Added',
  58: 'Bot Removed',
  59: 'Stage Started',
  60: 'Stage Ended',
  61: 'Stage Updated',
  62: 'New Stage Speaker',
  63: 'Speaker Invited',
  64: 'Stopped Speaking',
  65: 'Event Created',
  66: 'Event Deleted',
  67: 'Event Updated',
  68: 'Logging Channel Changed',
  69: 'Ignore Options Updated',
  70: 'Language Changed',
  71: 'Token Revoked',
  72: 'Token Generated',
  73: 'Tag Deleted',
  74: 'Tag Added',
  75: 'Tag Updated',
  76: 'Logging Options Updated',
  77: 'Log Updated',
  78: 'Configuration Reset',
  79: 'Webhook Created',
  80: 'Webhook Deleted',
  81: 'Webhook Modified',
  82: 'Webhook Avatar Updated',
  83: 'Channel Followed',
  84: 'Channel Unfollowed',
  85: 'Followed Channel Updated',
  86: 'Poll Deleted',
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
  ignoreCategories: string[];
  ignoreMessageContent: string[];
  ignoreExecutorRoles: string[];
  ignoreBotExecutors: boolean;
  ignoreBotTargets: boolean;
  channelRoutes: Record<string, string>; // category/eventId -> channelId
  embedColors: Record<string, number>; // category -> color
  language?: string;
  otherOptions: Record<string, any>;
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
