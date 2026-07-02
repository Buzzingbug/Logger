---
name: discord-bot-compliance
description: Deep knowledge of Discord Developer Policies, Anti-Spam rules, Data Privacy (GDPR), and Privileged Intent justifications for building scaleable Discord Bots.
---

# Discord Bot Compliance & Architecture

When building or auditing Discord Bots, strictly follow these policies and architectural patterns to prevent the bot from being quarantined, banned, or denied Privileged Intents by Discord's Trust & Safety team.

## 1. Direct Messages & Anti-Spam Policy
Discord actively monitors bots for spam behavior. Unsolicited mass-messaging will trigger an automatic quarantine.
*   **NEVER use `on_member_join` for Welcome DMs.** If a bot scales to thousands of users, sending automated DMs triggered by server joins will result in a spam ban.
*   **The Solicited Interaction Rule:** All DMs must be "Solicited" (requested by the user). Only send DMs as a direct response to an explicit User Interaction, such as clicking a "Verify" Button, submitting a Modal, or running a Slash Command. Discord cryptographic interaction tokens whitelist these DMs as safe.
*   **Graceful Failures:** Always wrap `member.send()` in a `try/except discord.Forbidden:` block. If a user has their privacy settings closed, silently `pass` rather than crashing the command or logging excessive errors.

## 2. Data Privacy & Retention (GDPR/CCPA)
Storing user data requires strict compliance with Discord's Developer Terms.
*   **No Permanent Message Logging:** You may **never** store users' raw `message.content` in an external database indefinitely without explicit consent. 
*   **Anti-Spam Hashes:** If you need to track similar messages for anti-spam filters, store a cryptographic hash (e.g., `SHA-256`) of the message instead of the plain text, OR:
*   **Auto-Cleanup Queries:** If you must store raw text (e.g., for `difflib` similarity checks), you must strictly enforce a data retention policy. Implement SQL auto-cleanup queries (e.g., `DELETE FROM anti_spam_tracking WHERE last_seen < NOW() - INTERVAL '1 day'`) to guarantee all raw message data is permanently purged within 24 hours.
*   **Off-Platform Storage:** Storing Discord IDs (User ID, Guild ID, Role ID) in a database (like PostgreSQL) is completely allowed, provided it is declared in your Intent Application and Privacy Policy.

## 3. Privileged Intents
Intents are closely guarded by Discord. Request only what you need and justify them with technical specificity.
*   **Server Members Intent:** Justify this by explaining you need it for security/anti-raid (e.g., tracking account age upon join, applying unverified roles) or persistent leaderboards that require looking up members by ID.
*   **Message Content Intent:** Justify this by explaining features that **cannot** be replicated with Slash Commands. Examples: passive phishing link detection, hidden trap channels for bot raids, or dynamic sticky messages (gluing messages to the bottom of chat).
*   **Presence Intent:** **DO NOT** request this intent unless the bot has a specific, active feature that requires tracking user statuses (e.g., auto-assigning a `@Live` role when someone streams). Checking this box without a feature will cause immediate rejection.

## 4. Legal Documents (Privacy Policy & TOS)
Discord requires a public Privacy Policy and Terms of Service to approve Intents.
*   **Free Hosting Hack:** You do not need a website. You can post your Privacy Policy and TOS into dedicated read-only channels (e.g., `#privacy-policy`) in your bot's official Support Server. Right-click the message, copy the Message Link, and use that URL in the Developer Portal.
*   **About Me Bio:** Always place the link to the Privacy Policy in the bot's "About Me" profile section for guaranteed compliance.

## 5. Trust & Safety Appeals
If a bot is quarantined, the appeal must be handled delicately:
1.  **Take Accountability:** Do not make excuses or blame hackers. State clearly: *"I reviewed the policy and understand why my automated DMs triggered the spam filters."*
2.  **State the Technical Fix:** Explain exactly what code was deleted and what replaced it. *"I have removed all `on_member_join` DMs and moved them behind a Captcha button interaction, making them 100% opt-in and solicited."*
3.  **Be Brief:** T&S agents review hundreds of tickets. Keep the appeal under 3 paragraphs.
