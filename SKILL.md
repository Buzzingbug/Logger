---
name: discord-logging-bot
description: Build a production-grade Discord logging bot with a polished web dashboard, rich embeds with custom icons, per-event channel routing, ignore filters, and a clean toggle-based UI. Use this skill when the user asks to create a Discord bot with logging, moderation audit trails, a settings dashboard, or any bot that tracks and displays server events. Based on deep analysis of quark.bot — one of the most refined Discord logging bots in production.
---

# Discord Logging Bot — Full Stack SKILL

This skill encodes everything learned from reverse-engineering quark.bot: its embed design system, icon architecture, dashboard UX patterns, bot engine choices, and frontend stack. Follow every section before writing a single line of code.

---

## 1. TECH STACK DECISIONS

### Bot Engine
- **Runtime**: Node.js (v20+)
- **Discord library**: `discord.js` v14+ OR a custom lightweight wrapper if performance is critical
  - If building custom: model after Quark's `gluon` — bitfield storage for flags, BigInt for IDs, selective caching only for what the bot needs
- **Gateway encoding**: Use `erlpack` (`discord/erlpack` fork) for ETF binary encoding over JSON for the gateway WebSocket. This is the primary reason Quark achieves <100ms latency at scale.
- **Language**: TypeScript throughout — bot, dashboard API, file service. Use strict mode.
- **File/attachment service**: Separate microservice that downloads, gzip-compresses, and AES-256 encrypts attachments. Store guild ID + channel ID + file ID as the decryption key components so files are useless without the full context.

### Web Dashboard
- **Framework**: Next.js (App Router) + React + TypeScript
- **Auth**: Discord OAuth2 — redirect to `https://discord.com/api/oauth2/authorize`, exchange code for token, store session server-side
- **Styling**: Custom CSS with CSS variables (no Tailwind — gives you full control over the dark theme, toggle states, and Discord-matching aesthetics)
- **Image optimization**: Use Next.js `<Image>` with `/_next/image` for all server/user avatars
- **Color picker** (for per-log embed colors): Use `@melloware/coloris` — lightweight vanilla JS, zero dependencies, attaches to any `<input>`
- **Docs**: Mintlify (docs.quark.bot uses it) — or MDX + Next.js

### Database
- Store per-guild configs as JSON documents (MongoDB or PostgreSQL with JSONB)
- Cache hot configs in Redis with a 60s TTL — bot reads from cache, dashboard writes invalidate it
- Never store message content longer than your retention policy

### Localization
- Use Weblate + a public `languages` repo (TypeScript key-value files)
- Structure: `{ "event.message_deleted": "Message Deleted", ... }`
- Load locale on a per-guild basis from config

---

## 2. EVENT SYSTEM — THE NUMBERED ID ARCHITECTURE

This is Quark's most important architectural decision. Every loggable event gets a **unique integer ID**. This ID is the single source of truth across: the embed icon filename, the database config field, the dashboard toggle key, the i18n string key, and the API.

### Full Event Type Map (from quark.bot docs)

