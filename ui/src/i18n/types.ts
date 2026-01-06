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
      ok: string;
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
      selectModel: string;
      selectModelPlaceholder: string;
      targetName: string;
      targetNamePlaceholder: string;
      configuration: string;
      status: string;
    };
    dataFiles: {
      title: string;
      empty: string;
      dropzone: string;
      dropzoneActive: string;
      uploadButton: string;
      uploading: string;
      deleteConfirm: string;
    };
    training: {
      title: string;
      startButton: string;
      cancelButton: string;
      noModel: string;
      noDataFiles: string;
      readyDescription: string;
      status: {
        idle: string;
        starting: string;
        loading_data: string;
        loading_model: string;
        training: string;
        exporting: string;
        converting: string;
        completed: string;
        failed: string;
        cancelled: string;
      };
      progress: string;
      step: string;
      device: string;
      taskList: string;
      tasks: {
        detect_device: string;
        load_data: string;
        import_libraries: string;
        load_model: string;
        setup_lora: string;
        tokenize: string;
        train: string;
        merge_lora: string;
        convert_gguf: string;
        create_modelfile: string;
      };
      errorTitle: string;
      completed: string;
      completedDescription: string;
      cancelled: string;
    };
    errors: {
      ERR_PROJECT_1001: string;
      ERR_PROJECT_1002: string;
      ERR_PROJECT_1003: string;
      ERR_PROJECT_1004: string;
      ERR_PROJECT_1005: string;
      ERR_PROJECT_1006: string;
      ERR_PROJECT_1007: string;
      ERR_MODEL_2001: string;
      ERR_MODEL_2002: string;
      ERR_DATA_3001: string;
      ERR_DATA_3002: string;
      ERR_DATA_3003: string;
      ERR_DATA_3004: string;
      ERR_DATA_3005: string;
      ERR_TRAINING_4001: string;
      ERR_TRAINING_4002: string;
      ERR_TRAINING_4003: string;
      ERR_TRAINING_4004: string;
      ERR_TRAINING_4005: string;
      ERR_TRAINING_4006: string;
      ERR_TRAINING_4007: string;
      ERR_TRAINING_4008: string;
      ERR_TRAINING_4009: string;
      unknown: string;
    };
  };
}
