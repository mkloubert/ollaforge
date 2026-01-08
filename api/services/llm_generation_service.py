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

"""Service for generating training data using LLM providers."""

import json
import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass

from models.llm_provider import LLMProviderType

logger = logging.getLogger(__name__)

# System prompt for all providers
SYSTEM_PROMPT = """You are a training data generator. Your task is to extract information EXACTLY as written in the provided text and create question-answer pairs.

CRITICAL: You must NEVER correct, modify, or "fix" any information from the source text. Extract everything exactly as it appears, because:
- Names like "Bill Gates" might refer to a completely different person in another context that you don't know about
- People, places, buildings, organizations, or brands could be from fictional contexts like stories, novels, games, or alternate universes
- Historical events or scientific facts may be presented in a specific interpretive context that differs from your training data
- The source may contain intentional creative variations, alternative spellings, or domain-specific terminology
- Your knowledge may be outdated or incomplete for the specific domain of this text

Rules:
- Extract information EXACTLY as stated - never correct spelling, names, dates, facts, or any other details
- Do not add any external knowledge or context
- Do not "fix" what appears to be errors - they may be intentional or contextually correct
- Create diverse questions about the content
- Keep answers concise but complete, using the exact wording from the source when possible
- Output in the same language as the source text
- Generate as many question-answer pairs as possible from the content
- Each pair should focus on a specific piece of information"""


@dataclass
class TrainingDataItem:
    """A single training data item with instruction and output."""

    instruction: str
    output: str


class LLMGenerator(ABC):
    """Abstract base class for LLM generators."""

    @abstractmethod
    async def generate(
        self, content: str, model_id: str
    ) -> list[TrainingDataItem]:
        """
        Generate training data from content using the specified model.

        Args:
            content: The source text to generate training data from.
            model_id: The model ID to use for generation.

        Returns:
            List of TrainingDataItem objects.
        """
        pass


class OpenAIGenerator(LLMGenerator):
    """Generator using OpenAI's API with Structured Outputs."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def generate(
        self, content: str, model_id: str
    ) -> list[TrainingDataItem]:
        """Generate training data using OpenAI's Structured Outputs."""
        try:
            from openai import AsyncOpenAI
        except ImportError:
            logger.error("openai package not installed")
            raise RuntimeError("OpenAI package not installed")

        client = AsyncOpenAI(api_key=self.api_key)

        # JSON Schema for structured output
        json_schema = {
            "name": "training_data",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "instruction": {
                                    "type": "string",
                                    "description": "A question or instruction about the content",
                                },
                                "output": {
                                    "type": "string",
                                    "description": "The answer or response to the instruction",
                                },
                            },
                            "required": ["instruction", "output"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["items"],
                "additionalProperties": False,
            },
        }

        try:
            response = await client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Generate training data from the following text:\n\n{content}",
                    },
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": json_schema,
                },
            )

            result_text = response.choices[0].message.content
            if not result_text:
                logger.warning("OpenAI returned empty response")
                return []

            result = json.loads(result_text)
            items = result.get("items", [])

            return [
                TrainingDataItem(
                    instruction=item["instruction"],
                    output=item["output"],
                )
                for item in items
                if item.get("instruction") and item.get("output")
            ]

        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise


