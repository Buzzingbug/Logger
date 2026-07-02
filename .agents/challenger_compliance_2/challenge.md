# Compliance Report Challenge

## Challenge Summary

**Overall risk assessment**: CRITICAL

While the findings cited in the compliance report are correct and the cited code snippets and paths are present in the codebase, the report has missed several critical security and compliance violations. Specifically, the dashboard API routes suffer from Broken Object Level Authorization (BOLA/IDOR) allowing unauthorized configuration access/manipulation, the files service is vulnerable to Server-Side Request Forgery (SSRF) and is completely unauthenticated, and the report misses citing `messageCreate.ts` as the trigger for attachment uploads.

---

## Challenges

### [Critical] Challenge 1: Broken Object Level Authorization (BOLA/IDOR) in Dashboard API Routes

- **Assumption challenged**: That only authorized guild administrators or owners can access and modify a guild's configuration, channels, and roles.
- **Attack scenario**: NextAuth authentication restricts access to users in `ADMIN_DISCORD_IDS`, but the backend API routes (`/api/guilds/[id]/config`, `/api/guilds/[id]/channels`, `/api/guilds/[id]/roles`, `/api/guilds/[id]`) only verify if a session exists. They do not perform any authorization check to verify that the logged-in administrator is actually an owner or administrator of the target `guildId`. A malicious whitelisted administrator (e.g. Owner A of Server A) can query or modify the configuration of any other guild (Server B) by sending requests directly to these endpoints.
- **Blast radius**: Complete configuration disclosure and compromise across all servers using the bot. Malicious users could change logging destinations, steal webhook credentials stored in `channelRoutes`, or disable logging features.
- **Mitigation**: Fetch and check guild permissions for the user (using Discord API `/users/@me/guilds` or verifying the user has `MANAGE_GUILD`/`ADMINISTRATOR` permissions in the guild) before returning or modifying any guild-specific resources.

### [Critical] Challenge 2: Server-Side Request Forgery (SSRF) and Unauthenticated Upload in Files Service

- **Assumption challenged**: That the Express files service only receives files from the trusted bot process and only processes valid, public Discord attachments.
- **Attack scenario**: 
  1. The Express route `POST /api/v1/files/upload` lacks any authentication mechanism (e.g., API key, authorization header). Anyone who can reach port 4000 can upload files to S3.
  2. The endpoint fetches arbitrary URLs passed in the `fileUrl` parameter: `const response = await fetch(fileUrl);`. It does not restrict URLs to Discord CDN domains, nor does it block private/internal IP ranges (like `169.254.169.254` or `127.0.0.1`).
  An attacker can send a request to fetch internal server metadata or service endpoints. The service will fetch the data, encrypt it with a predictable key derived from request parameters (also provided by the attacker), upload it to mock S3, and return the storage URL and size. The attacker can then download the encrypted file and decrypt it.
- **Blast radius**: Disclosure of host environment variables, cloud instance metadata, and internal API responses.
- **Mitigation**:
  1. Add an authentication middleware to check for a shared API key or secret token between the bot and the files service.
  2. Validate the `fileUrl` parameter using strict DNS/IP resolution: block private/loopback/link-local ranges, and restrict URLs to allowed domains (`cdn.discordapp.com` / `media.discordapp.net`).

### [Medium] Challenge 3: Incomplete Context Citation for Attachment Upload Trigger

- **Assumption challenged**: That the compliance report cited all relevant files involved in the data retention and key derivation violations of Section 3.2.
- **Attack scenario**: Section 3.2 discusses attachment uploading and insecure key derivation but only cites `apps/files/src/index.ts` and `apps/bot/src/events/messageDelete.ts`. It completely misses `apps/bot/src/events/messageCreate.ts` (lines 13-27), which is the component that actively intercept messages, checks for attachments, and issues the fetch POST requests to the files service.
- **Blast radius**: Developers attempting to remediate the data retention issues or remove/restrict attachment uploads might miss the trigger mechanism in `messageCreate.ts`.
- **Mitigation**: Add a citation and analysis of `apps/bot/src/events/messageCreate.ts` to Section 3.2 of the compliance report.

---

## Stress Test Results

- **BOLA IDOR Check** → Send GET/POST to `/api/guilds/[guildId]/config` using session of logged-in Admin A targeting Guild B → Expected: `403 Forbidden` / `401 Unauthorized` → Actual: `200 OK` (Vulnerability Confirmed) → **FAIL**
- **SSRF in Files Service** → Send POST to `/api/v1/files/upload` with `fileUrl` pointing to `http://localhost:4000` or local metadata → Expected: Blocked/Rejected → Actual: `200 OK` / Fetch request initiated (Vulnerability Confirmed) → **FAIL**
- **Missing GuildBans Intent** → Bot client logged in, member is banned from server → Expected: `guildBanAdd` event logs ban to modlogs → Actual: Event never fires because intent is disabled → **FAIL**
- **Citations Verification** → Verify presence of all cited code blocks in `compliance_report.md` → Expected: Code blocks exist at cited paths → Actual: All blocks present and match exactly → **PASS**

---

## Unchallenged Areas

- **Anti-Spam Welcome DMs** — The report's analysis of welcome DMs was not challenged because the logic in `apps/bot/src/events/guildMemberAdd.ts` strictly routes joins to webhooks and contains no direct messages, which is compliant.
- **In-Memory Cache TTL** — The memory cache implementation (`apps/bot/src/client/LoggerClient.ts`) was not challenged because the TTL sweep mechanism is present and operates as described.
