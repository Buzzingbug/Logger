# Handoff Report — Privileged Gateway Intents Compliance Audit

This handoff report summarizes the observations, reasoning, and conclusions of the Privileged Gateway Intents audit conducted for the Discord Logger (Quark Bot) application.

---

## 1. Observation

- **Observation 1 (Intent Configuration)**: In `apps/bot/src/index.ts` (lines 8-24), `LoggerClient` is configured with:
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
  Notably, `GatewayIntentBits.GuildBans` is omitted from the list of intents, and `GatewayIntentBits.GuildPresences` is also omitted.

- **Observation 2 (Custom Caching Settings)**: In `apps/bot/src/client/LoggerClient.ts` (lines 19-27), the default cache configurations are:
  ```typescript
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 0, // Disable default message cache completely
    ThreadManager: 10,
    PresenceManager: 0, 
    ReactionManager: 0,
    VoiceStateManager: 0,
  }),
  ```
  And custom message caching is implemented via `this.messageCache = new Map<string, CachedMessage>()` (lines 13-14) with a 1-hour TTL (`CACHE_TTL_MS = 60 * 60 * 1000`) and a 5-minute cache sweeper interval (lines 30, 36-48).

- **Observation 3 (Registered Event Handlers)**: The event handlers directory `apps/bot/src/events/` contains files for ban updates:
  - `guildBanAdd.ts` (registered for event `'guildBanAdd'`)
  - `guildBanRemove.ts` (registered for event `'guildBanRemove'`)
  - `guildMemberAdd.ts` (registered for event `'guildMemberAdd'`)
  - `guildMemberRemove.ts` (registered for event `'guildMemberRemove'`)
  - `guildMemberUpdate.ts` (registered for event `'guildMemberUpdate'`)
  - `messageCreate.ts` (registered for event `'messageCreate'`)
  - `messageDelete.ts` (registered for event `'messageDelete'`)
  - `messageUpdate.ts` (registered for event `'messageUpdate'`)

- **Observation 4 (Indefinite Attachment Retention)**: In `apps/files/src/index.ts` (lines 16-56), the Express server only supports a POST route `/api/v1/files/upload`. There are no delete routes or auto-pruning logic. In `apps/bot/src/events/messageDelete.ts` (lines 104-115), deleted messages are logged to a Discord webhook, but no delete call is dispatched to the files service.

- **Observation 5 (Key Derivation Weakness)**: In `apps/files/src/index.ts` (lines 35-36), encryption keys are derived as:
  ```typescript
  const keyMaterial = `${guildId}${channelId}${fileId}${uncompressedSize}`;
  const encryptionKey = crypto.createHash('sha256').update(keyMaterial).digest();
  ```

---

## 2. Logic Chain

1. **Intents Configured & Enabled**: Based on **Observation 1**, the bot requests two privileged gateway intents: `GuildMembers` and `MessageContent`. It does not request `GuildPresences` (Presence Intent).
2. **Presence Intent Justification**: Since the bot does not enable `GuildPresences` or implement status tracking, it complies with Discord's policy of only requesting required intents.
3. **Server Members Intent Justification**: Based on **Observation 3**, the bot registers handlers for member joins, leaves, and profile updates (`guildMemberAdd`, `guildMemberRemove`, `guildMemberUpdate`). Since these are passive, real-time logging events, they cannot be replaced by active slash commands or webhooks. Therefore, the `GuildMembers` intent is fully justified.
4. **Message Content Intent Justification**: Based on **Observation 3**, the bot logs message deletions and updates (`messageDelete`, `messageUpdate`) and backs up attachments (`messageCreate`). This requires reading message content and attachment parameters of other users' messages in real-time, which necessitates the `MessageContent` intent. The caching is properly optimized and bounded (1-hour TTL in memory; **Observation 2**), making it compliant.
5. **Standard Intent Bug (GuildBans)**: The presence of `guildBanAdd` and `guildBanRemove` handlers (**Observation 3**) indicates that ban/unban logging is intended. However, because `GatewayIntentBits.GuildBans` is omitted from the configured intents (**Observation 1**), the Discord gateway will never dispatch these events, breaking the ban/unban logging feature.
6. **GDPR/Data Retention Non-Compliance**: Based on **Observation 4**, attachments are uploaded to S3 but never deleted when the original message is deleted or when the server is removed. This violates GDPR Article 17 ("Right to be Forgotten") and Discord Developer Terms requiring off-platform data to mirror platform deletions.
7. **Key Derivation Security Vulnerability**: Based on **Observation 5**, the cryptographic key is derived entirely from public, visible, or easily guessable variables, violating security guidelines.

---

## 3. Caveats

- **No Live Verification of Gateway Traffic**: The evaluation is based on static analysis of the configuration and source code. No live connection to the Discord Gateway was established to inspect event packets due to CODE_ONLY network restrictions.
- **Production Build/Deploy configurations**: Dockerfiles, CI pipelines, or cloud hosting configurations (e.g. Railway or AWS S3 bucket lifecycle policies) were not examined as they are outside the codebase scope.

---

## 4. Conclusion

- **Privileged Intents**: Both `GuildMembers` and `MessageContent` are configured and technically justified by the bot's passive logging and attachment backup features. They cannot be replaced by slash commands or active user interactions. Caching complies with the 24-hour retention policy.
- **Identified Defect**: The lack of `GatewayIntentBits.GuildBans` in `index.ts` prevents ban/unban logging from working.
- **Identified Violations**: Indefinite storage of user attachment files violates GDPR/CCPA and Discord's Developer policies. Predictable key derivation in the file upload service poses a high security risk.

---

## 5. Verification Method

1. **Intents Inspection**:
   - Inspect `apps/bot/src/index.ts` to confirm the enabled intents and verify the absence of `GatewayIntentBits.GuildBans`.
2. **Cache Lifecycle Inspection**:
   - Inspect `apps/bot/src/client/LoggerClient.ts` to verify the cache constraints (`CACHE_TTL_MS`, `PresenceManager: 0`, and the cache sweeper interval).
3. **Data Lifecycle Inspection**:
   - Check `apps/bot/src/events/messageDelete.ts` to confirm that no deletion requests are sent to the files service when a message with attachments is deleted.
   - Inspect `apps/files/src/index.ts` to verify that there are no DELETE endpoints.
4. **Key Derivation Code Inspection**:
   - Inspect `apps/files/src/index.ts` to confirm key material inputs.
