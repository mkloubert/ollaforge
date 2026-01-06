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
      ok: "OK",
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
      selectModel: "Base Model",
      selectModelPlaceholder: "Select a model...",
      targetName: "Target Model Name",
      targetNamePlaceholder: "Enter a custom name...",
      configuration: "Configuration",
      status: "Status",
    },
    dataFiles: {
      title: "Training Data",
      empty: "No data files yet",
      dropzone: "Drop JSONL files here or click to upload",
      dropzoneActive: "Drop files here...",
      uploadButton: "Upload File",
      uploading: "Uploading...",
      deleteConfirm: "Delete this file?",
    },
    training: {
      title: "Training",
      startButton: "Create Model",
      cancelButton: "Cancel Training",
      noModel: "Please select a model first",
      noDataFiles: "Please add at least one data file",
      readyDescription: "Everything is set up. Click the button above to start creating your model.",
      status: {
        idle: "Ready",
        starting: "Starting...",
        loading_data: "Loading data...",
        loading_model: "Loading model...",
        training: "Training...",
        exporting: "Exporting model...",
        converting: "Converting to GGUF...",
        completed: "Completed",
        failed: "Failed",
        cancelled: "Cancelled",
      },
      progress: "Progress",
      step: "Step {{current}} of {{total}}",
      device: "Device",
      taskList: "Tasks",
      tasks: {
        detect_device: "Detect compute device",
        load_data: "Load training data",
        import_libraries: "Import ML libraries",
        load_model: "Load base model",
        setup_lora: "Set up LoRA adapter",
        tokenize: "Tokenize dataset",
        train: "Train model",
        merge_lora: "Merge LoRA with base model",
        convert_gguf: "Convert to GGUF format",
        create_modelfile: "Create Ollama Modelfile",
      },
      errorTitle: "Training Failed",
      completed: "Training Completed",
      completedDescription: "Your model was created successfully. Check the output folder for the Modelfile.",
      cancelled: "Training was cancelled.",
    },
    errors: {
      ERR_PROJECT_1001: "A project with this name already exists.",
      ERR_PROJECT_1002: "Project not found.",
      ERR_PROJECT_1003: "Invalid project name.",
      ERR_PROJECT_1004: "Project name cannot be empty.",
      ERR_PROJECT_1005: "Failed to create project.",
      ERR_PROJECT_1006: "Failed to delete project.",
      ERR_PROJECT_1007: "Failed to update project.",
      ERR_MODEL_2001: "Failed to read models configuration.",
      ERR_MODEL_2002: "Failed to write models configuration.",
      ERR_DATA_3001: "Data file not found.",
      ERR_DATA_3002: "Invalid file type. Only JSONL files are allowed.",
      ERR_DATA_3003: "Failed to upload file.",
      ERR_DATA_3004: "Failed to delete file.",
      ERR_DATA_3005: "Failed to read data files.",
      ERR_TRAINING_4001: "A training job is already running.",
      ERR_TRAINING_4002: "No training job is running.",
      ERR_TRAINING_4003: "Please add data files before starting training.",
      ERR_TRAINING_4004: "A training data file was not found.",
      ERR_TRAINING_4005: "Failed to load the model.",
      ERR_TRAINING_4006: "Training failed.",
      ERR_TRAINING_4007: "Failed to export the model.",
      ERR_TRAINING_4008: "Training was cancelled.",
      ERR_TRAINING_4009: "llama.cpp was not found. Please install it first.",
      unknown: "An unexpected error occurred.",
    },
  },
};

export default en;