```
// MEMBERS (1x)
1   Member Join
2   Member Leave
25  Nickname Update
26  Server Avatar Changed
44  Role Given
45  Role Taken
46  Members Pruned
57  Bot Added
58  Bot Removed

// MESSAGES (0, 3-7, 10-11, 34-35, 51, 86)
0   Delete Attachment
3   Delete Multiple Messages
4   Delete Thread Message
5   Delete Single Message
6   Edit Thread Message
7   Edit Message
10  Thread Create
11  Thread Delete
34  Message Pinned
35  Message Unpinned
51  Reaction Removed
86  Poll Deleted

// VOICE (8-9, 12-22, 54, 59-64)
8   Stream Start
9   Stream End
12  Video Start
13  Video Stop
14  Moved
15  Voice Channel Change
16  Server Deafen
17  Voice Channel Join
18  Voice Channel Leave
19  Server Mute
20  Server Undeafen
21  Server Unmute
22  Disconnected
54  Voice Channel Status Change
59  Stage Started
60  Stage Ended
61  Stage Updated
62  New Stage Speaker
63  Speaker Invited
64  Stopped Speaking

// ACTIONS (23-24, 36-38, 65-67)
23  Invite Create
24  Invite Delete
36  Emoji Create
37  Emoji Delete
38  Emoji Update
65  Event Created
66  Event Deleted
67  Event Updated

// CHANNELS (27-29, 47-49, 79-85)
27  Channel Create
28  Channel Delete
29  Channel Update
47  Channel Permissions Added
48  Channel Permissions Deleted
49  Channel Permissions Updated
79  Webhook Created
80  Webhook Deleted
81  Webhook Modified
82  Webhook Avatar Updated
83  Channel Followed
84  Channel Unfollowed
85  Followed Channel Updated

// SERVER (30, 52, 55-56)
30  Server Modified
52  Server Icon Update
55  Server Boosted
56  Server Boost Removed

// ROLES (31-33, 50, 53)
31  Role Create
32  Role Delete
33  Role Update
50  Role Permissions Updated
53  Role Icon Update

// MODLOGS (39-43)
39  Ban
40  Timeout
41  Kick
42  Timeout Removed
43  Unban

// QUARK INTERNAL (68-78)
68  Logging Channel Changed
69  Ignore Options Updated
70  Language Changed
71  Token Revoked
72  Token Generated
73  Tag Deleted
74  Tag Added
75  Tag Updated
76  Logging Options Updated
77  Log Updated
78  Configuration Reset
```

### Event Category Groups (for dashboard tabs)
```typescript
const EVENT_CATEGORIES = {
  Messages:      [0, 3, 4, 5, 6, 7, 10, 11, 34, 35, 51, 86],
  Members:       [1, 2, 25, 26, 44, 45, 46, 57, 58],
  Voice:         [8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 54, 59, 60, 61, 62, 63, 64],
  Actions:       [23, 24, 36, 37, 38, 65, 66, 67],
  Channels:      [27, 28, 29, 47, 48, 49, 79, 80, 81, 82, 83, 84, 85],
  Server:        [30, 52, 55, 56],
  Roles:         [31, 32, 33, 50, 53],
  Modlogs:       [39, 40, 41, 42, 43],
  Internal:      [68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78],
};
```

---

## 3. EMBED DESIGN SYSTEM

### The Anatomy of Every Rich Embed
Discord embeds have these slots — use ALL of them on every log:

```typescript
interface LogEmbed {
  color: number;           // hex int — unique per event category
  author: {
    name: string;          // e.g. "Message Deleted"
    icon_url: string;      // your bot's avatar URL
  };
  thumbnail: {
    url: string;           // YOUR CUSTOM ICON — /public/icons/logs/{typeId}.svg
  };
  title?: string;          // optional: summarized action
  description: string;     // main content: user mentions, channel links, content
  fields: EmbedField[];    // key/value pairs for metadata
  footer: {
    text: string;          // "Type {typeId} | {timestamp}"
    icon_url?: string;
  };
  timestamp: string;       // ISO8601
}
```

### Custom Icon System
Each event type gets its own SVG icon file, served from your own CDN:
```
/public/icons/logs/5.svg   → Message Deleted (red envelope with X)
/public/icons/logs/17.svg  → Voice Channel Join (green mic)
/public/icons/logs/39.svg  → Ban (red hammer)
```

**Design rules for icons:**
- 128×128px viewBox, centered icon
- Single-color or dual-color fills — no gradients
- Must be readable at 80×80px (Discord thumbnail render size)
- Match the embed color family (red icons for destructive, green for joins, blue for info)
- Use consistent stroke weight (2px) across all icons

