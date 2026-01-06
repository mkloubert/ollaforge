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

import type { TranslationSchema } from "../types";

const de: TranslationSchema = {
  translation: {
    common: {
      loading: "Laden...",
      error: "Ein Fehler ist aufgetreten",
      retry: "Erneut versuchen",
      cancel: "Abbrechen",
      save: "Speichern",
      delete: "Löschen",
      create: "Erstellen",
      back: "Zurück",
      name: "Name",
      actions: "Aktionen",
      optional: "optional",
      edit: "Bearbeiten",
    },
    app: {
      title: "OllaForge",
    },
    nav: {
      home: "Startseite",
      projects: "Projekte",
    },
    theme: {
      light: "Hell",
      dark: "Dunkel",
      system: "System",
      toggle: "Design wechseln",
    },
    language: {
      en: "Englisch",
      de: "Deutsch",
      select: "Sprache auswählen",
    },
    api: {
      status: "API-Status",
      connected: "Verbunden",
      disconnected: "Nicht verbunden",
      checking: "Prüfe...",
    },
    projects: {
      title: "Projekte",
      empty: "Noch keine Projekte",
      emptyDescription: "Erstelle dein erstes Projekt, um loszulegen.",
      createNew: "Neues Projekt",
      createTitle: "Neues Projekt erstellen",
      createDescription: "Gib einen Namen für dein neues Projekt ein.",
      namePlaceholder: "Mein Projekt",
      nameLabel: "Projektname",
      descriptionLabel: "Beschreibung",
      descriptionPlaceholder: "Eine kurze Beschreibung deines Projekts",
      creating: "Erstelle...",
      saving: "Speichere...",
      openProject: "Projekt öffnen",
      editTitle: "Projekt bearbeiten",
      editDescription: "Aktualisiere den Projektnamen und die Beschreibung.",
      deleteTitle: "Projekt löschen",
      deleteDescription:
        "Bist du sicher, dass du \"{{name}}\" löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.",
      deleting: "Lösche...",
    },
    project: {
      title: "Projekt",
      backToProjects: "Zurück zu Projekten",
    },
    errors: {
      ERR_PROJECT_1001: "Ein Projekt mit diesem Namen existiert bereits.",
      ERR_PROJECT_1002: "Projekt nicht gefunden.",
      ERR_PROJECT_1003: "Ungültiger Projektname.",
      ERR_PROJECT_1004: "Projektname darf nicht leer sein.",
      ERR_PROJECT_1005: "Projekt konnte nicht erstellt werden.",
      ERR_PROJECT_1006: "Projekt konnte nicht gelöscht werden.",
      ERR_PROJECT_1007: "Projekt konnte nicht aktualisiert werden.",
      unknown: "Ein unerwarteter Fehler ist aufgetreten.",
    },
  },
};

export default de;
