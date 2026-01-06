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

export interface TranslationSchema {
  translation: {
    common: {
      loading: string;
      error: string;
      retry: string;
      cancel: string;
      save: string;
      delete: string;
      create: string;
      back: string;
      name: string;
      actions: string;
      optional: string;
      edit: string;
    };
    app: {
      title: string;
    };
    nav: {
      home: string;
      projects: string;
    };
    theme: {
      light: string;
      dark: string;
      system: string;
      toggle: string;
    };
    language: {
      en: string;
      de: string;
      select: string;
    };
    api: {
      status: string;
      connected: string;
      disconnected: string;
      checking: string;
    };
    projects: {
      title: string;
      empty: string;
      emptyDescription: string;
      createNew: string;
      createTitle: string;
      createDescription: string;
      namePlaceholder: string;
      nameLabel: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
      creating: string;
      saving: string;
      openProject: string;
      editTitle: string;
      editDescription: string;
      deleteTitle: string;
      deleteDescription: string;
      deleting: string;
    };
    project: {
      title: string;
      backToProjects: string;
    };
    errors: {
      ERR_PROJECT_1001: string;
      ERR_PROJECT_1002: string;
      ERR_PROJECT_1003: string;
      ERR_PROJECT_1004: string;
      ERR_PROJECT_1005: string;
      ERR_PROJECT_1006: string;
      ERR_PROJECT_1007: string;
      unknown: string;
    };
  };
}
