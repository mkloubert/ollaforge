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

/**
 * Validation rules matching backend Pydantic Field() constraints.
 * See /workspace/api/models/project.py for source of truth.
 */

export interface ValidationRule {
  type: "int" | "float" | "string" | "boolean" | "array";
  min?: number;
  max?: number;
  minExclusive?: boolean; // gt instead of ge
  maxLength?: number;
  required?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errorKey?: string; // i18n key for error message
  errorParams?: Record<string, string | number>; // parameters for interpolation
}

// Training Config validation rules (from TrainingConfig in project.py)
export const TRAINING_CONFIG_RULES: Record<string, ValidationRule> = {
  num_train_epochs: { type: "int", min: 1, max: 10 },
  per_device_train_batch_size: { type: "int", min: 1, max: 16 },
  gradient_accumulation_steps: { type: "int", min: 1, max: 32 },
  learning_rate: { type: "float", min: 0, minExclusive: true, max: 1 },
  warmup_ratio: { type: "float", min: 0, max: 1 },
  max_length: { type: "int", min: 128, max: 8192 },
  fp16: { type: "boolean" },
  optim: { type: "string", maxLength: 50 },
  weight_decay: { type: "float", min: 0, max: 0.2 },
  max_grad_norm: { type: "float", min: 0.1, max: 2.0 },
  lr_scheduler_type: { type: "string", maxLength: 30 },
  neftune_noise_alpha: { type: "float", min: 0, max: 20 },
  seed: { type: "int", min: 0 },
  bf16: { type: "boolean" },
  logging_steps: { type: "int", min: 1, max: 1000 },
  save_strategy: { type: "string", maxLength: 10 },
};

// LoRA Config validation rules (from ProjectLoraConfig in project.py)
export const LORA_CONFIG_RULES: Record<string, ValidationRule> = {
  r: { type: "int", min: 4, max: 256 },
  lora_alpha: { type: "int", min: 8, max: 512 },
  lora_dropout: { type: "float", min: 0, max: 0.5 },
  target_modules: { type: "array" },
  bias: { type: "string", maxLength: 10 },
  use_rslora: { type: "boolean" },
  use_dora: { type: "boolean" },
  modules_to_save: { type: "array" },
};

// Quantization Config validation rules (from QuantizationConfig in project.py)
export const QUANTIZATION_CONFIG_RULES: Record<string, ValidationRule> = {
  load_in_4bit: { type: "boolean" },
  bnb_4bit_quant_type: { type: "string", maxLength: 10 },
  bnb_4bit_use_double_quant: { type: "boolean" },
  bnb_4bit_compute_dtype: { type: "string", maxLength: 10 },
  output_quantization: { type: "string", maxLength: 10 },
};

// Modelfile Config validation rules (from ModelfileConfig in project.py)
export const MODELFILE_CONFIG_RULES: Record<string, ValidationRule> = {
  temperature: { type: "float", min: 0, max: 2 },
  top_p: { type: "float", min: 0, max: 1 },
  top_k: { type: "int", min: 1, max: 100 },
  stop: { type: "array" },
  system: { type: "string", maxLength: 2000 },
  repeat_penalty: { type: "float", min: 1, max: 2 },
  repeat_last_n: { type: "int", min: 0, max: 512 },
  num_ctx: { type: "int" },
};

/**
 * Validate a single value against a rule.
 */
function validateValue(
  value: unknown,
  rule: ValidationRule,
  fieldName: string
): ValidationResult {
  // null/undefined values are always valid (optional fields)
  if (value === null || value === undefined) {
    return { valid: true };
  }

  // Type validation
  if (rule.type === "int") {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return {
        valid: false,
        errorKey: "validation.mustBeInteger",
        errorParams: { field: fieldName },
      };
    }
  } else if (rule.type === "float") {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return {
        valid: false,
        errorKey: "validation.mustBeNumber",
        errorParams: { field: fieldName },
      };
    }
  } else if (rule.type === "string") {
    if (typeof value !== "string") {
      return {
        valid: false,
        errorKey: "validation.mustBeString",
        errorParams: { field: fieldName },
      };
    }
  } else if (rule.type === "boolean") {
    if (typeof value !== "boolean") {
      return {
        valid: false,
        errorKey: "validation.mustBeBoolean",
        errorParams: { field: fieldName },
      };
    }
  } else if (rule.type === "array") {
    if (!Array.isArray(value)) {
      return {
        valid: false,
        errorKey: "validation.mustBeArray",
        errorParams: { field: fieldName },
      };
    }
  }

  // Range validation for numbers
  if (rule.type === "int" || rule.type === "float") {
    const numValue = value as number;

    if (rule.min !== undefined) {
      if (rule.minExclusive) {
        if (numValue <= rule.min) {
          return {
            valid: false,
            errorKey: "validation.mustBeGreaterThan",
            errorParams: { field: fieldName, min: rule.min },
          };
        }
      } else {
        if (numValue < rule.min) {
          return {
            valid: false,
            errorKey: "validation.mustBeAtLeast",
            errorParams: { field: fieldName, min: rule.min },
          };
        }
      }
    }

    if (rule.max !== undefined && numValue > rule.max) {
      return {
        valid: false,
        errorKey: "validation.mustBeAtMost",
        errorParams: { field: fieldName, max: rule.max },
      };
    }
  }

  // Length validation for strings
  if (rule.type === "string" && rule.maxLength !== undefined) {
    const strValue = value as string;
    if (strValue.length > rule.maxLength) {
      return {
        valid: false,
        errorKey: "validation.maxLength",
        errorParams: { field: fieldName, maxLength: rule.maxLength },
      };
    }
  }

  return { valid: true };
}

/**
 * Validate a training config field.
 */
export function validateTrainingConfig(
  key: string,
  value: unknown
): ValidationResult {
  const rule = TRAINING_CONFIG_RULES[key];
  if (!rule) {
    return { valid: true }; // Unknown fields pass through
  }
  return validateValue(value, rule, key);
}

/**
 * Validate a LoRA config field.
 */
export function validateLoraConfig(
  key: string,
  value: unknown
): ValidationResult {
  const rule = LORA_CONFIG_RULES[key];
  if (!rule) {
    return { valid: true };
  }
  return validateValue(value, rule, key);
}

/**
 * Validate a quantization config field.
 */
export function validateQuantizationConfig(
  key: string,
  value: unknown
): ValidationResult {
  const rule = QUANTIZATION_CONFIG_RULES[key];
  if (!rule) {
    return { valid: true };
  }
  return validateValue(value, rule, key);
}

/**
 * Validate a modelfile config field.
 */
export function validateModelfileConfig(
  key: string,
  value: unknown
): ValidationResult {
  const rule = MODELFILE_CONFIG_RULES[key];
  if (!rule) {
    return { valid: true };
  }
  return validateValue(value, rule, key);
}

/**
 * Safe parse float - returns null instead of NaN for invalid input.
 */
export function safeParseFloat(value: string): number | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Safe parse int - returns null instead of NaN for invalid input.
 */
export function safeParseInt(value: string): number | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}
