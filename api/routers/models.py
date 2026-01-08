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

from fastapi import APIRouter

from models.model import ModelInfo

router = APIRouter(prefix="/api/models", tags=["models"])

# Supported instruct models for fine-tuning (sorted alphabetically by name, case-insensitive)
# All models are instruction-tuned for chat compatibility after training
# This list is static and will be extended in future updates
SUPPORTED_MODELS: list[ModelInfo] = sorted(
    [
        ModelInfo(name="bigscience/bloomz-560m"),  # 560M, RAIL, Multilingual (46 languages)
        ModelInfo(name="HuggingFaceTB/SmolLM2-1.7B-Instruct"),  # 1.7B, Apache 2.0, Edge/mobile
        ModelInfo(name="microsoft/Phi-3-mini-4k-instruct"),  # 3.8B, MIT, Reasoning
        ModelInfo(name="mistralai/Mistral-7B-Instruct-v0.3"),  # 7B, Apache 2.0, General-purpose
        ModelInfo(name="mistralai/Mixtral-8x7B-Instruct-v0.1"),  # 46.7B (12.9B active), Apache 2.0, MoE
        ModelInfo(name="Qwen/Qwen2.5-14B-Instruct"),  # 14B, Apache 2.0, Complex tasks
        ModelInfo(name="Qwen/Qwen2.5-3B-Instruct"),  # 3B, Apache 2.0, Balanced
        ModelInfo(name="Qwen/Qwen2.5-7B-Instruct"),  # 7B, Apache 2.0, Multilingual
        ModelInfo(name="tiiuae/falcon-7b-instruct"),  # 7B, Apache 2.0, Chat/QA
        ModelInfo(name="TinyLlama/TinyLlama-1.1B-Chat-v1.0"),  # 1.1B, Apache 2.0, Ultra-lightweight
    ],
    key=lambda m: m.name.lower(),
)


@router.get(
    "",
    response_model=list[ModelInfo],
    summary="List all supported models",
    description="Returns a list of all supported base models for fine-tuning, sorted alphabetically by name.",
)
async def list_models() -> list[ModelInfo]:
    """Get all supported models."""
    return SUPPORTED_MODELS
