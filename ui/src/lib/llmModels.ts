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
 * LLM model configuration - mirrors backend configuration.
 */

export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  supportsStructured: boolean;
  isDefault: boolean;
}

export type LLMProviderType = "openai" | "anthropic" | "mistral";

// =============================================================================
// OpenAI Models
// =============================================================================

const OPENAI_MODELS: LLMModel[] = [
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    contextWindow: 1000000,
    maxOutput: 32768,
    supportsStructured: true,
    isDefault: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    contextWindow: 128000,
    maxOutput: 16384,
    supportsStructured: true,
    isDefault: false,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    contextWindow: 128000,
    maxOutput: 16384,
    supportsStructured: true,
    isDefault: false,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    contextWindow: 1000000,
    maxOutput: 32768,
    supportsStructured: true,
    isDefault: false,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    contextWindow: 1000000,
    maxOutput: 32768,
    supportsStructured: true,
    isDefault: false,
  },
];

// =============================================================================
// Anthropic Models
// =============================================================================

const ANTHROPIC_MODELS: LLMModel[] = [
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    contextWindow: 200000,
    maxOutput: 4096,
    supportsStructured: true,
    isDefault: true,
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    contextWindow: 200000,
    maxOutput: 64000,
    supportsStructured: true,
    isDefault: false,
  },
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    contextWindow: 200000,
    maxOutput: 64000,
    supportsStructured: true,
    isDefault: false,
  },
  {
    id: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    contextWindow: 200000,
    maxOutput: 64000,
    supportsStructured: true,
    isDefault: false,
  },
];

// =============================================================================
// Mistral Models
// =============================================================================

const MISTRAL_MODELS: LLMModel[] = [
  {
    id: "mistral-small-latest",
    name: "Mistral Small",
    contextWindow: 128000,
    maxOutput: 4096,
    supportsStructured: true,
    isDefault: true,
  },
  {
    id: "mistral-medium-latest",
    name: "Mistral Medium",
    contextWindow: 128000,
    maxOutput: 4096,
    supportsStructured: true,
    isDefault: false,
  },
  {
    id: "mistral-large-latest",
    name: "Mistral Large",
    contextWindow: 128000,
    maxOutput: 4096,
    supportsStructured: true,
    isDefault: false,
  },
  {
    id: "ministral-8b-latest",
    name: "Ministral 8B",
    contextWindow: 128000,
    maxOutput: 4096,
    supportsStructured: true,
    isDefault: false,
  },
  {
    id: "ministral-3b-latest",
    name: "Ministral 3B",
    contextWindow: 128000,
    maxOutput: 4096,
    supportsStructured: true,
    isDefault: false,
  },
];

// =============================================================================
// Model Registry
// =============================================================================

const MODELS_BY_PROVIDER: Record<LLMProviderType, LLMModel[]> = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  mistral: MISTRAL_MODELS,
};

// Default fallback values
export const DEFAULT_CONTEXT_WINDOW = 128000;
export const DEFAULT_MAX_OUTPUT = 4096;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get all models for a specific provider.
 */
export function getModelsForProvider(provider: LLMProviderType): LLMModel[] {
  return MODELS_BY_PROVIDER[provider] ?? [];
}

/**
 * Get the default model for a specific provider.
 */
export function getDefaultModel(provider: LLMProviderType): LLMModel | null {
  const models = getModelsForProvider(provider);
  const defaultModel = models.find((m) => m.isDefault);
  return defaultModel ?? models[0] ?? null;
}

/**
 * Get a specific model by its ID for a provider.
 */
export function getModelById(
  provider: LLMProviderType,
  modelId: string
): LLMModel | null {
  const models = getModelsForProvider(provider);
  return models.find((m) => m.id === modelId) ?? null;
}

/**
 * Get all available provider types.
 */
export function getAllProviderTypes(): LLMProviderType[] {
  return ["openai", "anthropic", "mistral"];
}
