import { EmbedBuilder, EmbedField } from 'discord.js';

export interface LogEmbedOptions {
  color: number;
  authorName: string;
  authorIconURL: string; // The bot's avatar URL
  typeId: number;
  title?: string;
  description: string;
  fields?: EmbedField[];
  messageId?: string; // used for footer and jump link
  timestamp?: Date;
}

export class LogEmbedBuilder {
  /**
   * Builds an embed strictly adhering to the Quark 7-slot rule.
   * Assumes the Next.js dashboard is hosted at DASHBOARD_URL for loading SVG icons.
   */
  static build(options: LogEmbedOptions): EmbedBuilder {
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
    
    // Custom icon path according to the Numbered ID System
    const iconUrl = `${dashboardUrl}/icons/logs/${options.typeId}.svg`;

    // Footer convention: ID: {messageId} Type {typeId} | {timestamp}
    let footerText = '';
    if (options.messageId) {
      footerText += `ID: ${options.messageId} `;
    }
    footerText += `Type ${options.typeId}`;

    const embed = new EmbedBuilder()
      .setColor(options.color)
      .setAuthor({ name: options.authorName, iconURL: options.authorIconURL })
      .setThumbnail(iconUrl)
      .setDescription(options.description)
      .setFooter({ text: footerText })
      .setTimestamp(options.timestamp || new Date());

    if (options.title) {
      embed.setTitle(options.title);
    }

    if (options.fields && options.fields.length > 0) {
      embed.addFields(options.fields);
    }

    return embed;
  }
}
