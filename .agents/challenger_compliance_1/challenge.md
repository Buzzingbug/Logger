# Compliance Challenge Report

## Challenge Summary

**Overall risk assessment**: HIGH

While the initial compliance report accurately identified critical security vulnerabilities in key derivation, lack of deletion hooks for attachments upon message delete, and the missing `GuildBans` intent, it missed several critical architectural, functional, and security compliance violations. In addition, all file paths and cited code snippets in the report are correct and present in the codebase. However, there are significant vulnerabilities and functional bugs that remain unchallenged in the original report.

---

## Challenges

### [High] Challenge 1: Authorization/Access Control Bypass in Dashboard APIs
- **Assumption challenged**: The dashboard assumes that restricting NextAuth authentication to global bot administrators (`ADMIN_DISCORD_IDS`) is sufficient to secure all endpoints.
- **Attack scenario**: In `apps/dashboard/src/app/api/guilds/[id]/config/route.ts`, `apps/dashboard/src/app/api/guilds/[id]/channels/route.ts`, and `apps/dashboard/src/app/api/guilds/[id]/roles/route.ts`, the `guildId` is fetched from the path parameter (`params.id`). However, the API does not check whether the logged-in administrator is a member or has administrative permissions (like `MANAGE_GUILD` or `ADMINISTRATOR`) on that specific guild. A logged-in administrator can view or overwrite the configuration of *any* guild by simply calling the API endpoints with a targeted guild ID. Furthermore, if dashboard access is expanded in the future to server-level administrators, this lack of check will allow any logged-in guild admin to view/edit config of other guilds.
- **Blast radius**: High. Cross-tenant data leakage and security posture modification for all guilds serviced by the bot.
- **Mitigation**: Implement middleware or helper checks on all `/api/guilds/[id]/*` routes to query Discord's OAuth API (using the user's accessToken) to verify the user's membership and permission status for the requested guild.

### [High] Challenge 2: Severe Functional Defect in `messageUpdate` Logging for Uncached Messages
- **Assumption challenged**: The bot assumes that checking `oldMessage.content === newMessage.content` upon message edit is sufficient to detect if content has changed.
- **Attack scenario**: When a message that is not present in the bot's custom in-memory cache (older than 1 hour or bot restarted) is edited, the `messageUpdate` event receives `oldMessage` and `newMessage` as `PartialMessage`s. For partial messages, `content` is `null`. The check `if (oldMessage.content === newMessage.content) return;` evaluates to `null === null` (which is `true`), resulting in an early return.
- **Blast radius**: High. The bot completely fails to log message edits for any message not actively stored in the short-term memory cache.
- **Mitigation**: Before performing the content check, verify if `newMessage.partial` is true. If so, fetch the message first using `await newMessage.fetch()`, or restructure the event handler to handle partial message states appropriately.

### [High] Challenge 3: Unauthenticated Access and SSRF in Files Microservice
- **Assumption challenged**: The files microservice assumes that running internally on port 4000 is sufficient protection against external exposure.
- **Attack scenario**: The Express-based service at `apps/files/src/index.ts` contains no authentication mechanism (e.g. API keys, JWTs) and does not validate the `fileUrl` parameter before fetching it. Any local user or exposed proxy can POST to `/api/v1/files/upload` to download files from arbitrary URLs, causing Server-Side Request Forgery (SSRF) or filling up S3 mock storage.
- **Blast radius**: High. Access to internal network services via SSRF, disk quota exhaustion, and unauthorized S3 uploads.
- **Mitigation**: Add a shared secret API key check header for communication between `apps/bot` and `apps/files`, and validate that the `fileUrl` matches the Discord CDN domain (`cdn.discordapp.com` or `media.discordapp.net`).

### [Medium] Challenge 4: Indefinite Attachment Retention on Message Update
- **Assumption challenged**: The audit assumes that only the deletion of a message requires purging associated attachments.
- **Attack scenario**: If a user updates their message to remove or replace an attachment, a `messageUpdate` event is triggered. However, the event handler in `apps/bot/src/events/messageUpdate.ts` does not invoke any deletion request on the files microservice, leaving the old attachment files in mock S3 storage forever.
- **Blast radius**: Medium. Violation of GDPR Article 5(1)(c) (Data Minimization) and Developer Terms.
- **Mitigation**: Intercept attachment modifications in `messageUpdate` and dispatch a delete request to the files microservice for any removed attachment IDs.

---

## Stress Test Results

- **Dashboard Config endpoint with random `guildId`** → Expected: `403 Forbidden` / `401 Unauthorized` for non-members → Actual: `200 OK` (returns config data or upserts config data) → **FAIL**
- **Edit message not in cache (partial message)** → Expected: Logs "Message Edited" with new content → Actual: Returns early, no log generated → **FAIL**
- **POST arbitrary URL to `/api/v1/files/upload` without API token** → Expected: `401 Unauthorized` / `400 Bad Request` (invalid domain) → Actual: `200 OK` (fetches URL and uploads to S3) → **FAIL**
- **Edit message to remove attachment** → Expected: Purges attachment from S3 → Actual: Attachment remains in S3 indefinitely → **FAIL**

---

## Unchallenged Areas

- **In-Memory Message Cache Duration (1 hour)** — Not challenged. A 1-hour cache duration is a standard, reasonable trade-off between anti-abuse log lookup capabilities and GDPR data minimization requirements.
- **Prisma Schema definition** — Not challenged. The schema strictly contains server config attributes and is compliant with general data storage privacy rules.
