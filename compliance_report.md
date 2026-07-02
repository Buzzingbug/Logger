# Quark Bot Technical & Compliance Audit Report

## 1. High-Level Compliance Summary

This audit report provides a comprehensive, high-level technical and compliance review of the Quark Bot repository. The bot is designed as a full-stack multi-package monorepo containing a Discord bot (`apps/bot`), an Express-based files microservice (`apps/files`), a web dashboard (`apps/dashboard`), and a Prisma database configuration layer (`packages/db`).

### Major Architectural Red Flags Identified:
1. **[Data Privacy] Critical Security Vulnerability in Key Derivation (`apps/files/src/index.ts`)**: The files service implements AES-256-GCM encryption for stored user attachments but derives keys using public metadata parameters without a server-side secret key or cryptographic salt. If the storage bucket is compromised, an attacker can easily decrypt the attachments.
2. **[Data Privacy] Data Retention Violation in Attachment Storage (`apps/files/src/index.ts` & `apps/bot/src/events/messageDelete.ts`)**: User attachments are compressed, encrypted, and saved to S3-compatible storage indefinitely. The codebase lacks any deletion hook in the message deletion handler to purge corresponding attachments from storage, violating GDPR Article 17 ("Right to be Forgotten") and Discord Developer Terms.
3. **[Privileged Intents] Broken Logging Functionality via Missing Intent Configuration (`apps/bot/src/index.ts`)**: The client registers handlers for server bans (`guildBanAdd`) and unbans (`guildBanRemove`), but does not request the standard (non-privileged) `GuildBans` gateway intent. Consequently, these handlers are inactive in production.
4. **[Data Privacy] Dashboard Authorization / Access Control Bypass (BOLA/IDOR) (`apps/dashboard/src/app/api/guilds/[id]/config/route.ts`)**: Next.js API routes check user session existence but fail to verify if the authenticated user has permissions (e.g., `ADMINISTRATOR`) on the target guild ID, enabling any authenticated user to view or modify other guilds' configurations.
5. **[Data Privacy] Files Service SSRF & Unauthenticated Access (`apps/files/src/index.ts`)**: The `/api/v1/files/upload` route does not require any authentication and fetches arbitrary URLs passed in the `fileUrl` request body parameter without validation, leading to potential Server-Side Request Forgery (SSRF).
6. **[Privileged Intents] Uncached Message Edit Logging Bypass (`apps/bot/src/events/messageUpdate.ts`)**: The early return condition `if (oldMessage.content === newMessage.content) return;` evaluates to `true` when both messages are partials (null content), causing the bot to ignore edit events for all uncached messages.

Overall, while the bot passes anti-spam requirements and handles in-memory message caching compliantly, it fails standard data privacy audits and contains a severe functional deficiency.

---

## 2. Anti-Spam Compliance Evaluation

Discord's Developer Policy strictly monitors spam behavior. Sending unsolicited direct messages (DMs) to guild members (such as welcoming new members) can trigger automated quarantine, especially at scale.

