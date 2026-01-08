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

import { encode } from "gpt-tokenizer";

/**
 * Counts the number of tokens in a given text.
 * Uses gpt-tokenizer which provides a good approximation for all LLM providers.
 *
 * @param text - The text to count tokens for
 * @returns The estimated number of tokens
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  return encode(text).length;
}

/**
 * Formats a token count for display.
 *
 * @param count - The token count
 * @returns Formatted string (e.g., "1,234" or "12.3K")
 */
export function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 10000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toLocaleString();
}
