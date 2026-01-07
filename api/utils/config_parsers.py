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

"""Configuration parsing utilities for project data."""

import json
from pathlib import Path

from models.project import (
    ModelfileConfig,
    ProjectLoraConfig,
    QuantizationConfig,
    TrainingConfig,
)


def parse_training_config(data: dict) -> TrainingConfig | None:
    """Parse training configuration from project.json data."""
    config_data = data.get("trainingConfig")
    if not config_data or not isinstance(config_data, dict):
        return None
    try:
        return TrainingConfig(**config_data)
    except (TypeError, ValueError):
        return None


def parse_lora_config(data: dict) -> ProjectLoraConfig | None:
    """Parse LoRA configuration from project.json data."""
    config_data = data.get("loraConfig")
    if not config_data or not isinstance(config_data, dict):
        return None
    try:
        return ProjectLoraConfig(**config_data)
    except (TypeError, ValueError):
        return None


def parse_quantization_config(data: dict) -> QuantizationConfig | None:
    """Parse quantization configuration from project.json data."""
    config_data = data.get("quantizationConfig")
    if not config_data or not isinstance(config_data, dict):
        return None
    try:
        return QuantizationConfig(**config_data)
    except (TypeError, ValueError):
        return None


def parse_modelfile_config(data: dict) -> ModelfileConfig | None:
    """Parse Ollama Modelfile configuration from project.json data."""
    config_data = data.get("modelfileConfig")
    if not config_data or not isinstance(config_data, dict):
        return None
    try:
        return ModelfileConfig(**config_data)
    except (TypeError, ValueError):
        return None


def load_project_configs(
    project_dir: Path,
) -> tuple[TrainingConfig | None, ProjectLoraConfig | None, QuantizationConfig | None, ModelfileConfig | None]:
    """
    Load all training configurations from a project's project.json file.

    Returns a tuple of (training_config, lora_config, quantization_config, modelfile_config).
    Any config that doesn't exist or is invalid will be None.
    """
    project_file = project_dir / "project.json"

    if not project_file.exists():
        return None, None, None, None

    try:
        with open(project_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        return None, None, None, None

    return (
        parse_training_config(data),
        parse_lora_config(data),
        parse_quantization_config(data),
        parse_modelfile_config(data),
    )