### 2.1 Welcome DMs and Join Events
Automated DMs sent during member joins (`guildMemberAdd`) are a primary driver of anti-spam flags.
- **Evaluation**: The event handler for user joins does not send DMs. Instead, join events are logged directly to a designated server channel using webhooks.
- **File Path**: `apps/bot/src/events/guildMemberAdd.ts`
- **Code Snippet**:
```typescript
const handler: EventHandler<'guildMemberAdd'> = {
  name: 'guildMemberAdd',
  async execute(client: LoggerClient, member: GuildMember) {
    const config = await ConfigManager.getConfig(member.guild.id);
    if (!config) return;

    const eventId = 1; // Member Join
    const isIgnored = FilterEngine.shouldIgnore(config, {
      typeId: eventId,
      guildId: member.guild.id,
      channelId: '', // Join events don't have a specific channel
      targetId: member.id,
      executorId: member.id,
    });

    if (isIgnored) return;

    const targetChannelId = config.channelRoutes[String(eventId)] || config.channelRoutes['Members'] || config.channelRoutes['main'];
    if (!targetChannelId) return;

    const embed = LogEmbedBuilder.build({
      color: config.embedColors['Members'] || EMBED_COLORS.Members,
      authorName: 'Member Joined',
      authorIconURL: client.user?.displayAvatarURL() || '',
      typeId: eventId,
      description: `<@${member.id}> (${member.user.tag}) joined the server.\nAccount Created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
      fields: [
        { name: 'Member ID', value: member.id, inline: true },
        { name: 'Server Member Count', value: member.guild.memberCount.toString(), inline: true }
      ],
    });

    const webhook = await webhookManager.getWebhook(targetChannelId);
    if (webhook) {
      await webhook.send({ 
        content: `👋 **Member Joined** | User ID: \`${member.id}\``,
        embeds: [embed] 
      }).catch(err => {
        if (err.code === 10015) webhookManager.invalidateWebhook(targetChannelId);
      });
    }
  }
};
```
- **Compliance Status**: **PASS**. There is no call to `member.send()` or `member.user.send()`. The system relies strictly on channel logs via webhooks.

### 2.2 Solicited vs. Unsolicited DMs
DMs are only permitted under the "Solicited Interaction Rule," which specifies that DMs must respond directly to user action (e.g. clicking a verification button, executing commands).
- **Evaluation**: The bot handles slash commands and button interactions without sending DMs.
- **File Path**: `apps/bot/src/events/interactionCreate.ts`
- **Code Snippet**:
```typescript
    if (interaction.commandName === 'ping') {
      const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
      
      const wsPing = interaction.client.ws.ping;
      
      // Redis ping
      const redisStart = Date.now();
      await redis.ping();
      const redisPing = Date.now() - redisStart;

      // DB ping
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbPing = Date.now() - dbStart;

      const embed = new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .setColor(Colors.Fuchsia)
        .addFields(
          { name: 'Bot Latency', value: `\`${sent.createdTimestamp - interaction.createdTimestamp}ms\``, inline: true },
          { name: 'WebSocket (API) Ping', value: `\`${wsPing}ms\``, inline: true },
          { name: '\u200B', value: '\u200B', inline: false },
          { name: 'Redis Latency', value: `\`${redisPing}ms\``, inline: true },
          { name: 'Database Latency', value: `\`${dbPing}ms\``, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
    }

    if (interaction.commandName === 'dashboard') {
      const dashboardUrl = process.env.NEXTAUTH_URL || 'https://your-dashboard-url.up.railway.app';
      
      const embed = new EmbedBuilder()
        .setTitle('🛠️ Logger Dashboard')
        .setDescription(`Access the configuration dashboard here:\n\n[**Open Dashboard**](${dashboardUrl})\n\n*Note: Only whitelisted administrators can log in.*`)
        .setColor(Colors.Fuchsia)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
```
- **Compliance Status**: **PASS**. No DMs are generated by commands. Ephemeral channel replies are used where appropriate.

### 2.3 DM Send Error Handling
- **Evaluation**: As there is no code that triggers direct messaging APIs, there are no occurrences of `.send()` on a Discord `User` or `GuildMember`. Hook-based message operations (e.g. `webhook.send()`) handle potential API rejections gracefully (e.g., catching code `10015 Unknown Webhook` in `apps/bot/src/events/guildMemberAdd.ts` lines 47-49).
- **Compliance Status**: **PASS**.

---

## 3. Data Privacy & Retention Compliance (GDPR/CCPA)

Storing user data off-platform is permitted only if it conforms to strict privacy, retention, and deletion criteria. Permanent storage of raw user message contents is prohibited.

### 3.1 Caching of Message Content and User Data
- **Evaluation**: The bot handles short-term message caching in-memory with a strict expiration policy.
- **File Path**: `apps/bot/src/client/LoggerClient.ts`
- **Code Snippet**:
```typescript
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
```
- **Compliance Status**: **PASS**. Raw message content is held in memory for a maximum of 1 hour and swept periodically. The default `MessageManager` cache is disabled, and database models (`packages/db/prisma/schema.prisma`) contain only `GuildConfig` entities.

### 3.2 Attachment Files Service (`apps/files`)
The files microservice is designed to handle message attachment caching. Its encryption mechanism and storage lifecycle present critical security and privacy red flags.

#### Upload Trigger Mechanism
The upload flow is initiated by the bot application. The trigger mechanism for attachment uploads resides in `apps/bot/src/events/messageCreate.ts` (lines 13-27), which monitors incoming messages and POSTs any detected attachment metadata and source URL to the files microservice:
- **File Path**: `apps/bot/src/events/messageCreate.ts`
- **Code Snippet**:
```typescript
    // If the message has attachments, ping the files microservice
    if (message.attachments.size > 0) {
      for (const [id, attachment] of message.attachments) {
        fetch('http://localhost:4000/api/v1/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guildId: message.guildId,
            channelId: message.channelId,
            fileId: attachment.id,
            fileUrl: attachment.url
          })
        }).catch(err => console.error(`Failed to send attachment to files service:`, err));
      }
    }