**Embed color palette by category:**
```typescript
const EMBED_COLORS = {
  Messages:  0xED4245,  // Discord red — deletions feel destructive
  Members:   0x57F287,  // Discord green — joins feel positive
  Voice:     0x5865F2,  // Discord blurple — voice feels system
  Actions:   0xFEE75C,  // Discord yellow — actions feel neutral/cautionary
  Channels:  0xEB459E,  // Discord fuchsia — structural changes
  Server:    0xED4245,  // Red — server changes are significant
  Roles:     0x5865F2,  // Blurple
  Modlogs:   0xED4245,  // Red — always serious
};
```

### Jump to Context Link
Every message-related log must include a jump link in the description:
```typescript
const jumpUrl = `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
// Render as: [Jump to context](${jumpUrl})
```

### Footer Convention
```
ID: {messageId} {typeId} | {timestamp}
```
This gives moderators the exact message snowflake AND the log type ID in one line.

---

## 4. DASHBOARD UX — THE QUARK PATTERN

### Core UX Philosophy
The dashboard has ONE job: let server admins control logging without reading docs. Every control must be self-explanatory. No nested modals. No hidden settings.

### Layout Structure
```
Sidebar (fixed)
  └── Server selector (avatar + name dropdown)
  └── Nav links: Channels | Ignore | Integrations | Settings | Danger

Main Panel
  └── Header: Server name + avatar
  └── Tab content
