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

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import {
  defaultLanguage,
  resources,
  supportedLanguages,
  type SupportedLanguage,
} from "./locales";

const LANGUAGE_STORAGE_KEY = "ollaforge-language";

function getStoredLanguage(): SupportedLanguage | null {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && supportedLanguages.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

function getBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.split("-")[0];
  if (supportedLanguages.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage;
  }
  return defaultLanguage;
}

function getInitialLanguage(): SupportedLanguage {
  return getStoredLanguage() ?? getBrowserLanguage();
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false,
  },
});

export function setLanguage(lang: SupportedLanguage): void {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // localStorage not available
  }
}

export function getCurrentLanguage(): SupportedLanguage {
  return i18n.language as SupportedLanguage;
}

export { supportedLanguages, type SupportedLanguage };
export default i18n;
