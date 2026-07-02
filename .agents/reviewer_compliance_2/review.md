# Quark Bot Compliance Audit Review Report

This report contains the Quality Review and Adversarial Challenge for the Quark Bot Technical & Compliance Audit Report (`compliance_report.md`), conducted by Compliance Report Reviewer 2.

---

## Part 1: Quality Review

### Review Summary

**Verdict**: APPROVE

The compliance report is highly thorough, factually correct, and aligns perfectly with the codebase files (`apps/bot/src/index.ts`, `apps/bot/src/client/LoggerClient.ts`, `apps/files/src/index.ts`, and the events directory). It correctly identifies critical security and GDPR violations and aligns them with Discord Developer Policies.

### Findings

#### [Minor] Finding 1: Explicit Pillar Labeling in Summary
- **What**: The findings in Section 1 (High-Level Compliance Summary) are clear but do not explicitly prefix or tag which of the three T&S pillars they fall under.
- **Where**: `compliance_report.md` Section 1, lines 7–11.
- **Why**: The user request requires that every finding is explicitly categorized under one of the three pillars (Anti-Spam, Data Privacy, or Privileged Intents). While the sections later in the report categorize them, the summary list itself would benefit from explicit tags (e.g., `[Data Privacy]` or `[Privileged Intents]`) for clarity.
- **Suggestion**: Add a prefix to each item in the summary, e.g.:
  1. `[Data Privacy] Critical Security Vulnerability in Key Derivation...`
  2. `[Data Privacy] Data Retention Violation in Attachment Storage...`
  3. `[Privileged Intents] Broken Logging Functionality via Missing Intent Configuration...`

#### [Minor] Finding 2: Missing Code Snippet for Deletion Logic
- **What**: Section 3.2, Issue B highlights that the codebase lacks any deletion hook in the message deletion handler, but does not provide a code snippet from `messageDelete.ts` or `messageCreate.ts` to illustrate this gap.
- **Where**: `compliance_report.md` Section 3.2.
- **Why**: Including snippet context from `messageDelete.ts` would make the citation even more explicit.
- **Suggestion**: Add a short code snippet from `apps/bot/src/events/messageDelete.ts` to show how the deletion event is handled without calling the files service.

---

### Verified Claims

- **Claim 1**: Automated DMs are not sent on member joins (`guildMemberAdd.ts`). Webhooks are used instead.
  - *Verification*: Checked `apps/bot/src/events/guildMemberAdd.ts` lines 10–52. The handler constructs an embed and calls `webhook.send()`. No `member.send()` or `member.user.send()` is present.
  - *Status*: PASS
- **Claim 2**: Slash commands do not trigger unsolicited DMs. Ephemeral replies are used.
  - *Verification*: Checked `apps/bot/src/events/interactionCreate.ts` lines 5–51. All commands use `interaction.reply` or `interaction.editReply`. The dashboard link is correctly set to `ephemeral: true`.
  - *Status*: PASS
- **Claim 3**: Raw message content is cached in-memory for a maximum of 1 hour with a periodic sweep.
  - *Verification*: Checked `apps/bot/src/client/LoggerClient.ts` lines 13–48. `CACHE_TTL_MS` is set to `60 * 60 * 1000` (1 hour) and the sweeper runs every 5 minutes.
  - *Status*: PASS
- **Claim 4**: Encryption key derivation in the files service is based entirely on predictable parameters.
  - *Verification*: Checked `apps/files/src/index.ts` lines 34–37. Key is derived via `crypto.createHash('sha256').update(\`${guildId}${channelId}${fileId}${uncompressedSize}\`).digest()`.
  - *Status*: PASS
- **Claim 5**: Stored attachments are retained indefinitely upon message deletion.
  - *Verification*: Checked `apps/bot/src/events/messageDelete.ts` and confirmed there are no HTTP requests to the files service to trigger deletion.
  - *Status*: PASS
- **Claim 6**: The bot client does not register the standard `GuildBans` intent, rendering ban/unban logs non-functional.
  - *Verification*: Checked `apps/bot/src/index.ts` lines 8–24. The `intents` array lists `Guilds`, `GuildMessages`, `MessageContent`, `GuildMembers`, `GuildVoiceStates`, and `GuildMessageReactions`, but omits `GuildBans`.
  - *Status*: PASS

