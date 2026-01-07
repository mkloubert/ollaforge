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
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from error_codes import ErrorCode
from models.ollama import (
    OllamaCreateRequest,
    OllamaCreateResponse,
    OllamaModelExistsResponse,
    OllamaModelsResponse,
    OllamaRunResponse,
)
from services.ollama_service import OllamaServiceError, ollama_service
from utils.project_utils import validate_project_exists

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ollama"])


def get_target_name_for_project(project_dir: Path, override: str | None = None) -> str:
    """Get the target model name for a project.

    Priority:
    1. If override is provided, use it
    2. If targetName is set in project.json, use it
    3. Construct from base model name: <model-without-owner>-<project-slug>
    4. If no model is configured, raise an error
    """
    if override and override.strip():
        return override.strip()

    # Read from project.json
    project_file = project_dir / "project.json"
    try:
        with open(project_file) as f:
            project_data = json.load(f)

            # Note: project.json uses camelCase "targetName"
            target_name = project_data.get("targetName", "").strip()
            if target_name:
                return target_name

            # Construct from base model name and slug
            model = project_data.get("model", "").strip()
            slug = project_dir.name

            if not model:
                # No model configured - cannot determine target name
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"error_code": ErrorCode.OLLAMA_MODEL_NOT_CONFIGURED},
                )

            # Extract model name without owner (e.g., "unsloth/Llama-3.2-1B" -> "Llama-3.2-1B")
            model_name = model.split("/")[-1] if "/" in model else model
            return f"{model_name}-{slug}"

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading project file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.PROJECT_NOT_FOUND},
        )


def find_latest_modelfile(project_dir: Path) -> Path | None:
    """Find the latest Modelfile in the project's output directory."""
    output_dir = project_dir / "output"

    if not output_dir.exists():
        return None

    # Look for output/ollama/Modelfile first (standard location)
    standard_modelfile = output_dir / "ollama" / "Modelfile"
    if standard_modelfile.exists():
        return standard_modelfile

    # Search in run directories (output/run_*/ollama/Modelfile)
    run_dirs = sorted(output_dir.glob("run_*/ollama/Modelfile"), reverse=True)
    if run_dirs:
        return run_dirs[0]

    return None


@router.get(
    "/ollama/models",
    response_model=OllamaModelsResponse,
    summary="List Ollama models",
    description="Get a list of all models currently available in Ollama.",
)
async def list_ollama_models() -> OllamaModelsResponse:
    """List all models in Ollama."""
    try:
        models = await ollama_service.list_models()
        return OllamaModelsResponse(models=models)
    except OllamaServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error_code": e.error_code},
        )


@router.get(
    "/projects/{slug}/ollama/exists",
    response_model=OllamaModelExistsResponse,
    summary="Check if model exists in Ollama",
    description="Check if the project's target model already exists in Ollama.",
)
async def check_model_exists(slug: str) -> OllamaModelExistsResponse:
    """Check if the project's model exists in Ollama."""
    project_dir = validate_project_exists(slug)
    target_name = get_target_name_for_project(project_dir)

    try:
        exists = await ollama_service.model_exists(target_name)
        return OllamaModelExistsResponse(exists=exists, model_name=target_name)
    except OllamaServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error_code": e.error_code},
        )


@router.post(
    "/projects/{slug}/ollama/create",
    response_model=OllamaCreateResponse,
    summary="Create model in Ollama",
    description="Create the trained model in Ollama using the generated Modelfile.",
)
async def create_ollama_model(
    slug: str,
    request: OllamaCreateRequest | None = None,
) -> OllamaCreateResponse:
    """Create the model in Ollama."""
    project_dir = validate_project_exists(slug)
    target_name = get_target_name_for_project(
        project_dir,
        request.target_name if request else None
    )

    # Find the Modelfile
    modelfile_path = find_latest_modelfile(project_dir)
    if modelfile_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.OLLAMA_MODELFILE_NOT_FOUND},
        )

    try:
        await ollama_service.create_model(target_name, modelfile_path)
        return OllamaCreateResponse(success=True, model_name=target_name)
    except OllamaServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": e.error_code},
        )


@router.post(
    "/projects/{slug}/ollama/run",
    response_model=OllamaRunResponse,
    summary="Run model in terminal",
    description="Open a new terminal window and run the model with Ollama.",
)
async def run_ollama_model(slug: str) -> OllamaRunResponse:
    """Open terminal and run the model."""
    project_dir = validate_project_exists(slug)
    target_name = get_target_name_for_project(project_dir)

    # Verify model exists in Ollama first
    try:
        exists = await ollama_service.model_exists(target_name)
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error_code": ErrorCode.OLLAMA_MODEL_NOT_FOUND},
            )
    except OllamaServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error_code": e.error_code},
        )

    try:
        ollama_service.open_terminal_with_run(target_name)
        return OllamaRunResponse(success=True, model_name=target_name)
    except OllamaServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": e.error_code},
        )
