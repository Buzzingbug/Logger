import { Client, ClientOptions, Options, Message } from 'discord.js';

export interface CachedMessage {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  attachments: { id: string; url: string; proxyURL: string; name: string }[];
  timestamp: number;
}

export class LoggerClient extends Client {
  public messageCache = new Map<string, CachedMessage>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour retention in memory

  constructor(options: ClientOptions) {
    super({
      ...options,
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        MessageManager: 0, // Disable default message cache completely
        ThreadManager: 10,
        PresenceManager: 0, 
        ReactionManager: 0,
        VoiceStateManager: 0,
      }),
    });

    // Start the cache sweeper interval
    setInterval(() => this.sweepMessageCache(), 5 * 60 * 1000); // Sweep every 5 mins
  }

  /**
   * Sweeps the custom message cache to remove items older than CACHE_TTL_MS
   */
  private sweepMessageCache() {
    const now = Date.now();
    let evicted = 0;
    for (const [id, msg] of this.messageCache.entries()) {
      if (now - msg.timestamp > this.CACHE_TTL_MS) {
        this.messageCache.delete(id);
        evicted++;
      }
    }
    if (evicted > 0) {
      console.log(`[Cache Sweeper] Evicted ${evicted} old messages from memory.`);
    }
  }

  /**
   * Caches a partial version of the message for diffing later.
   */
  public cacheMessage(message: Message) {
    if (!message.author || message.author.bot) return; // Optional: don't cache bot messages
    
    this.messageCache.set(message.id, {
      id: message.id,
      content: message.content,
      authorId: message.author.id,
      channelId: message.channelId,
      attachments: message.attachments.map(a => ({
        id: a.id,
        url: a.url,
        proxyURL: a.proxyURL,
        name: a.name
      })),
      timestamp: Date.now()
    });
  }
}
