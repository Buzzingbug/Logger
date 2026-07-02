# Discord Developer Policies: Privileged Gateway Intents Analysis Report

This analysis report evaluates the **Logger** (Quark Bot) application's usage of Discord Privileged Gateway Intents against Discord Developer Policies, security best practices, and data compliance standards.

---

## 1. Executive Summary

A comprehensive audit of the codebase was conducted to determine the necessity, configuration status, and compliance of the bot's gateway intents. The findings are summarized in the table below:

| Intent Name | Gateway Config Status | Actively Used in Code? | Justified? | Compliance Status / Issues |
| :--- | :--- | :--- | :--- | :--- |
| **Presence Intent** (`GuildPresences`) | **Disabled** | No | N/A | **Compliant**. Not configured or cached in client settings. |
| **Server Members Intent** (`GuildMembers`) | **Enabled** | Yes | Yes | **Compliant**. Required for real-time, passive member logging (joins, leaves, nickname/role/timeout changes). |
| **Message Content Intent** (`MessageContent`) | **Enabled** | Yes | Yes | **Non-Compliant (Data Privacy)**. Justified for passive edit/delete logging and attachment backups, but lacks an attachment deletion hook, causing indefinite user file retention. |

---

## 2. Configured Gateway Intents

In `apps/bot/src/index.ts` (lines 8-24), the custom `LoggerClient` is initialized with the following intent configuration:

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

### 2.1 Presence Intent (`GatewayIntentBits.GuildPresences`)
- **Status**: **Disabled/Not Configured**.
- **Justification / Evaluation**: The bot does not implement any status-tracking, activity-monitoring, or status-based role assignment features. In addition, the custom cache settings in `apps/bot/src/client/LoggerClient.ts` (lines 19-27) explicitly disable caching for presences:
  ```typescript
  PresenceManager: 0,
  ```
- **Conclusion**: Compliant. Requesting this intent without a feature that relies on it would lead to immediate rejection during Discord's verification process.

### 2.2 Server Members Intent (`GatewayIntentBits.GuildMembers`)
- **Status**: **Enabled**.
- **Features Relying on this Intent**:
  - **Member Joins**: Handled in `apps/bot/src/events/guildMemberAdd.ts`. Logs when a user joins the guild, tracking account creation date and guild size.
  - **Member Leaves & Kicks**: Handled in `apps/bot/src/events/guildMemberRemove.ts`. Logs departures and queries the audit logs to detect if the departure was a kick.
  - **Member Updates**: Handled in `apps/bot/src/events/guildMemberUpdate.ts`. Logs nickname changes, role additions/removals, and timeouts (mutes).
- **Evaluation of Alternatives**:
  - *Slash Commands / Interactions*: Slash commands are active, user-initiated actions and cannot capture passive guild member entries, exits, or profile updates that happen outside bot commands.
  - *Selective Caching*: Caching is managed natively by `discord.js` when events occur. The bot does not fetch the entire member list on startup (`client.guilds.cache.values()` is used to sync configs, but member lists are not populated in bulk).
- **Conclusion**: Fully justified. Member logs are essential core features of a logging bot and cannot be replicated using interactions or webhooks alone.

### 2.3 Message Content Intent (`GatewayIntentBits.MessageContent`)
- **Status**: **Enabled**.
- **Features Relying on this Intent**:
  - **Message Caching & Attachment Uploads**: Handled in `apps/bot/src/events/messageCreate.ts`. Caches raw message contents in an in-memory TTL map and forwards attachment URLs to an internal files microservice.
  - **Message Deletion Logging**: Handled in `apps/bot/src/events/messageDelete.ts`. Logs deleted messages by looking up their original text content from the in-memory cache.
  - **Message Edit Logging**: Handled in `apps/bot/src/events/messageUpdate.ts`. Compares the old content (retrieved from cache) and the new content to display a diff.
- **Evaluation of Alternatives**:
  - *Slash Commands / Interactions*: Intercepting message edits and deletions in user text channels cannot be achieved via slash commands or button interactions.
  - *Selective Caching*: The bot is highly optimized to avoid permanent message storage. In `apps/bot/src/client/LoggerClient.ts`, the default `discord.js` `MessageManager` cache is completely disabled (`MessageManager: 0`). The bot instead implements a custom in-memory map `messageCache` (lines 13-14) with a strict 1-hour time-to-live (`CACHE_TTL_MS = 60 * 60 * 1000`) and a 5-minute background cache sweeper:
    ```typescript
    setInterval(() => this.sweepMessageCache(), 5 * 60 * 1000);
    ```
