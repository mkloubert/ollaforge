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

import type { Resource } from "i18next";

import ar from "./ar";
import de from "./de";
import el from "./el";
import en from "./en";
import es from "./es";
import fr from "./fr";
import he from "./he";
import hi from "./hi";
import it from "./it";
import ja from "./ja";
import ko from "./ko";
import nl from "./nl";
import pl from "./pl";
import pt from "./pt";
import tr from "./tr";
import uk from "./uk";
import zh from "./zh";

export const resources = {
  en,
  de,
  es,
  fr,
  pt,
  uk,
  zh,
  ja,
  ko,
  ar,
  hi,
  it,
  nl,
  pl,
  el,
  tr,
  he,
} as unknown as Resource;

export const supportedLanguages = [
  "en",
  "de",
  "es",
  "fr",
  "pt",
  "uk",
  "zh",
  "ja",
  "ko",
  "ar",
  "hi",
  "it",
  "nl",
  "pl",
  "el",
  "tr",
  "he",
] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = "en";
