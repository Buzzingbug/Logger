import fs from 'fs';
import path from 'path';

const localesDir = path.join(__dirname, '..', 'locales');
const locales: Record<string, Record<string, string>> = {};

// Load all JSON files in the locales directory
if (fs.existsSync(localesDir)) {
  const files = fs.readdirSync(localesDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const locale = file.replace('.json', '');
      const content = fs.readFileSync(path.join(localesDir, file), 'utf-8');
      try {
        locales[locale] = JSON.parse(content);
      } catch (e) {
        console.error(`Failed to parse locale file: ${file}`);
      }
    }
  }
}

/**
 * Translates a key based on the provided language code.
 * Falls back to 'en-US' if the key or language is not found.
 */
export function t(key: string, language: string = 'en-US', variables: Record<string, string | number> = {}): string {
  const langStrings = locales[language] || locales['en-US'] || {};
  let str = langStrings[key] || locales['en-US']?.[key] || key;

  for (const [varName, varValue] of Object.entries(variables)) {
    str = str.replace(new RegExp(`\\{${varName}\\}`, 'g'), String(varValue));
  }

  return str;
}
