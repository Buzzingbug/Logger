# Handoff Report — Compliance Explorer 2

## 1. Observation

- **Observation 1**: In `apps/bot/src/client/LoggerClient.ts` (lines 13-14, 29-31, 36-48, 56-69), message content is cached in an in-memory `Map` called `messageCache` with a `CACHE_TTL_MS` of 1 hour and an active cache sweeper running every 5 minutes:
  ```typescript
  export class LoggerClient extends Client {
    public messageCache = new Map<string, CachedMessage>();
    private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour retention in memory
    // ...
    setInterval(() => this.sweepMessageCache(), 5 * 60 * 1000); // Sweep every 5 mins
  ```
- **Observation 2**: In `packages/db/prisma/schema.prisma` (lines 10-35), the only database model defined is `GuildConfig`. There are no models for caching/storing user messages or other user data.
- **Observation 3**: In `packages/db/src/index.ts` (lines 18-19) and `apps/bot/src/managers/ConfigManager.ts` (lines 14, 47), Redis is used only to cache server configuration data (`config:${guildId}`).
- **Observation 4**: In `apps/files/src/index.ts` (lines 35-36), the attachment file service derives the GCM encryption key as:
  ```typescript
  const keyMaterial = `${guildId}${channelId}${fileId}${uncompressedSize}`;
  const encryptionKey = crypto.createHash('sha256').update(keyMaterial).digest();
  ```
- **Observation 5**: In `apps/files/src/index.ts` (lines 16-56), there is only a POST route `/api/v1/files/upload`. There are no other routes or mechanisms implemented for file deletion or lifecycle management, and files are mock-uploaded to S3 indefinitely.
- **Observation 6**: In `apps/bot/src/events/messageDelete.ts` (lines 104-115), when a message is deleted, the bot posts an embed to a Discord webhook, but does not send any API call to the files service to delete the associated attachments.

---

## 2. Logic Chain

1. **In-Memory Caching (Observation 1)**: Temporary in-memory caching of message contents is necessary for compiling edit/delete diffs. Since it is stored solely in memory with a short TTL (1 hour) and actively purged by a sweeper interval, it does not constitute permanent logging and complies with the 24-hour retention requirement of Discord Developer Policies.
2. **Persistent Storage (Observations 2 & 3)**: Since the Prisma database and Redis cache do not contain tables or keys for storing message content or user metadata, the application does not persist raw message data to external storage.
3. **Key Derivation Weakness (Observation 4)**: The key derivation uses `guildId`, `channelId`, `fileId`, and `uncompressedSize`.
   - `guildId` and `channelId` are public Discord identifiers.
   - `fileId` is the filename under which the encrypted file is stored in S3 (`${fileId}.enc`), making it immediately known.
   - `uncompressedSize` is a simple integer representing the file size in bytes, which can be easily brute-forced for typical attachments.
   - Since all components of the key material are public, known, or brute-forceable, and there is no server-side secret key or salt used, the derived encryption key can be reconstructed by an attacker who gains access to the S3 bucket or files metadata.
4. **Data Retention Violation (Observations 5 & 6)**: Since there are no deletion endpoints in the files service and no integration with message deletion events, user attachments uploaded to S3 are stored indefinitely. This violates GDPR Article 17 ("Right to be Forgotten") and Discord Developer Policies which require deleting user data when deleted from the parent platform.

---

## 3. Caveats

- **Mock S3 Storage**: The current implementation of `apps/files` uses a mock upload function (`mockS3Upload`) which outputs a console log and returns a mock URL. If production deployment uses a real S3 provider, bucket lifecycle policies could potentially be configured out-of-band at the cloud provider level, but this is not specified or managed in code.
- **Access Control**: It is assumed that the S3 bucket itself has standard IAM access controls, but compromised credentials or bucket misconfigurations would lead to immediate decryption of all files due to the weak encryption scheme.

---

## 4. Conclusion

- **Message Content Storage**: Bounded, short-term in-memory cache (1-hour TTL) is compliant with Discord Developer Policies. No indefinite database storage of raw message content was found.
- **Attachment Storage (`apps/files`)**: Non-compliant and highly vulnerable. Key derivation lacks a server-side secret (making it easily guessable/brute-forceable), and the lack of a deletion hook/endpoint results in indefinite storage of attachments, violating GDPR/CCPA.

---

## 5. Verification Method

To verify the observations and logic:
1. **Inspect Code Files**:
   - Verify cache TTL and sweeping logic in `apps/bot/src/client/LoggerClient.ts`.
   - Verify lack of message models in `packages/db/prisma/schema.prisma`.
   - Verify key derivation inputs in `apps/files/src/index.ts`.
   - Verify absence of deletion requests in `apps/bot/src/events/messageDelete.ts`.
2. **Cryptographic Key Guessability Test**:
   - Write a script that reads an encrypted test file from the output of `apps/files` (or mocks it), and attempts to derive the key using `guildId`, `channelId`, `fileId`, and a range of guesses for `uncompressedSize` (from 1 to 10MB). Verify that the correct key is found and the file is successfully decrypted within seconds.
