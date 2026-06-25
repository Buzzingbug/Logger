import { ClientEvents } from 'discord.js';
import { LoggerClient } from '../client/LoggerClient';
import * as fs from 'fs';
import * as path from 'path';

export interface EventHandler<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (client: LoggerClient, ...args: ClientEvents[K]) => Promise<void>;
}

export class EventRegistry {
  private client: LoggerClient;

  constructor(client: LoggerClient) {
    this.client = client;
  }

  public register<K extends keyof ClientEvents>(handler: EventHandler<K>) {
    if (handler.once) {
      this.client.once(handler.name, (...args) => handler.execute(this.client, ...args));
    } else {
      this.client.on(handler.name, (...args) => handler.execute(this.client, ...args));
    }
    console.log(`[EventRegistry] Registered handler for: ${handler.name}`);
  }

  public async loadAllEvents() {
    const eventsPath = path.join(__dirname, '..', 'events');
    
    // Ensure the events directory exists
    if (!fs.existsSync(eventsPath)) {
      fs.mkdirSync(eventsPath, { recursive: true });
      console.log(`[EventRegistry] Created empty events directory at ${eventsPath}`);
      return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    let loadedCount = 0;

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      try {
        // Dynamic import
        const eventModule = await import(filePath);
        // We expect the file to export a 'default' containing the EventHandler
        const handler: EventHandler<any> = eventModule.default;
        
        if (handler && handler.name && handler.execute) {
          this.register(handler);
          loadedCount++;
        } else {
          console.warn(`[EventRegistry] File ${file} does not export a valid EventHandler as default.`);
        }
      } catch (error) {
        console.error(`[EventRegistry] Failed to load event file ${file}:`, error);
      }
    }
    
    console.log(`[EventRegistry] Successfully loaded ${loadedCount} event handlers.`);
  }
}
