// OllaForge - A web application that simplifies training LLMs with your own data for use in Ollama.
// Copyright (C) 2026  Marcel Joachim Kloubert (marcel@kloubert.dev)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Flag emojis for supported languages.
 * Uses regional indicator symbols for countries most commonly associated with each language.
 */
export const LANGUAGE_FLAGS: Record<string, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  es: "🇪🇸",
  fr: "🇫🇷",
  pt: "🇵🇹",
  uk: "🇺🇦",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  ar: "🌍",
  hi: "🇮🇳",
  it: "🇮🇹",
  nl: "🇳🇱",
  pl: "🇵🇱",
  el: "🇬🇷",
  tr: "🇹🇷",
  he: "🇮🇱",
  auto: "🌐",
};

/**
 * Get the flag emoji for a language code.
 */
export function getLanguageFlag(langCode: string): string {
  return LANGUAGE_FLAGS[langCode] || "🏳️";
}

/**
 * Sort language codes alphabetically by their translated names (case-insensitive).
 * @param languages Array of language codes to sort
 * @param getTranslatedName Function that returns the translated name for a language code
 * @returns Sorted array of language codes
 */
export function sortLanguagesByName<T extends string>(
  languages: readonly T[],
  getTranslatedName: (lang: T) => string
): T[] {
  return [...languages].sort((a, b) => {
    const nameA = getTranslatedName(a).toLowerCase();
    const nameB = getTranslatedName(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}