```

### Tab 1: Channels (the most-used tab)
This is the heart of the dashboard. For each event category:

```
[Category Name]   [i info icon]
├── Channel: [#channel-dropdown ▼]   [○ enable/disable toggle]
├── [event name]    [○ toggle]
├── [event name]    [○ toggle]
└── [event name]    [○ toggle]
```

**Rules:**
- Category-level toggle = enable/disable the entire category
- Category-level channel dropdown = route all events in that category to one channel
- Per-event toggles appear below, collapsible — let power users override individual events
- Disabling a category grays out all its children (CSS `opacity: 0.4; pointer-events: none`)
- Save is **auto-save on change** (debounced 800ms), NOT a submit button — eliminates the "did I save?" anxiety
- Show a small "Saved ✓" indicator that fades after 2 seconds
- Support Discord forum channels in the channel dropdown — let users organize logs as forum posts

**Channel dropdown component:**
- Shows `#channel-name` with channel type icon (text, forum, announcement)
- Searchable input filter
- Grouped by Discord category
- "Not logging" as the null/disabled option at the top

### Tab 2: Ignore Options
Four sections, each with a tag-input field:

```
Ignore Target Users    [user ID input + tags]
Ignore Executor Users  [user ID input + tags]  
Ignore Roles           [role selector + tags]
Ignore Channels        [channel selector + tags]
```

**UX rules:**
- "Target" = the user the action was performed ON
- "Executor" = the user who performed the action
- Explain this distinction with a tooltip/callout — it confuses users
- Accept Discord user IDs as input (not usernames — those change)
- Show avatar + username preview when a valid ID is entered
- Tags are removable with × button

### Tab 3: Integrations
Simple toggle cards for each supported bot:

```
┌─────────────────────────────────────┐
│ 🤖 PluralKit                [toggle]│
│ Prevents proxy messages from being  │
│ logged as deleted messages          │
└─────────────────────────────────────┘
```

### Tab 4: Appearance / Customization
Per-log-category color picker using Coloris:
```
Messages   [████] #ED4245   [color swatch input]
Members    [████] #57F287
...
```
Plus: embed style toggle (compact vs full), timestamp format, bot display name override.

### Tab 5: Danger Zone
```
[Reset all settings]  — requires typing server name to confirm
[Revoke API token]
[Remove bot from server]
```
Red border on the section. Confirmation dialogs. Never one-click destructive actions.

### Toggle Component Spec
```css
/* The toggle is the single most-used UI element — make it perfect */
.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--color-surface-2);
  transition: background 150ms ease;
  cursor: pointer;
  position: relative;
}
.toggle[data-checked="true"] {
  background: #57F287; /* Discord green for "active" */
}
.toggle-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 150ms ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.toggle[data-checked="true"] .toggle-thumb {
  transform: translateX(20px);
}
```

### Dashboard Color Tokens
```css
:root {
  /* Dark theme (default — matches Discord) */
  --color-bg:        #0f0f11;
  --color-surface:   #1a1a1f;
  --color-surface-2: #26262d;
  --color-surface-3: #2f2f38;
  --color-border:    #3a3a45;
  --color-text:      #e8e8ed;
  --color-text-muted:#8b8b99;
  --color-accent:    #c336c3;  /* Quark purple — replace with your brand */
  --color-success:   #57F287;
  --color-danger:    #ED4245;
  --color-warning:   #FEE75C;
}
```

---

## 5. LANDING PAGE UX PATTERNS

### Hero Section
- Title with animated word cycling (CSS `@keyframes` swap, no JS): "The Future of **Discord** / **Server** / **Community** Logging"
- Two CTAs side by side: "Add to Discord" (primary, Discord blue) + "View Dashboard" (ghost)
- Embed preview cards below — render pixel-perfect replicas of your actual Discord log embeds directly in HTML. These are the highest-trust conversion elements on the page.

### Infinite Marquee Strips
```css
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.marquee-track {
  display: flex;
  width: max-content;
  animation: marquee 25s linear infinite;
}
/* Duplicate content once so loop is seamless */
```

### Stats Counter (animated on scroll)
```javascript
// Use IntersectionObserver, count up from 0 to final value over 1.5s
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) animateCount(el, 0, target, 1500);
});
```

### Feature Cards — Infinite Scroll Grid
Two rows of cards scrolling in opposite directions, CSS-only, no JS.

### Testimonial Section
- Video testimonials (`.webm` format — smallest file size for web)
- Community avatar + member count + Discord invite link = trust signals
- Carousel auto-scrolls, pause on hover

### Docs (Mintlify)
Use Mintlify for docs — it handles search, versioning, and the sidebar automatically. Write docs in MDX. Set `primaryColor` to your brand color.

---

## 6. BOT ARCHITECTURE

### Caching Strategy (memory-efficient)
Only cache what you need to diff:
```typescript
// Store messages in cache for edit/delete diffing
// Use Map with TTL eviction
const messageCache = new Map<string, CachedMessage>();
// Evict after 1 hour (or your retention policy)
// Store: content, attachments array, author id, channel id, timestamp
```

### Event Handler Structure
```typescript
// One file per Discord event
// src/events/messageDelete.ts
// src/events/guildMemberAdd.ts
// etc.

// Each handler:
// 1. Gets guild config from Redis cache
// 2. Checks if event type is enabled
// 3. Checks ignore filters (target, executor, channel, role)
// 4. Builds embed
// 5. Posts to configured log channel via webhook (faster than bot message)
```

### Use Webhooks for Logging
**Critical**: Post logs via Discord webhooks, not bot messages. Webhooks are:
- Not rate-limited the same way
- Can have custom usernames and avatars per log type
- Can batch up to 10 embeds per request

### Ignore Filter Check (always run this before logging)
```typescript
function shouldIgnore(config: GuildConfig, event: LogEvent): boolean {
  if (!config.enabledEvents.includes(event.typeId)) return true;
  if (config.ignoreTargetUsers.includes(event.targetId)) return true;
  if (config.ignoreExecutorUsers.includes(event.executorId)) return true;
  if (config.ignoreChannels.includes(event.channelId)) return true;
  const memberRoles = event.targetRoles ?? [];
  if (memberRoles.some(r => config.ignoreRoles.includes(r))) return true;
  return false;
}
```

### PluralKit Integration
PluralKit proxies messages — the original user message gets deleted and replaced by a webhook message. Without integration, this floods logs with false "message deleted" events.
```typescript
// Cache PluralKit webhook IDs for the guild
// On messageDelete: if author is a known PluralKit webhook, skip or label it
// Check the PluralKit API: https://api.pluralkit.me/v2/msg/{messageId}
```

---

## 7. FILE / ATTACHMENT LOGGING

Quark's `file` service is a separate Node.js microservice. Replicate this pattern:

```typescript
// On every message with attachments:
// 1. Download the file (before Discord CDN expires it)
// 2. Gzip compress
// 3. AES-256-GCM encrypt
//    key = sha256(guildId + channelId + fileId + uncompressedSize)
// 4. Store in S3-compatible storage (R2, Backblaze, etc.)
// 5. When logging a deleted message: decrypt + serve via your CDN

// The decryption key requires knowing guildId + channelId + fileId + size
// This means files are useless if exfiltrated without full context
```

---

## 8. API (for third-party integrations)

Expose a REST API so other bots can integrate:
```
GET  /api/v1/guild/{guildId}/config
POST /api/v1/guild/{guildId}/log          — submit a custom log event
GET  /api/v1/guild/{guildId}/logs         — search logs
POST /api/v1/guild/{guildId}/token        — generate API token
DEL  /api/v1/guild/{guildId}/token        — revoke token
```

Token auth: JWT signed with guild-specific secret, rotatable via dashboard.

---

## 9. PERFORMANCE & RELIABILITY RULES

- **Never block the event loop** in the bot process. Offload heavy work (file downloads, DB writes) to a queue (BullMQ + Redis).
- **Webhook pool per guild**: create one webhook per log channel, cache the webhook URL, reuse it. Recreate if webhook is deleted (catch `10015` error).
- **Retry logic**: exponential backoff for Discord API 429s. Never drop a log silently.
- **Shard early**: use Discord's gateway sharding from day one. Plan for `Math.ceil(guildCount / 1000)` shards.
- **Health endpoint**: expose `/health` returning uptime, shard status, queue depth.
- **Status page**: use `status.quark.bot` pattern — host a public uptime page (Better Uptime, UptimeRobot).
- **99.9% uptime** is a marketing claim you must be able to back up. Use PM2 or containerize with Docker + auto-restart.

---

## 10. WHAT NOT TO DO

- **Never use `discord.js`'s default message caching** — it caches everything and kills memory at scale. Implement selective caching.
- **Never store raw message content in logs forever** — implement retention limits (free: 30 days, premium: 8 weeks+).
- **Never put a save button on the dashboard** — auto-save on change. Save buttons are friction.
- **Never use a generic embed style** — plain text description with no icon, no color, no footer = ignored. Use all 7 embed slots.
- **Never show all 87 event types flat** — group by category with collapsible sections or tabs.
- **Never use a modal for channel selection** — use inline dropdowns that feel native to the dashboard row.
- **Never lock basic log types behind a paywall** — Quark's free tier is generous. Charge for retention, limits, and analytics — not for the core logging functionality. This drives adoption.

---

## 11. PREMIUM TIER DESIGN

Free tier should be fully functional. Premium unlocks:
- Longer message retention (8 weeks vs 30 days)
- Higher attachment storage quota
- Log search history
- Priority support
- Analytics (message volume, activity charts)
- Custom log types (future)
- Backup bot (Pro bot instance for redundancy)

Never paywalled: core log types, dashboard access, API, integrations.

---

## 12. QUICK REFERENCE CHECKLIST

Before shipping any feature, verify:

- [ ] Event has a unique integer typeId
- [ ] Embed uses color + author + thumbnail (icon) + description + fields + footer
- [ ] Icon SVG exists at `/public/icons/logs/{typeId}.svg`
- [ ] Dashboard toggle for this event exists in correct category tab
- [ ] Ignore filter check runs before logging
- [ ] Jump-to-context link included for message events
- [ ] Log posted via webhook (not bot message)
- [ ] Config change saved to DB and Redis cache invalidated
- [ ] i18n key added to languages repo
- [ ] Docs page updated (or queued)
