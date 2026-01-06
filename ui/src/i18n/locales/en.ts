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

const en: TranslationSchema = {
  translation: {
    common: {
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      create: "Create",
      back: "Back",
      name: "Name",
      actions: "Actions",
      optional: "optional",
      edit: "Edit",
    },
    app: {
      title: "OllaForge",
    },
    nav: {
      home: "Home",
      projects: "Projects",
    },
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
      toggle: "Toggle theme",
    },
    language: {
      en: "English",
      de: "German",
      select: "Select language",
    },
    api: {
      status: "API Status",
      connected: "Connected",
      disconnected: "Disconnected",
      checking: "Checking...",
    },
    projects: {
      title: "Projects",
      empty: "No projects yet",
      emptyDescription: "Create your first project to get started.",
      createNew: "New Project",
      createTitle: "Create New Project",
      createDescription: "Enter a name for your new project.",
      namePlaceholder: "My Project",
      nameLabel: "Project Name",
      descriptionLabel: "Description",
      descriptionPlaceholder: "A brief description of your project",
      creating: "Creating...",
      saving: "Saving...",
      openProject: "Open project",
      editTitle: "Edit Project",
      editDescription: "Update the project name and description.",
      deleteTitle: "Delete Project",
      deleteDescription:
        "Are you sure you want to delete \"{{name}}\"? This action cannot be undone.",
      deleting: "Deleting...",
    },
    project: {
      title: "Project",
      backToProjects: "Back to Projects",
    },
    errors: {
      ERR_PROJECT_1001: "A project with this name already exists.",
      ERR_PROJECT_1002: "Project not found.",
      ERR_PROJECT_1003: "Invalid project name.",
      ERR_PROJECT_1004: "Project name cannot be empty.",
      ERR_PROJECT_1005: "Failed to create project.",
      ERR_PROJECT_1006: "Failed to delete project.",
      ERR_PROJECT_1007: "Failed to update project.",
      unknown: "An unexpected error occurred.",
    },
  },
};

export default en;