---

### Coverage Gaps

- **Web Dashboard Security & Data Privacy**
  - *Risk level*: Low
  - *Recommendation*: Accept risk. Checked `apps/dashboard/src/lib/auth.ts` and confirmed NextAuth is configured to restrict access to IDs specified in `ADMIN_DISCORD_IDS`. API routes in `apps/dashboard/src/app/api/guilds/[id]/config/route.ts` correctly perform session validation before serving or saving configuration data. No user logs or raw messages are stored or processed here.
- **Database Schema Storage**
  - *Risk level*: Low
  - *Recommendation*: Accept risk. Checked `packages/db/prisma/schema.prisma` and confirmed the only model is `GuildConfig`. It does not store user profiles, messages, or files.

---

### Unverified Items

- None (All relevant claims have been verified against the codebase).

---

## Part 2: Adversarial Challenge

### Challenge Summary

**Overall risk assessment**: CRITICAL

The audited system has two critical vulnerabilities: a predictable encryption key derivation scheme that allows anyone with storage access to decrypt all attachments, and a GDPR violation due to indefinite storage of deleted user attachments.

### Challenges

#### [Critical] Challenge 1: Cryptographically Weak Key Derivation
- **Assumption challenged**: Combining `guildId`, `channelId`, `fileId`, and `uncompressedSize` produces a secure, high-entropy key for AES-256-GCM.
- **Attack scenario**: If the S3 storage bucket is compromised, an attacker can read the files. The filenames match `${fileId}.enc`. The `fileId`, `guildId`, and `channelId` are public Discord snowflakes. The `uncompressedSize` can be guessed or brute-forced in milliseconds. The attacker can reconstruct the key for any file and decrypt it instantly without a server secret.
- **Blast radius**: Complete compromise of all encrypted attachments stored in the files service.
- **Mitigation**: Introduce a server-side secret key `ATTACHMENT_ENCRYPTION_SECRET` (loaded via environment variables) and use HKDF or a salted hash (e.g. `sha256(secret + keyMaterial)`) to derive keys.

#### [High] Challenge 2: Indefinite Data Retention
- **Assumption challenged**: The bot is compliant because the main database only stores configuration data.
- **Attack scenario**: A user deletes a message containing sensitive images. The bot logs the deletion, but the files service keeps the raw compressed and encrypted image in the S3 bucket forever. This violates GDPR Article 17 ("Right to be Forgotten") and Discord Developer Terms.
- **Blast radius**: Regulatory non-compliance and immediate bot suspension/ban by Discord Trust & Safety.
- **Mitigation**: Implement a DELETE route in the files service and call it from the bot's `messageDelete` handler. Set a lifecycle rule on the S3 bucket to automatically prune files older than a short period (e.g., 14 days).

#### [Medium] Challenge 3: Inactive Event Handlers (Gateway Intent Mismatch)
- **Assumption challenged**: Registering `guildBanAdd` and `guildBanRemove` event handlers is sufficient for ban logging.
- **Attack scenario**: A moderator bans a user. The bot fails to log the ban because the client did not request the standard `GuildBans` intent, so the gateway never dispatches these events.
- **Blast radius**: Critical functionality failure for ban/unban moderation logs.
- **Mitigation**: Add `GatewayIntentBits.GuildBans` to the `intents` array in `apps/bot/src/index.ts`.

---

### Stress Test Results

- **Brute-forcing key derivation for file decryption**
  - *Expected behavior*: Derivation should depend on a private secret that cannot be brute-forced.
  - *Actual behavior*: An attacker with S3 access can brute-force the `uncompressedSize` (usually 10KB to 10MB) in seconds to reconstruct the SHA-256 key material.
  - *Status*: FAIL (Vulnerability confirmed)
- **Data deletion propagation**
  - *Expected behavior*: Deleting a Discord message propagates the deletion request to the files service to purge storage.
  - *Actual behavior*: `messageDelete.ts` executes and exits without making any external API call to delete the stored file.
  - *Status*: FAIL (GDPR violation confirmed)

---

### Unchallenged Areas

- **In-memory cache performance under scale**
  - *Reason not challenged*: Out of scope for a high-level compliance and safety audit. The caching mechanism is structurally compliant with GDPR (TTL = 1 hour, in-memory only).