- **Conclusion**: Fully justified. However, while the in-memory caching mechanism is compliant, downstream side effects of receiving message content (specifically attachment processing) violate Discord Developer Policies and GDPR, as detailed below.

---

## 3. Identified Compliance & Security Issues

### Issue 1: Missing Standard `GuildBans` Intent Breaks Ban/Unban Logging
- **File Path**: `apps/bot/src/index.ts`
- **Code Snippet**:
  ```typescript
  // apps/bot/src/index.ts (Lines 8-16)
  const client = new LoggerClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessageReactions,
    ],
    // ...
  ```
- **Explanation**: The bot registers handlers for `guildBanAdd` (`apps/bot/src/events/guildBanAdd.ts`) and `guildBanRemove` (`apps/bot/src/events/guildBanRemove.ts`). However, the `GatewayIntentBits.GuildBans` intent is missing from the initialization config. As a result, the Discord gateway will never dispatch ban/unban events to the bot in production, leaving these features entirely non-functional.
- **Severity**: **Medium** (Functional Bug).
- **Recommendation**: Add `GatewayIntentBits.GuildBans` to the client intents array in `apps/bot/src/index.ts`. Since it is a standard (non-privileged) intent, it does not require approval on the Discord Developer Portal.

### Issue 2: Indefinite Storage of User Attachments (GDPR & Policy Violation)
- **File Paths**: `apps/files/src/index.ts` and `apps/bot/src/events/messageDelete.ts`
- **Explanation**: 
  1. In `messageCreate.ts`, messages containing attachments trigger a POST request to `apps/files/src/index.ts` which downloads, compresses, encrypts, and stores them in mock S3.
  2. The files microservice (`apps/files/src/index.ts`) only exposes a single POST route (`/api/v1/files/upload`) and lacks any delete route or data lifecycle policies.
  3. When a message containing attachments is deleted, the event handler in `apps/bot/src/events/messageDelete.ts` logs the deletion to a Discord channel but fails to invoke any deletion API for the stored attachment.
  4. This violates GDPR Article 17 ("Right to be Forgotten") and Discord's Developer Terms, which require that any user data cached/stored off-platform must be deleted immediately if deleted on Discord.
- **Severity**: **High** (Compliance Violation).
- **Recommendation**: 
  - Expose a `DELETE /api/v1/files/:fileId` endpoint in the files microservice to delete the corresponding encrypted file from S3.
  - Modify `apps/bot/src/events/messageDelete.ts` to call this DELETE endpoint for all attachments associated with the deleted message.
  - Implement an automatic S3 bucket lifecycle rule to automatically prune files older than a short, defined window (e.g., 14 days).

### Issue 3: Guessable/Predictable Cryptographic Encryption Keys
- **File Path**: `apps/files/src/index.ts`
- **Code Snippet**:
  ```typescript
  // apps/files/src/index.ts (Lines 35-36)
  const keyMaterial = `${guildId}${channelId}${fileId}${uncompressedSize}`;
  const encryptionKey = crypto.createHash('sha256').update(keyMaterial).digest();
  ```
- **Explanation**: The key derivation material consists entirely of metadata parameters.
  - `guildId` and `channelId` are public Discord snowflakes.
  - `fileId` matches the filename in S3 (`${fileId}.enc`), making it visible if the storage is compromised.
  - `uncompressedSize` is a simple integer that is trivial to brute-force for typical attachment sizes.
  - Because there is no server-side secret key or cryptographic salt, the encryption is effectively obfuscation. If an attacker gains read access to the S3 bucket, they can reconstruct the key for every file and decrypt the attachments, violating Discord Developer Policy security requirements.
- **Severity**: **High** (Security Vulnerability).
- **Recommendation**: Integrate a server-side private environment variable (e.g., `ATTACHMENT_ENCRYPTION_SECRET`) into the key derivation material, or utilize a proper Key Derivation Function (KDF) like HKDF:
  ```typescript
  const keyMaterial = `${process.env.ATTACHMENT_ENCRYPTION_SECRET}:${guildId}:${channelId}:${fileId}:${uncompressedSize}`;
  ```
