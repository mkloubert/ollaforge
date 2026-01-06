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

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from config import get_config
from error_codes import ErrorCode
from models.model import ModelInfo

router = APIRouter(prefix="/api/models", tags=["models"])

DEFAULT_MODEL = {"name": "TinyLlama/TinyLlama-1.1B-Chat-v1.0"}


def get_models_file_path() -> Path:
    """Get the path to the models.jsonl file."""
    config = get_config()
    return config.ollaforge_dir / "models.jsonl"


def ensure_models_file_exists() -> Path:
    """
    Ensure the models.jsonl file exists.
    Creates it with default content if it doesn't exist.
    Returns the path to the file.
    """
    models_file = get_models_file_path()

    if not models_file.exists():
        # Ensure parent directory exists
        models_file.parent.mkdir(parents=True, exist_ok=True)

        # Create file with default model
        with open(models_file, "w", encoding="utf-8") as f:
            f.write(json.dumps(DEFAULT_MODEL, ensure_ascii=False) + "\n")

    return models_file


def read_models_from_file(models_file: Path) -> list[ModelInfo]:
    """
    Read models from the JSONL file.
    Returns a list of ModelInfo objects sorted alphabetically by name (case-insensitive).
    """
    models: list[ModelInfo] = []

    with open(models_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            try:
                data = json.loads(line)
                if isinstance(data, dict) and "name" in data and isinstance(data["name"], str):
                    name = data["name"].strip()
                    if name:
                        models.append(ModelInfo(name=name))
            except json.JSONDecodeError:
                # Skip invalid lines
                continue

    # Sort alphabetically by name (case-insensitive)
    models.sort(key=lambda m: m.name.lower())

    return models


@router.get(
    "",
    response_model=list[ModelInfo],
    summary="List all available models",
    description="Returns a list of all configured models sorted alphabetically by name.",
)
async def list_models() -> list[ModelInfo]:
    """Get all models from the models.jsonl file."""
    try:
        models_file = ensure_models_file_exists()
        return read_models_from_file(models_file)
    except IOError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.MODELS_FILE_READ_ERROR},
        )
