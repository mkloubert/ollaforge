# OllaForge - A web application that simplifies training LLMs with your own data for use in Ollama.
# Copyright (C) 2026  Marcel Joachim Kloubert (marcel@kloubert.dev)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

"""LLM model configurations with token limits and pricing information."""

from dataclasses import dataclass

from models.llm_provider import LLMProviderType


@dataclass
class LLMModel:
    """Configuration for an LLM model."""

    id: str  # API Model-ID
    name: str  # Display name
    context_window: int  # Max input tokens
    max_output: int  # Max output tokens
    supports_structured: bool  # Supports structured output
    is_default: bool  # Is default model for provider


# =============================================================================
# OpenAI Models
# =============================================================================

OPENAI_MODELS: list[LLMModel] = [
    LLMModel(
        id="gpt-4.1-nano",
        name="GPT-4.1 Nano",
        context_window=1000000,
        max_output=32768,
        supports_structured=True,
        is_default=True,
    ),
    LLMModel(
        id="gpt-4o-mini",
        name="GPT-4o Mini",
        context_window=128000,
        max_output=16384,
        supports_structured=True,
        is_default=False,
    ),
    LLMModel(
        id="gpt-4o",
        name="GPT-4o",
        context_window=128000,
        max_output=16384,
        supports_structured=True,
        is_default=False,
    ),
    LLMModel(
        id="gpt-4.1-mini",
        name="GPT-4.1 Mini",
        context_window=1000000,
        max_output=32768,
        supports_structured=True,
        is_default=False,
    ),
    LLMModel(
        id="gpt-4.1",
        name="GPT-4.1",
        context_window=1000000,
        max_output=32768,
        supports_structured=True,
        is_default=False,
    ),
]

# =============================================================================
# Anthropic Models
# =============================================================================

ANTHROPIC_MODELS: list[LLMModel] = [
    LLMModel(
        id="claude-3-haiku-20240307",
        name="Claude 3 Haiku",
        context_window=200000,
        max_output=4096,
        supports_structured=True,
        is_default=True,
    ),
    LLMModel(
        id="claude-haiku-4-5-20251001",
        name="Claude Haiku 4.5",
        context_window=200000,
        max_output=64000,
        supports_structured=True,
        is_default=False,
    ),
    LLMModel(
        id="claude-sonnet-4-5-20250929",
        name="Claude Sonnet 4.5",
        context_window=200000,
        max_output=64000,
        supports_structured=True,
        is_default=False,
    ),
    LLMModel(
        id="claude-opus-4-5-20251101",
        name="Claude Opus 4.5",
        context_window=200000,
        max_output=64000,
        supports_structured=True,
        is_default=False,
    ),
]

# =============================================================================
# Mistral Models
# =============================================================================

MISTRAL_MODELS: list[LLMModel] = [
    LLMModel(
        id="mistral-small-latest",
        name="Mistral Small",
        context_window=128000,
        max_output=4096,
        supports_structured=True,
        is_default=True,
    ),
    LLMModel(
        id="mistral-medium-latest",
        name="Mistral Medium",
        context_window=128000,
        max_output=4096,
        supports_structured=True,
        is_default=False,
    ),
    LLMModel(
        id="mistral-large-latest",
        name="Mistral Large",
        context_window=128000,
        max_output=4096,
        supports_structured=True,
        is_default=False,
    ),
    LLMModel(
        id="ministral-8b-latest",
        name="Ministral 8B",
        context_window=128000,
        max_output=4096,
        supports_structured=True,
        is_default=False,
    ),
    LLMModel(
        id="ministral-3b-latest",
        name="Ministral 3B",
        context_window=128000,
        max_output=4096,
        supports_structured=True,
        is_default=False,
    ),
]

# =============================================================================
# Model Registry
# =============================================================================

MODELS_BY_PROVIDER: dict[LLMProviderType, list[LLMModel]] = {
    LLMProviderType.OPENAI: OPENAI_MODELS,
    LLMProviderType.ANTHROPIC: ANTHROPIC_MODELS,
    LLMProviderType.MISTRAL: MISTRAL_MODELS,
}

# Default fallback values
DEFAULT_CONTEXT_WINDOW = 128000
DEFAULT_MAX_OUTPUT = 4096


# =============================================================================
# Helper Functions
# =============================================================================


def get_models_for_provider(provider: LLMProviderType | str) -> list[LLMModel]:
    """Get all models for a specific provider.

    Args:
        provider: The LLM provider type or string identifier.

    Returns:
        List of LLMModel objects for the provider.
    """
    if isinstance(provider, str):
        try:
            provider = LLMProviderType(provider)
        except ValueError:
            return []

    return MODELS_BY_PROVIDER.get(provider, [])


def get_default_model(provider: LLMProviderType | str) -> LLMModel | None:
    """Get the default model for a specific provider.

    Args:
        provider: The LLM provider type or string identifier.

    Returns:
        The default LLMModel for the provider, or None if not found.
    """
    models = get_models_for_provider(provider)
    for model in models:
        if model.is_default:
            return model

    # Return first model if no default is set
    return models[0] if models else None


def get_model_by_id(
    provider: LLMProviderType | str, model_id: str
) -> LLMModel | None:
    """Get a specific model by its ID for a provider.

    Args:
        provider: The LLM provider type or string identifier.
        model_id: The model ID to look up.

    Returns:
        The LLMModel if found, or None otherwise.
    """
    models = get_models_for_provider(provider)
    for model in models:
        if model.id == model_id:
            return model
    return None


def get_all_models() -> dict[LLMProviderType, list[LLMModel]]:
    """Get all models grouped by provider.

    Returns:
        Dictionary mapping provider types to their model lists.
    """
    return MODELS_BY_PROVIDER.copy()