```

#### Issue A: Insecure Key Derivation (Cryptographic Vulnerability)
The key used for AES-256-GCM encryption is derived entirely from public or predictable metadata values.
- **File Path**: `apps/files/src/index.ts`
- **Code Snippet**:
```typescript
    // 3. AES-256-GCM Encrypt
    // Key derivation matching the SKILL.md specification
    const keyMaterial = `${guildId}${channelId}${fileId}${uncompressedSize}`;
    const encryptionKey = crypto.createHash('sha256').update(keyMaterial).digest();
```
- **Analysis**: The key derivation material does not contain any server-side secret or cryptographic salt. Guild and channel IDs are public snowflakes, the file ID matches the publicly visible S3 filename (`${fileId}.enc`), and the uncompressed size is easily brute-forced. Anyone with read access to the storage bucket can reconstruct the encryption keys and decrypt user attachments, violating basic security standards and Discord's data safety requirements.
- **Technical Recommendation**: Introduce a private, server-side secret key (e.g. `ATTACHMENT_ENCRYPTION_SECRET` loaded via environment variables) and run the input parameters through a proper key-derivation routine (like HKDF or salted SHA-256) to ensure high-entropy keys.

#### Issue B: Indefinite Attachment Retention on Message Delete & Update (GDPR Article 17 Violation)
Attachments sent to the files service are kept in storage indefinitely, with no mechanism to purge them when a Discord message is deleted or updated.
- **File Path**: `apps/files/src/index.ts`, `apps/bot/src/events/messageDelete.ts`, and `apps/bot/src/events/messageUpdate.ts`
- **Analysis**:
  1. **Message Deletion**: The files service only exposes a POST endpoint (`/api/v1/files/upload`) and has no DELETE endpoint. When a message is deleted, the event handler `messageDelete.ts` logs the event to a Discord channel but fails to request the deletion of the stored file payload from mock S3 storage.
  2. **Message Update**: Similarly, when a message is updated to remove or replace an attachment, the bot does not invoke any delete endpoint to purge the outdated attachment from the storage bucket, leading to perpetual data accumulation and policy violation.
  This violates the GDPR "Right to be Forgotten" (Article 17) and Discord's Developer Terms, which demand prompt erasure of cached/stored user data if deleted or modified on the parent platform.
- **Technical Recommendation**: Expose a DELETE route in the files service, invoke it within both the bot's `messageDelete` and `messageUpdate` handlers when attachments are removed, and configure automatic bucket lifecycle rules to purge files after a set retention window (e.g., 14 days).

#### Issue C: Unauthenticated File Upload and Server-Side Request Forgery (SSRF)
The files service exposes an unauthenticated endpoint to download and encrypt arbitrary file URLs.
- **File Path**: `apps/files/src/index.ts`
- **Code Snippet**:
```typescript
app.post('/api/v1/files/upload', async (req, res) => {
  const { guildId, channelId, fileId, fileUrl } = req.body;

  if (!guildId || !channelId || !fileId || !fileUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Download file
    const response = await fetch(fileUrl);
```
- **Analysis**: The `/api/v1/files/upload` API route contains two major flaws:
  1. **Lack of Authentication**: Any external client can call this endpoint since there is no session, API key, or authentication check.
  2. **Server-Side Request Forgery (SSRF)**: The service performs a `fetch` directly on the `fileUrl` parameter supplied in the request body without validation. An attacker can supply internal URLs (e.g., `http://localhost:3000/`, `http://169.254.169.254/latest/meta-data/`) to probe internal ports, scan the local network, or access cloud metadata APIs.
- **Technical Recommendation**: Require authentication/authorization (e.g., a shared API key or JWT verified by the bot application) on the `/api/v1/files/upload` route. Additionally, implement strict input validation on `fileUrl` to restrict fetched resources to trusted domains (e.g., only allowing Discord CDN URLs like `https://cdn.discordapp.com/`).

### 3.3 Dashboard Authorization / Access Control Bypass (BOLA/IDOR)
The Next.js API routes for the dashboard application check whether a user session is active but do not perform authorization checks to ensure that the authenticated user possesses administrative permissions (e.g., `ADMINISTRATOR`) on the specific guild context being accessed or modified.
- **File Path**: `apps/dashboard/src/app/api/guilds/[id]/config/route.ts` (also affects `/api/guilds/[id]/channels`, `/api/guilds/[id]/roles`, `/api/guilds/[id]`)
- **Code Snippet**:
```typescript
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: guildId } = await params;

  let config = await prisma.guildConfig.findUnique({
    where: { guildId }
  });
```
- **Analysis**: While the route verifies that a user is logged in (`!session`), it completely bypasses authorization checks against the path parameter `id`. Any authenticated user can read or modify configuration details (e.g., `enabledEvents`, `ignoreTargetUsers`, `channelRoutes`) of any guild in the database by sending a request containing that guild's ID. This is a Broken Object Level Authorization (BOLA) / IDOR vulnerability.
- **Technical Recommendation**: Modify the Next.js API routes to inspect the user's guilds/permissions (e.g., by querying the Discord API or checking a cache of user guild admin statuses) and confirm the user has the `ADMINISTRATOR` permission on the requested `guildId` before processing the query or mutation.

---

## 4. Privileged Gateway Intents Compliance

Quark Bot configures intents and partials upon initialization. While privileged intents are requested and used correctly, a missing standard intent breaks a core logging feature, and the message content intent has non-compliant downstream side effects.

### 4.1 Configured Intents
- **File Path**: `apps/bot/src/index.ts`
- **Code Snippet**:
```typescript
const client = new LoggerClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
});
```

#### Presence Intent (`GatewayIntentBits.GuildPresences`)
- **Status**: **Disabled / Not Configured**.
- **Justification**: Fully compliant. The bot does not process member statuses or game activities. The Presence manager is disabled (`PresenceManager: 0`). Unnecessarily requesting this intent would result in immediate verification rejection by Discord.

#### Server Members Intent (`GatewayIntentBits.GuildMembers`)
- **Status**: **Enabled**.
- **Justification**: Required to passively log joins (`guildMemberAdd`), leaves (`guildMemberRemove`), and profile/role updates (`guildMemberUpdate`). It cannot be replaced by active user commands.
- **Compliance Status**: **PASS** (Fully Justified).

#### Message Content Intent (`GatewayIntentBits.MessageContent`)
- **Status**: **Enabled**.
- **Justification**: Required to log original message text and display diffs for edited (`messageUpdate`) and deleted (`messageDelete`) messages.
- **Compliance Status**: **NON-COMPLIANT (Downstream Impact)**. While the intent is technically justified, receiving message content triggers the storage of attachments via the files service, leading to the data privacy and retention violations identified in Section 3.2.

### 4.2 Missing GuildBans Intent (Functional Defect)
The codebase includes event handlers for member ban additions (`apps/bot/src/events/guildBanAdd.ts`) and ban removals (`apps/bot/src/events/guildBanRemove.ts`), but does not request the `GuildBans` intent.
- **File Path**: `apps/bot/src/index.ts`
- **Analysis**: Because `GatewayIntentBits.GuildBans` is omitted from the `LoggerClient` initialization, the Discord API will never dispatch ban/unban events to the bot in production. As a result, the ban logging feature is completely non-functional.
- **Technical Recommendation**: Add the standard `GatewayIntentBits.GuildBans` intent to the client configuration in `apps/bot/src/index.ts`. Because this is a standard gateway intent, it does not require approval during the privileged intents review process.

### 4.3 Uncached Message Edit Logging Bypass
The bot application fails to log message update events for any message not cached in the bot's memory, despite requesting the Message Content intent.
- **File Path**: `apps/bot/src/events/messageUpdate.ts`
- **Code Snippet**:
```typescript
const handler: EventHandler<'messageUpdate'> = {
  name: 'messageUpdate',
  async execute(client: LoggerClient, oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    if (!newMessage.guildId || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // Only log actual content edits
```
- **Analysis**: Under Discord.js v14, messages not cached in memory are received as `PartialMessage` objects with `content` set to `null` or `undefined`. When an uncached message is updated, both `oldMessage.content` and `newMessage.content` will evaluate to `null` or `undefined`. The check `oldMessage.content === newMessage.content` will evaluate to `true` and return early, preventing the bot from fetching the message or logging the edit event.
- **Technical Recommendation**: Update the early return condition to check if either message is a partial or has no cached content before comparing. If it is a partial, fetch the full message before comparing content:
```typescript
if (newMessage.partial) await newMessage.fetch();
if (oldMessage.partial) {
  // Rely on custom cache or log that old content was uncached, rather than returning early
}
```

