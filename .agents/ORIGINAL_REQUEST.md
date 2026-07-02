# Original User Request

## Initial Request — 2026-06-29T10:30:37Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval.
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Conduct a comprehensive high-level technical and compliance audit of the Quark Bot repository. Evaluate the bot's architecture strictly against Discord's Trust & Safety Policies.

Working directory: `~/teamwork_projects/quark_bot_audit`
Integrity mode: development

## Requirements

### R1. High-Level Compliance Summary
Produce a written report identifying major architectural red flags in the Quark Bot codebase. Do not generate code patches or attempt to rewrite the repository.

### R2. Trust & Safety Focus
Evaluate the codebase strictly against Discord Developer Policies. Your review must specifically focus on:
1. **Anti-Spam:** Ensure there are no unsolicited DMs (e.g., `on_member_join` DMs) and that all DMs are interaction-based.
2. **Data Retention (GDPR):** Check if raw message content is being stored indefinitely without an auto-cleanup mechanism or cryptographic hashing.
3. **Privileged Intents:** Evaluate whether the features in the codebase justify the use of Message Content, Server Members, or Presence intents.

## Acceptance Criteria

### Audit Quality
- [ ] The final report must explicitly cite the file paths and code snippets where non-compliant or risky architecture is found.
- [ ] Every finding in the report must be explicitly categorized under one of the three T&S pillars (Anti-Spam, Data Privacy, or Privileged Intents).
- [ ] The final output must be a Markdown report only; no code modifications or pull requests are generated.
