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

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { updateProject } from "@/lib/projects";
import {
  validateLoraConfig,
  validateModelfileConfig,
  validateQuantizationConfig,
  validateTrainingConfig,
  type ValidationResult,
} from "@/lib/validation";
import type {
  LoraConfig,
  Model,
  ModelfileConfig,
  Project,
  QuantizationConfig,
  TrainingConfig,
  TrainingPreset,
} from "@/types";

interface DocLinks {
  transformers: string;
  qlora: string;
  lora: string;
  huggingface: string;
}

interface UseProjectConfigProps {
  project: Project | null;
  slug: string | undefined;
  models: Model[];
}

export function useProjectConfig({ project, slug, models }: UseProjectConfigProps) {
  const { t } = useTranslation();

  // Local overrides (null = use project value)
  const [selectedModelOverride, setSelectedModelOverride] = useState<string | null>(null);
  const [targetNameOverride, setTargetNameOverride] = useState<string | null>(null);

  // Advanced config overrides
  const [trainingConfigOverride, setTrainingConfigOverride] = useState<TrainingConfig | null>(null);
  const [loraConfigOverride, setLoraConfigOverride] = useState<LoraConfig | null>(null);
  const [quantizationConfigOverride, setQuantizationConfigOverride] = useState<QuantizationConfig | null>(null);
  const [modelfileConfigOverride, setModelfileConfigOverride] = useState<ModelfileConfig | null>(null);

  // Validation and UI state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(true);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isTrainingParamsOpen, setIsTrainingParamsOpen] = useState(false);
  const [isLoraParamsOpen, setIsLoraParamsOpen] = useState(false);
  const [isQuantizationParamsOpen, setIsQuantizationParamsOpen] = useState(false);
  const [isModelfileParamsOpen, setIsModelfileParamsOpen] = useState(false);

  // Documentation links
  const docLinks = useMemo((): DocLinks => ({
    transformers: import.meta.env.VITE_DOC_LINK_TRANSFORMERS || "https://huggingface.co/docs/transformers/training",
    qlora: import.meta.env.VITE_DOC_LINK_QLORA || "https://arxiv.org/abs/2305.14314",
    lora: import.meta.env.VITE_DOC_LINK_LORA || "https://huggingface.co/docs/peft/main/en/conceptual_guides/lora",
    huggingface: import.meta.env.VITE_DOC_LINK_HUGGINGFACE || "https://huggingface.co/docs/transformers",
  }), []);

  // Combined models list: API models + saved project model (if not already in list)
  const combinedModels = useMemo((): Model[] => {
    const savedModel = project?.model;
    if (!savedModel || savedModel.trim() === "") {
      return models;
    }
    const exists = models.some((m) => m.name === savedModel);
    if (exists) {
      return models;
    }
    return [{ name: savedModel }, ...models];
  }, [models, project]);

  // Effective selected model: local override > project value > auto-select single model
  const effectiveSelectedModel = useMemo(() => {
    if (selectedModelOverride !== null) return selectedModelOverride;
    if (project?.model && project.model.trim() !== "") return project.model;
    if (combinedModels.length === 1) return combinedModels[0].name;
    return "";
  }, [selectedModelOverride, project, combinedModels]);

  // Effective target name: local override > project value
  const effectiveTargetName = useMemo(() => {
    if (targetNameOverride !== null) return targetNameOverride;
    if (project?.target_name && project.target_name.trim() !== "") return project.target_name;
    return "";
  }, [targetNameOverride, project]);

  // Default target name placeholder
  const defaultTargetName = useMemo(() => {
    if (!effectiveSelectedModel || !slug) return "";
    const modelName = effectiveSelectedModel.includes("/")
      ? effectiveSelectedModel.split("/").pop() || effectiveSelectedModel
      : effectiveSelectedModel;
    return `${modelName}-${slug}`;
  }, [effectiveSelectedModel, slug]);

  // Effective configs
  const effectiveTrainingConfig = useMemo((): TrainingConfig => {
    const projectConfig = project?.training_config || {};
    const overrideConfig = trainingConfigOverride || {};
    return { ...projectConfig, ...overrideConfig };
  }, [project, trainingConfigOverride]);

  const effectiveLoraConfig = useMemo((): LoraConfig => {
    const projectConfig = project?.lora_config || {};
    const overrideConfig = loraConfigOverride || {};
    return { ...projectConfig, ...overrideConfig };
  }, [project, loraConfigOverride]);

  const effectiveQuantizationConfig = useMemo((): QuantizationConfig => {
    const projectConfig = project?.quantization_config || {};
    const overrideConfig = quantizationConfigOverride || {};
    return { ...projectConfig, ...overrideConfig };
  }, [project, quantizationConfigOverride]);

  const effectiveModelfileConfig = useMemo((): ModelfileConfig => {
    const projectConfig = project?.modelfile_config || {};
    const overrideConfig = modelfileConfigOverride || {};
    return { ...projectConfig, ...overrideConfig };
  }, [project, modelfileConfigOverride]);

  // Helper to format validation error messages
  const formatValidationError = useCallback(
    (result: ValidationResult): string | undefined => {
      if (result.valid || !result.errorKey) return undefined;
      return t(result.errorKey, result.errorParams);
    },
    [t]
  );

  // Handle model change
  const handleModelChange = useCallback(
    async (value: string) => {
      setSelectedModelOverride(value);
      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: value,
            target_name: effectiveTargetName || null,
          });
        } catch {
          // Silent fail
        }
      }
    },
    [project, slug, effectiveTargetName]
  );

  // Handle target name change
  const handleTargetNameChange = useCallback(
    async (value: string) => {
      setTargetNameOverride(value);
      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: effectiveSelectedModel || null,
            target_name: value || null,
          });
        } catch {
          // Silent fail
        }
      }
    },
    [project, slug, effectiveSelectedModel]
  );

  // Handle training config change
  const handleTrainingConfigChange = useCallback(
    async <K extends keyof TrainingConfig>(key: K, value: TrainingConfig[K]) => {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[`training.${key}`];
        return next;
      });

      const validation = validateTrainingConfig(String(key), value);
      if (!validation.valid) {
        const errorMsg = formatValidationError(validation);
        if (errorMsg) {
          setValidationErrors((prev) => ({ ...prev, [`training.${key}`]: errorMsg }));
        }
        return;
      }

      const newConfig = { ...effectiveTrainingConfig, [key]: value };
      setTrainingConfigOverride(newConfig);

      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: effectiveSelectedModel || null,
            target_name: effectiveTargetName || null,
            training_config: newConfig,
            lora_config: project.lora_config,
            quantization_config: project.quantization_config,
          });
        } catch {
          // Silent fail
        }
      }
    },
    [effectiveTrainingConfig, effectiveSelectedModel, effectiveTargetName, project, slug, formatValidationError]
  );

  // Handle LoRA config change
  const handleLoraConfigChange = useCallback(
    async <K extends keyof LoraConfig>(key: K, value: LoraConfig[K]) => {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[`lora.${key}`];
        return next;
      });

      const validation = validateLoraConfig(String(key), value);
      if (!validation.valid) {
        const errorMsg = formatValidationError(validation);
        if (errorMsg) {
          setValidationErrors((prev) => ({ ...prev, [`lora.${key}`]: errorMsg }));
        }
        return;
      }

      const newConfig = { ...effectiveLoraConfig, [key]: value };
      setLoraConfigOverride(newConfig);

      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: effectiveSelectedModel || null,
            target_name: effectiveTargetName || null,
            training_config: project.training_config,
            lora_config: newConfig,
            quantization_config: project.quantization_config,
          });
        } catch {
          // Silent fail
        }
      }
    },
    [effectiveLoraConfig, effectiveSelectedModel, effectiveTargetName, project, slug, formatValidationError]
  );

  // Handle Quantization config change
  const handleQuantizationConfigChange = useCallback(
    async <K extends keyof QuantizationConfig>(key: K, value: QuantizationConfig[K]) => {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[`quantization.${key}`];
        return next;
      });

      const validation = validateQuantizationConfig(String(key), value);
      if (!validation.valid) {
        const errorMsg = formatValidationError(validation);
        if (errorMsg) {
          setValidationErrors((prev) => ({ ...prev, [`quantization.${key}`]: errorMsg }));
        }
        return;
      }

      const newConfig = { ...effectiveQuantizationConfig, [key]: value };
      setQuantizationConfigOverride(newConfig);

      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: effectiveSelectedModel || null,
            target_name: effectiveTargetName || null,
            training_config: project.training_config,
            lora_config: project.lora_config,
            quantization_config: newConfig,
          });
        } catch {
          // Silent fail
        }
      }
    },
    [effectiveQuantizationConfig, effectiveSelectedModel, effectiveTargetName, project, slug, formatValidationError]
  );

  // Handle Modelfile config change
  const handleModelfileConfigChange = useCallback(
    async <K extends keyof ModelfileConfig>(key: K, value: ModelfileConfig[K]) => {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[`modelfile.${key}`];
        return next;
      });

      const validation = validateModelfileConfig(String(key), value);
      if (!validation.valid) {
        const errorMsg = formatValidationError(validation);
        if (errorMsg) {
          setValidationErrors((prev) => ({ ...prev, [`modelfile.${key}`]: errorMsg }));
        }
        return;
      }

      const newConfig = { ...effectiveModelfileConfig, [key]: value };
      setModelfileConfigOverride(newConfig);

      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: effectiveSelectedModel || null,
            target_name: effectiveTargetName || null,
            training_config: project.training_config,
            lora_config: project.lora_config,
            quantization_config: project.quantization_config,
            modelfile_config: newConfig,
          });
        } catch {
          // Silent fail
        }
      }
    },
    [effectiveModelfileConfig, effectiveSelectedModel, effectiveTargetName, project, slug, formatValidationError]
  );

  // Reset handlers
  const handleResetTrainingConfig = useCallback(async () => {
    setTrainingConfigOverride({});
    setValidationErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith("training.")) delete next[key];
      });
      return next;
    });

    if (project && slug) {
      try {
        await updateProject(slug, {
          name: project.name,
          description: project.description,
          model: effectiveSelectedModel || null,
          target_name: effectiveTargetName || null,
          training_config: {},
          lora_config: project.lora_config,
          quantization_config: project.quantization_config,
        });
      } catch {
        // Silent fail
      }
    }
  }, [effectiveSelectedModel, effectiveTargetName, project, slug]);

  const handleResetLoraConfig = useCallback(async () => {
    setLoraConfigOverride({});
    setValidationErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith("lora.")) delete next[key];
      });
      return next;
    });

    if (project && slug) {
      try {
        await updateProject(slug, {
          name: project.name,
          description: project.description,
          model: effectiveSelectedModel || null,
          target_name: effectiveTargetName || null,
          training_config: project.training_config,
          lora_config: {},
          quantization_config: project.quantization_config,
        });
      } catch {
        // Silent fail
      }
    }
  }, [effectiveSelectedModel, effectiveTargetName, project, slug]);

  const handleResetQuantizationConfig = useCallback(async () => {
    setQuantizationConfigOverride({});
    setValidationErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith("quantization.")) delete next[key];
      });
      return next;
    });

    if (project && slug) {
      try {
        await updateProject(slug, {
          name: project.name,
          description: project.description,
          model: effectiveSelectedModel || null,
          target_name: effectiveTargetName || null,
          training_config: project.training_config,
          lora_config: project.lora_config,
          quantization_config: {},
        });
      } catch {
        // Silent fail
      }
    }
  }, [effectiveSelectedModel, effectiveTargetName, project, slug]);

  const handleResetModelfileConfig = useCallback(async () => {
    setModelfileConfigOverride({});
    setValidationErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith("modelfile.")) delete next[key];
      });
      return next;
    });

    if (project && slug) {
      try {
        await updateProject(slug, {
          name: project.name,
          description: project.description,
          model: effectiveSelectedModel || null,
          target_name: effectiveTargetName || null,
          training_config: project.training_config,
          lora_config: project.lora_config,
          quantization_config: project.quantization_config,
          modelfile_config: {},
        });
      } catch {
        // Silent fail
      }
    }
  }, [effectiveSelectedModel, effectiveTargetName, project, slug]);

  // Apply preset configuration
  const handleApplyPreset = useCallback(
    async (preset: TrainingPreset) => {
      // Build new training config from preset (only non-null values)
      const newTrainingConfig: TrainingConfig = { ...effectiveTrainingConfig };
      if (preset.training_config.num_train_epochs !== null) {
        newTrainingConfig.num_train_epochs = preset.training_config.num_train_epochs;
      }
      if (preset.training_config.per_device_train_batch_size !== null) {
        newTrainingConfig.per_device_train_batch_size = preset.training_config.per_device_train_batch_size;
      }
      if (preset.training_config.gradient_accumulation_steps !== null) {
        newTrainingConfig.gradient_accumulation_steps = preset.training_config.gradient_accumulation_steps;
      }
      if (preset.training_config.learning_rate !== null) {
        newTrainingConfig.learning_rate = preset.training_config.learning_rate;
      }
      if (preset.training_config.warmup_ratio !== null) {
        newTrainingConfig.warmup_ratio = preset.training_config.warmup_ratio;
      }
      if (preset.training_config.max_length !== null) {
        newTrainingConfig.max_length = preset.training_config.max_length;
      }
      if (preset.training_config.weight_decay !== null) {
        newTrainingConfig.weight_decay = preset.training_config.weight_decay;
      }
      if (preset.training_config.max_grad_norm !== null) {
        newTrainingConfig.max_grad_norm = preset.training_config.max_grad_norm;
      }
      if (preset.training_config.lr_scheduler_type !== null) {
        newTrainingConfig.lr_scheduler_type = preset.training_config.lr_scheduler_type;
      }
      if (preset.training_config.neftune_noise_alpha !== null) {
        newTrainingConfig.neftune_noise_alpha = preset.training_config.neftune_noise_alpha;
      }

      // Build new LoRA config from preset (only non-null values)
      const newLoraConfig: LoraConfig = { ...effectiveLoraConfig };
      if (preset.lora_config.r !== null) {
        newLoraConfig.r = preset.lora_config.r;
      }
      if (preset.lora_config.lora_alpha !== null) {
        newLoraConfig.lora_alpha = preset.lora_config.lora_alpha;
      }
      if (preset.lora_config.lora_dropout !== null) {
        newLoraConfig.lora_dropout = preset.lora_config.lora_dropout;
      }
      if (preset.lora_config.target_modules !== null) {
        newLoraConfig.target_modules = preset.lora_config.target_modules;
      }
      if (preset.lora_config.bias !== null) {
        newLoraConfig.bias = preset.lora_config.bias;
      }
      if (preset.lora_config.use_rslora !== null) {
        newLoraConfig.use_rslora = preset.lora_config.use_rslora;
      }
      if (preset.lora_config.use_dora !== null) {
        newLoraConfig.use_dora = preset.lora_config.use_dora;
      }
      if (preset.lora_config.modules_to_save !== null) {
        newLoraConfig.modules_to_save = preset.lora_config.modules_to_save;
      }

      // Build new quantization config from preset (only non-null values)
      const newQuantizationConfig: QuantizationConfig = { ...effectiveQuantizationConfig };
      if (preset.quantization_config.load_in_4bit !== null) {
        newQuantizationConfig.load_in_4bit = preset.quantization_config.load_in_4bit;
      }
      if (preset.quantization_config.bnb_4bit_quant_type !== null) {
        newQuantizationConfig.bnb_4bit_quant_type = preset.quantization_config.bnb_4bit_quant_type;
      }
      if (preset.quantization_config.bnb_4bit_use_double_quant !== null) {
        newQuantizationConfig.bnb_4bit_use_double_quant = preset.quantization_config.bnb_4bit_use_double_quant;
      }
      if (preset.quantization_config.output_quantization !== null) {
        newQuantizationConfig.output_quantization = preset.quantization_config.output_quantization;
      }

      // Update local state
      setTrainingConfigOverride(newTrainingConfig);
      setLoraConfigOverride(newLoraConfig);
      setQuantizationConfigOverride(newQuantizationConfig);

      // Clear validation errors
      setValidationErrors({});

      // Persist to project
      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: effectiveSelectedModel || null,
            target_name: effectiveTargetName || null,
            training_config: newTrainingConfig,
            lora_config: newLoraConfig,
            quantization_config: newQuantizationConfig,
            modelfile_config: project.modelfile_config,
          });
        } catch {
          // Silent fail
        }
      }
    },
    [
      effectiveTrainingConfig,
      effectiveLoraConfig,
      effectiveQuantizationConfig,
      effectiveSelectedModel,
      effectiveTargetName,
      project,
      slug,
    ]
  );

  return {
    // Model selection
    combinedModels,
    effectiveSelectedModel,
    handleModelChange,

    // Target name
    effectiveTargetName,
    defaultTargetName,
    handleTargetNameChange,

    // Training config
    effectiveTrainingConfig,
    handleTrainingConfigChange,
    handleResetTrainingConfig,

    // LoRA config
    effectiveLoraConfig,
    handleLoraConfigChange,
    handleResetLoraConfig,

    // Quantization config
    effectiveQuantizationConfig,
    handleQuantizationConfigChange,
    handleResetQuantizationConfig,

    // Modelfile config
    effectiveModelfileConfig,
    handleModelfileConfigChange,
    handleResetModelfileConfig,

    // Validation
    validationErrors,

    // UI state
    docLinks,
    isHelpPanelOpen,
    setIsHelpPanelOpen,
    isPresetsOpen,
    setIsPresetsOpen,
    isTrainingParamsOpen,
    setIsTrainingParamsOpen,
    isLoraParamsOpen,
    setIsLoraParamsOpen,
    isQuantizationParamsOpen,
    setIsQuantizationParamsOpen,
    isModelfileParamsOpen,
    setIsModelfileParamsOpen,

    // Presets
    handleApplyPreset,
  };
}
