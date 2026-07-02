# Project: Quark Bot Compliance Audit

## Architecture
The Quark Bot repository is a full-stack, multi-package monorepo containing:
1. **Bot Application (`apps/bot`)**: A TypeScript-based Discord bot utilizing `discord.js` to log server events (deletions, updates, joins, etc.).
2. **Files Service (`apps/files`)**: A microservice that downloads, compresses (gzip), and encrypts (AES-256-GCM) message attachments before uploading them to mock storage.
3. **Web Dashboard (`apps/dashboard`)**: A Next.js (App Router) web application providing a user interface for server administrators.
4. **Database Package (`packages/db`)**: Prisma-based database definition for PostgreSQL persistent storage.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Compliance Audit Report | Conduct compliance audit and generate final Markdown report summarizing Anti-Spam, Data Privacy, and Privileged Intents findings. | None | PLANNED |

## Interface Contracts
- **Audit Findings**: Must compile complete information on file paths, code snippets, and T&S compliance violations.
- **Final Report**: Must be outputted as a Markdown file, containing sections on High-Level Summary, Anti-Spam, Data Retention, and Privileged Intents, referencing exact file paths.

## Code Layout
- `apps/bot/src/index.ts` — Bot gateway initialization and client login.
- `apps/bot/src/client/LoggerClient.ts` — Custom Discord client caching implementation.
- `apps/bot/src/events/` — Event handlers representing discord.js events (e.g. `guildMemberAdd`, `messageCreate`).
- `apps/files/src/index.ts` — Express-based attachment encryption/storage service.
- `packages/db/prisma/schema.prisma` — Prisma schema defining PostgreSQL tables.
