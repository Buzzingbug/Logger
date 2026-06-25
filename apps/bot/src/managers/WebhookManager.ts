import { Client, TextChannel, WebhookClient, Webhook } from 'discord.js';

export class WebhookManager {
  private client: Client;
  // Map of channelId -> WebhookClient
  private webhookCache = new Map<string, WebhookClient>();

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Retrieves an existing webhook for a channel or creates a new one.
   */
  public async getWebhook(channelId: string): Promise<WebhookClient | null> {
    // 1. Check memory cache
    if (this.webhookCache.has(channelId)) {
      return this.webhookCache.get(channelId) || null;
    }

    const channel = await this.client.channels.fetch(channelId).catch(() => null);
    if (!channel || !(channel instanceof TextChannel)) return null;

    try {
      // 2. Fetch existing webhooks in the channel
      const webhooks = await channel.fetchWebhooks();
      let webhook = webhooks.find(wh => wh.owner?.id === this.client.user?.id);

      // 3. Create a new webhook if none exists
      if (!webhook) {
        webhook = await channel.createWebhook({
          name: 'Logger', // Dashboard might override display name per-log
          avatar: this.client.user?.displayAvatarURL(),
        });
      }

      const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token! });
      
      // Cache it
      this.webhookCache.set(channelId, webhookClient);
      
      return webhookClient;
    } catch (error) {
      console.error(`Failed to manage webhook for channel ${channelId}:`, error);
      return null;
    }
  }

  /**
   * Removes a webhook from cache (e.g., if we catch a 10015 Unknown Webhook error).
   */
  public invalidateWebhook(channelId: string) {
    this.webhookCache.delete(channelId);
  }
}