class AnthropicGenerator(LLMGenerator):
    """Generator using Anthropic's API with Tool Use."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def generate(
        self, content: str, model_id: str
    ) -> list[TrainingDataItem]:
        """Generate training data using Anthropic's Tool Use."""
        try:
            from anthropic import AsyncAnthropic
        except ImportError:
            logger.error("anthropic package not installed")
            raise RuntimeError("Anthropic package not installed")

        client = AsyncAnthropic(api_key=self.api_key)

        # Tool definition for training data extraction
        tools = [
            {
                "name": "extract_training_data",
                "description": "Extract question-answer pairs from the provided text to create training data.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "items": {
                            "type": "array",
                            "description": "List of question-answer pairs",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "instruction": {
                                        "type": "string",
                                        "description": "A question or instruction about the content",
                                    },
                                    "output": {
                                        "type": "string",
                                        "description": "The answer or response to the instruction",
                                    },
                                },
                                "required": ["instruction", "output"],
                            },
                        },
                    },
                    "required": ["items"],
                },
            }
        ]

        try:
            response = await client.messages.create(
                model=model_id,
                max_tokens=8000,
                system=SYSTEM_PROMPT,
                tools=tools,
                tool_choice={"type": "tool", "name": "extract_training_data"},
                messages=[
                    {
                        "role": "user",
                        "content": f"Generate training data from the following text:\n\n{content}",
                    },
                ],
            )

            # Extract tool use from response
            for block in response.content:
                if block.type == "tool_use" and block.name == "extract_training_data":
                    items = block.input.get("items", [])
                    return [
                        TrainingDataItem(
                            instruction=item["instruction"],
                            output=item["output"],
                        )
                        for item in items
                        if item.get("instruction") and item.get("output")
                    ]

            logger.warning("Anthropic did not return tool use response")
            return []

        except Exception as e:
            logger.error(f"Anthropic generation failed: {e}")
            raise


class MistralGenerator(LLMGenerator):
    """Generator using Mistral's API with JSON Mode."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def generate(
        self, content: str, model_id: str
    ) -> list[TrainingDataItem]:
        """Generate training data using Mistral's JSON Mode."""
        try:
            from mistralai import Mistral
        except ImportError:
            logger.error("mistralai package not installed")
            raise RuntimeError("Mistral package not installed")

        client = Mistral(api_key=self.api_key)

        # Enhanced system prompt with JSON schema for Mistral
        mistral_system_prompt = f"""{SYSTEM_PROMPT}

You MUST respond with a valid JSON object in the following format:
{{
    "items": [
        {{
            "instruction": "A question about the content",
            "output": "The answer to the question"
        }}
    ]
}}

Generate as many question-answer pairs as you can extract from the text."""

        try:
            response = await client.chat.complete_async(
                model=model_id,
                messages=[
                    {"role": "system", "content": mistral_system_prompt},
                    {
                        "role": "user",
                        "content": f"Generate training data from the following text:\n\n{content}",
                    },
                ],
                response_format={"type": "json_object"},
            )

            result_text = response.choices[0].message.content
            if not result_text:
                logger.warning("Mistral returned empty response")
                return []

            result = json.loads(result_text)
            items = result.get("items", [])

            return [
                TrainingDataItem(
                    instruction=item["instruction"],
                    output=item["output"],
                )
                for item in items
                if item.get("instruction") and item.get("output")
            ]

        except Exception as e:
            logger.error(f"Mistral generation failed: {e}")
            raise


def get_generator(provider: LLMProviderType | str) -> LLMGenerator:
    """
    Factory function to get the appropriate generator for a provider.

    Args:
        provider: The LLM provider type.

    Returns:
        An LLMGenerator instance.

    Raises:
        ValueError: If the provider is unknown or not configured.
    """
    if isinstance(provider, str):
        try:
            provider = LLMProviderType(provider)
        except ValueError:
            raise ValueError(f"Unknown provider: {provider}")

    # Get API key from environment
    env_vars = {
        LLMProviderType.OPENAI: "OPENAI_API_KEY",
        LLMProviderType.ANTHROPIC: "ANTHROPIC_API_KEY",
        LLMProviderType.MISTRAL: "MISTRAL_API_KEY",
    }

    env_var = env_vars.get(provider)
    if not env_var:
        raise ValueError(f"Unknown provider: {provider}")

    api_key = os.environ.get(env_var)
    if not api_key:
        raise ValueError(f"API key not configured for {provider.value}")

    generators = {
        LLMProviderType.OPENAI: OpenAIGenerator,
        LLMProviderType.ANTHROPIC: AnthropicGenerator,
        LLMProviderType.MISTRAL: MistralGenerator,
    }

    generator_class = generators.get(provider)
    if not generator_class:
        raise ValueError(f"No generator available for {provider.value}")

    return generator_class(api_key)
