# Data Retention & Privacy (GDPR/CCPA) Compliance Analysis

This report evaluates the **Logger** application (also referred to as Quark Bot) against the Discord Developer Policies and Trust & Safety guidelines regarding Data Privacy and Retention (GDPR/CCPA).

---

## 1. Executive Summary

- **In-Memory Caching (Compliant)**: The bot caches messages in memory for up to 1 hour to support logging message updates and deletions. It implements an active background sweeper that purges expired messages, satisfying Discord's cache duration requirements.
- **Database & Redis Persistence (Compliant)**: The PostgreSQL database (managed via Prisma) and Redis cache only store server configurations (`GuildConfig`). They do not persist raw message content or user metadata.
- **Attachment Storage Service (`apps/files`) (Non-Compliant & Critically Vulnerable)**: 
  - **Insecure Key Derivation**: The microservice uses AES-256-GCM to encrypt user attachments but derives the key from purely predictable/public metadata (`guildId`, `channelId`, `fileId`, `uncompressedSize`) without any server-side secret or salt. If the storage bucket is compromised, an attacker can easily decrypt the attachments.
  - **Indefinite Data Retention**: Attachments are stored indefinitely in S3 mock storage without any automatic cleanup, TTL, or integration with message deletion events, violating GDPR/CCPA "right to be forgotten" principles.

---

## 2. Caching & Storage of Message Content and User Data

### In-Memory Message Caching
The Discord bot utilizes a custom in-memory message caching system to record messages as they are sent so it can compare the old and new content when a message is updated (edited) or deleted.

- **File Path**: `apps/bot/src/client/LoggerClient.ts`
- **Mechanism**: Message content is stored in a Javascript `Map` instance.
- **TTL Constraint**: Messages are held for a maximum of 1 hour (`CACHE_TTL_MS = 60 * 60 * 1000`).
- **Cleanup**: A cache sweeper interval runs every 5 minutes to evict expired items.
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
          // ...
        }),
      });

      // Start the cache sweeper interval
      setInterval(() => this.sweepMessageCache(), 5 * 60 * 1000); // Sweep every 5 mins
    }

    private sweepMessageCache() {
      const now = Date.now();
      let evicted = 0;
      for (const [id, msg] of this.messageCache.entries()) {
        if (now - msg.timestamp > this.CACHE_TTL_MS) {
          this.messageCache.delete(id);
          evicted++;
        }
      }
      // ...
    }
  }
  ```

### Database & Redis Persistence
The persistent storage layers are clean of message content:
- **Prisma Schema (`packages/db/prisma/schema.prisma`)**: Defines only `GuildConfig` which tracks server-specific parameters (e.g. ignored channels, logs routing configurations, and language choices).
- **Redis (`packages/db/src/index.ts` / `apps/bot/src/managers/ConfigManager.ts`)**: Caches server configurations mapped to `config:${guildId}` for optimized reads. It does not cache message content or user metadata.

---

## 3. Evaluation of Indefinite Raw Message Storage

**Assessment: Compliant**
- Raw message content is **not** written to the PostgreSQL database or cached in Redis.
- The in-memory cache (`messageCache` in `LoggerClient.ts`) is short-term (1 hour) and strictly bounded by the cache sweeper.
- Message deletions (`messageDelete.ts`) and message updates (`messageUpdate.ts`) log events directly to admin-configured channel webhooks rather than saving them to a local database.
- As a result, the application **does not store raw message content indefinitely** in external databases.

---

## 4. Evaluation of the Attachment Files Service (`apps/files`)

The microservice `apps/files` is responsible for fetching, compressing, and encrypting Discord attachments when message events occur. While it correctly implements AES-256-GCM encryption, the implementation suffers from two major compliance and security issues:

### A. Vulnerable Key Derivation Scheme (Critical Security Risk)
The encryption/decryption key is derived purely from public or guessable metadata.

- **File Path**: `apps/files/src/index.ts`
- **Key Derivation Code**:
  ```typescript
  // 3. AES-256-GCM Encrypt
  // Key derivation matching the SKILL.md specification
  const keyMaterial = `${guildId}${channelId}${fileId}${uncompressedSize}`;
  const encryptionKey = crypto.createHash('sha256').update(keyMaterial).digest();
  ```
- **Vulnerability Explanation**:
  1. **No Cryptographic Secret**: The key derivation material contains no server-side private secret or salt (e.g. `process.env.ATTACHMENT_SECRET`). 
  2. **Predictable Components**:
     - `guildId` and `channelId` are public Discord snowflake IDs.
     - `fileId` matches the filename in S3 (`${fileId}.enc`), making it immediately visible if the bucket is compromised.
     - `uncompressedSize` is a plain integer representing the size in bytes. Since the file is small (usually less than 10MB), an attacker can easily brute-force the uncompressed size.
  3. **Trivial Decryption**: Any entity with access to the encrypted S3 files can reconstruct the encryption keys and decrypt all attachments, rendering the encryption ineffective (acting as mere obfuscation).

### B. Indefinite Retention of Attachment Files (GDPR Violation)
There is no mechanism to delete files from S3 when the original Discord message is deleted or when a server logs out.

- **Missing Delete Hook**: The bot's event handlers (e.g. `messageDelete.ts`) do not trigger deletion calls in `apps/files/src/index.ts`.
- **No TTL on S3/Storage**: Files are uploaded to S3 mock storage (`https://s3.mock.logger.bot/${fileId}.enc`) and persist there indefinitely.
- **GDPR Impact**: Under the GDPR "Right to be Forgotten" (Article 17) and Discord's Developer Terms, user data (including attachments) must be deleted when the user deletes the content on the parent platform. Storing user files indefinitely without a cleanup mechanism is a major policy violation.

---

## 5. Identified Compliance & Security Issues

### Issue 1: Weak and Guessable Cryptographic Key Derivation
- **Location**: `apps/files/src/index.ts` (lines 35-36)
- **Code Snippet**:
  ```typescript
  const keyMaterial = `${guildId}${channelId}${fileId}${uncompressedSize}`;
  const encryptionKey = crypto.createHash('sha256').update(keyMaterial).digest();
  ```
- **Risk**: Low-entropy key material. Reconstructible by anyone with access to S3 file names and channel configurations.
- **Recommendation**: Integrate a server-side private secret key (e.g. loaded via environment variables) using a cryptographically secure key derivation function (KDF) like HKDF:
  ```typescript
  const masterSecret = process.env.ATTACHMENT_ENCRYPTION_SECRET; // Secure environment variable
  const keyMaterial = `${masterSecret}:${guildId}:${channelId}:${fileId}:${uncompressedSize}`;
  const encryptionKey = crypto.createHash('sha256').update(keyMaterial).digest();
  ```

### Issue 2: Lack of Attachment Auto-Cleanup or Deletion Hook
- **Location**: `apps/files/src/index.ts` and `apps/bot/src/events/messageDelete.ts`
- **Risk**: Indefinite storage of user files without a cleanup mechanism. Violates GDPR data retention and Discord Developer Terms.
- **Recommendation**: 
  1. Add a DELETE endpoint to the files microservice:
     ```typescript
     app.delete('/api/v1/files/:fileId', async (req, res) => {
       // Logic to delete ${fileId}.enc from S3/storage
     });
     ```
  2. Call this endpoint in `apps/bot/src/events/messageDelete.ts` when a message with attachments is deleted.
  3. Implement a lifecycle policy on the S3 bucket to automatically prune files older than a set retention window (e.g. 14 or 30 days).
