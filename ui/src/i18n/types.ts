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
      dismiss: string;
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
    huggingface: {
      status: {
        loggedIn: string;
        loggedOut: string;
        checking: string;
      };
      changeToken: string;
      login: {
        title: string;
        description: string;
        tokenLabel: string;
        tokenPlaceholder: string;
        help: string;
        getToken: string;
        submit: string;
        submitting: string;
        success: string;
      };
      errors: {
        loginFailed: string;
        invalidToken: string;
      };
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
      tabs: {
        basic: string;
        advanced: string;
      };
      advancedPlaceholder: string;
    };
    advancedConfig: {
      helpPanel: {
        title: string;
        description: string;
        learnMore: string;
        links: {
          huggingface: string;
          qlora: string;
          lora: string;
          transformers: string;
        };
      };
      trainingParams: {
        title: string;
        numEpochs: string;
        numEpochsHelp: string;
        batchSize: string;
        batchSizeHelp: string;
        gradientAccumulation: string;
        gradientAccumulationHelp: string;
        learningRate: string;
        learningRateHelp: string;
        warmupRatio: string;
        warmupRatioHelp: string;
        maxLength: string;
        maxLengthHelp: string;
        fp16: string;
        fp16Help: string;
        optimizer: string;
        optimizerHelp: string;
        optimizers: {
          paged_adamw_8bit: string;
          adamw_torch: string;
          adamw_hf: string;
          sgd: string;
        };
        // Extended training parameters
        weightDecay: string;
        weightDecayHelp: string;
        maxGradNorm: string;
        maxGradNormHelp: string;
        lrScheduler: string;
        lrSchedulerHelp: string;
        schedulers: {
          linear: string;
          cosine: string;
          constant: string;
          polynomial: string;
        };
        neftuneNoise: string;
        neftuneNoiseHelp: string;
        seed: string;
        seedHelp: string;
        bf16: string;
        bf16Help: string;
        loggingSteps: string;
        loggingStepsHelp: string;
        saveStrategy: string;
        saveStrategyHelp: string;
        saveStrategies: {
          no: string;
          epoch: string;
          steps: string;
        };
      };
      defaults: {
        showDefaults: string;
        cudaDefault: string;
        cpuDefault: string;
        resetToDefaults: string;
        resetConfirm: string;
      };
      loraParams: {
        title: string;
        rank: string;
        rankHelp: string;
        alpha: string;
        alphaHelp: string;
        dropout: string;
        dropoutHelp: string;
        targetModules: string;
        targetModulesHelp: string;
        modules: {
          q_proj: string;
          k_proj: string;
          v_proj: string;
          o_proj: string;
          gate_proj: string;
          up_proj: string;
          down_proj: string;
        };
        // Advanced LoRA parameters
        bias: string;
        biasHelp: string;
        biasOptions: {
          none: string;
          lora_only: string;
          all: string;
        };
        useRslora: string;
        useRsloraHelp: string;
        useDora: string;
        useDoraHelp: string;
        modulesToSave: string;
        modulesToSaveHelp: string;
        saveModules: {
          lm_head: string;
          embed_tokens: string;
        };
      };
      quantizationParams: {
        title: string;
        loadIn4bit: string;
        loadIn4bitHelp: string;
        quantType: string;
        quantTypeHelp: string;
        quantTypes: {
          nf4: string;
          fp4: string;
        };
        doubleQuant: string;
        doubleQuantHelp: string;
        computeDtype: string;
        computeDtypeHelp: string;
        computeDtypes: {
          float16: string;
          bfloat16: string;
          float32: string;
        };
        outputQuantization: string;
        outputQuantizationHelp: string;
        outputTypes: {
          f32: string;
          f16: string;
          bf16: string;
          q8_0: string;
          auto: string;
        };
        cudaOnly: string;
      };
      modelfileParams: {
        title: string;
        temperature: string;
        temperatureHelp: string;
        topP: string;
        topPHelp: string;
        topK: string;
        topKHelp: string;
        system: string;
        systemHelp: string;
        systemPlaceholder: string;
        stop: string;
        stopHelp: string;
        stopPlaceholder: string;
        stopAdd: string;
        repeatPenalty: string;
        repeatPenaltyHelp: string;
        repeatLastN: string;
        repeatLastNHelp: string;
        numCtx: string;
        numCtxHelp: string;
      };
    };
    dataFiles: {
      title: string;
      empty: string;
      dropzone: string;
      dropzoneActive: string;
      uploadButton: string;
      uploading: string;
      deleteConfirm: string;
      previewRowCount: string;
      previewTruncated: string;
      previewEmpty: string;
      previewError: string;
      invalidRow: string;
      showRawContent: string;
      rawContentTitle: string;
      rawContentLength: string;
      errorCount: string;
      fileStatus: {
        pending: string;
        in_progress: string;
        completed: string;
        failed: string;
        skipped: string;
      };
      validationErrors: {
        INVALID_JSON: string;
        NOT_OBJECT: string;
        MISSING_INSTRUCTION: string;
        MISSING_OUTPUT: string;
        INVALID_INSTRUCTION_TYPE: string;
        INVALID_OUTPUT_TYPE: string;
      };
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
        import_libraries: string;
        load_model: string;
        setup_lora: string;
        tokenize: string;
        train: string;
        merge_lora: string;
        convert_gguf: string;
        create_modelfile: string;
      };
      taskWarnings: string;
      errorTitle: string;
      completed: string;
      completedDescription: string;
      cancelled: string;
    };
    ollama: {
      title: string;
      createButton: string;
      runButton: string;
      modelName: string;
      creating: string;
      running: string;
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
      ERR_HF_5001: string;
      ERR_HF_5002: string;
      ERR_HF_5003: string;
      ERR_OLLAMA_6001: string;
      ERR_OLLAMA_6002: string;
      ERR_OLLAMA_6003: string;
      ERR_OLLAMA_6004: string;
      ERR_OLLAMA_6005: string;
      ERR_OLLAMA_6006: string;
      ERR_OLLAMA_6007: string;
      unknown: string;
    };
    validation: {
      mustBeInteger: string;
      mustBeNumber: string;
      mustBeString: string;
      mustBeBoolean: string;
      mustBeArray: string;
      mustBeGreaterThan: string;
      mustBeAtLeast: string;
      mustBeAtMost: string;
      maxLength: string;
    };
  };
}
