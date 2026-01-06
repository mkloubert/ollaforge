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
      ok: "OK",
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
      selectModel: "Basis-Modell",
      selectModelPlaceholder: "Modell auswählen...",
      targetName: "Ziel-Modellname",
      targetNamePlaceholder: "Eigenen Namen eingeben...",
      configuration: "Konfiguration",
      status: "Status",
    },
    dataFiles: {
      title: "Trainingsdaten",
      empty: "Noch keine Dateien",
      dropzone: "JSONL-Dateien hierher ziehen oder klicken zum Hochladen",
      dropzoneActive: "Dateien hier ablegen...",
      uploadButton: "Datei hochladen",
      uploading: "Wird hochgeladen...",
      deleteConfirm: "Diese Datei löschen?",
      previewRowCount: "{{count}} Zeilen insgesamt",
      previewTruncated: "zeige erste {{count}}",
      previewEmpty: "Diese Datei enthält keine Datenzeilen.",
      previewError: "Dateiinhalt konnte nicht geladen werden.",
      invalidRow: "Ungültige Zeile",
      showRawContent: "Roh anzeigen ({{size}})",
      rawContentTitle: "Rohinhalt - Zeile {{line}}",
      rawContentLength: "{{count}} Zeichen",
      errorCount: "{{count}} ungültige Zeile(n) gefunden",
      validationErrors: {
        INVALID_JSON: "Ungültige JSON-Syntax",
        NOT_OBJECT: "Muss ein JSON-Objekt sein",
        MISSING_INSTRUCTION: "Feld \"instruction\" fehlt",
        MISSING_OUTPUT: "Feld \"output\" fehlt",
        INVALID_INSTRUCTION_TYPE: "\"instruction\" muss ein String sein",
        INVALID_OUTPUT_TYPE: "\"output\" muss ein String sein",
      },
    },
    training: {
      title: "Training",
      startButton: "Modell erstellen",
      cancelButton: "Training abbrechen",
      noModel: "Bitte wähle zuerst ein Modell aus",
      noDataFiles: "Bitte füge mindestens eine Datei hinzu",
      readyDescription: "Alles ist eingerichtet. Klicke auf den Button oben, um dein Modell zu erstellen.",
      status: {
        idle: "Bereit",
        starting: "Wird gestartet...",
        loading_data: "Lade Daten...",
        loading_model: "Lade Modell...",
        training: "Trainiere...",
        exporting: "Exportiere Modell...",
        converting: "Konvertiere zu GGUF...",
        completed: "Abgeschlossen",
        failed: "Fehlgeschlagen",
        cancelled: "Abgebrochen",
      },
      progress: "Fortschritt",
      step: "Schritt {{current}} von {{total}}",
      device: "Gerät",
      taskList: "Aufgaben",
      tasks: {
        detect_device: "Rechengerät erkennen",
        load_data: "Trainingsdaten laden",
        import_libraries: "ML-Bibliotheken importieren",
        load_model: "Basismodell laden",
        setup_lora: "LoRA-Adapter einrichten",
        tokenize: "Datensatz tokenisieren",
        train: "Modell trainieren",
        merge_lora: "LoRA mit Basismodell zusammenführen",
        convert_gguf: "In GGUF-Format konvertieren",
        create_modelfile: "Ollama-Modelfile erstellen",
      },
      errorTitle: "Training fehlgeschlagen",
      completed: "Training abgeschlossen",
      completedDescription: "Dein Modell wurde erfolgreich erstellt. Prüfe den Output-Ordner für das Modelfile.",
      cancelled: "Training wurde abgebrochen.",
    },
    errors: {
      ERR_PROJECT_1001: "Ein Projekt mit diesem Namen existiert bereits.",
      ERR_PROJECT_1002: "Projekt nicht gefunden.",
      ERR_PROJECT_1003: "Ungültiger Projektname.",
      ERR_PROJECT_1004: "Projektname darf nicht leer sein.",
      ERR_PROJECT_1005: "Projekt konnte nicht erstellt werden.",
      ERR_PROJECT_1006: "Projekt konnte nicht gelöscht werden.",
      ERR_PROJECT_1007: "Projekt konnte nicht aktualisiert werden.",
      ERR_MODEL_2001: "Modellkonfiguration konnte nicht gelesen werden.",
      ERR_MODEL_2002: "Modellkonfiguration konnte nicht geschrieben werden.",
      ERR_DATA_3001: "Datei nicht gefunden.",
      ERR_DATA_3002: "Ungültiger Dateityp. Nur JSONL-Dateien sind erlaubt.",
      ERR_DATA_3003: "Datei konnte nicht hochgeladen werden.",
      ERR_DATA_3004: "Datei konnte nicht gelöscht werden.",
      ERR_DATA_3005: "Dateien konnten nicht geladen werden.",
      ERR_TRAINING_4001: "Ein Training läuft bereits.",
      ERR_TRAINING_4002: "Es läuft kein Training.",
      ERR_TRAINING_4003: "Bitte füge Trainingsdaten hinzu.",
      ERR_TRAINING_4004: "Eine Trainingsdatei wurde nicht gefunden.",
      ERR_TRAINING_4005: "Modell konnte nicht geladen werden.",
      ERR_TRAINING_4006: "Training fehlgeschlagen.",
      ERR_TRAINING_4007: "Modell konnte nicht exportiert werden.",
      ERR_TRAINING_4008: "Training wurde abgebrochen.",
      ERR_TRAINING_4009: "llama.cpp wurde nicht gefunden. Bitte installiere es zuerst.",
      unknown: "Ein unerwarteter Fehler ist aufgetreten.",
    },
  },
};

export default de;
