# Discord Bot Engineering & Architecture Playbook

This skill encompasses all the technical knowledge, design patterns, and architectural decisions used to build a highly scalable, production-ready Discord bot from scratch. 

## 1. Core Tech Stack
*   **Language & Library:** Python 3.10+ using `discord.py` (which provides native support for Slash Commands, Views, and Modals).
*   **Database:** PostgreSQL for persistent storage.
*   **Hosting:** Railway (or similar PaaS) using a `Procfile` (e.g., `worker: python bot.py`) for continuous deployment.

## 2. Asynchronous Architecture & Event Loop Management
The most critical rule of `discord.py` is **never block the event loop**.
*   **Database Calls:** If using a synchronous database driver like `psycopg2`, every single database call MUST be wrapped in `await asyncio.to_thread(db.method, args)`. Failing to do this will freeze the entire bot during high traffic.
*   **Thread Safety:** A custom Database Manager class must implement a threading lock (`threading.Lock()`) around cursor executions to prevent concurrent write collisions when multiple Discord events fire simultaneously.

## 3. UI Components & Interactions
Modern Discord bots should rely on Interactions rather than text-parsing.
*   **Slash Commands:** Use `@bot.tree.command()` instead of legacy `!commands`. Always explicitly sync the command tree (`await bot.tree.sync()`) on startup or via a dedicated admin command.
*   **Modals & Views:** Use `discord.ui.Modal` with `discord.ui.TextInput` for user input (e.g., Captcha Verification). Use `discord.ui.View` for persistent buttons. 
*   **Ephemeral Responses:** Always use `ephemeral=True` for settings confirmations or verification failures to prevent channel clutter.

## 4. Key Feature Implementation Patterns
*   **Timed Roles (Background Tasks):** Use `@tasks.loop(minutes=1)` from `discord.ext.tasks`. The loop queries the database for expired timestamps, removes the role from the member, and deletes the database record.
*   **Sticky Messages (Glue):** Hook into `on_message`. If the message is in a "glued" channel, delete the old glued message (saving the ID in memory/DB) and send a new identical message to keep it at the bottom.
*   **Pest Control (Trap Channels):** Hook into `on_message`. If a user posts in a designated hidden channel, immediately ban/timeout the user and delete the message.
*   **Anti-Spam (Similarity Tracking):** Instead of exact matching, use Python's `difflib.SequenceMatcher` to compare messages. 

## 5. Trust & Safety Compliance (Crucial for Verification)
If a bot scales beyond 100 servers, it must strictly adhere to Discord's Developer Policy:
*   **No Unsolicited DMs:** NEVER use `on_member_join` to send automated DMs. Discord's anti-spam filters will quarantine the bot. Welcome DMs must only be sent as a response to a Solicited Interaction (e.g., submitting a Captcha modal).
*   **Data Retention (GDPR):** Never store raw `message.content` indefinitely. For anti-spam trackers, either store a cryptographic hash (`hashlib.sha256`) or implement a strict SQL auto-cleanup query (`DELETE FROM table WHERE last_seen < NOW() - INTERVAL '1 day'`).
*   **Intent Justifications:** When applying for Privileged Intents, be highly specific. 
    *   *Message Content:* Justify using passive features (Trap Channels, Sticky Messages, Phishing Detection) that cannot be triggered via Slash Commands.
    *   *Presence Intent:* Leave this unchecked unless actively building user-activity tracking features.
*   **Legal Documents:** A Privacy Policy and TOS are mandatory. They can be hosted for free by pasting them into read-only channels in a Discord Support Server and providing the Message Links to the Developer Portal.
