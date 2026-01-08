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
import shutil
import subprocess
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from config import get_config
from error_codes import ErrorCode
from models.project import (
    CreateProjectRequest,
    CreateProjectResponse,
    ErrorResponse,
    ModelfileConfig,
    ProjectInfo,
    ProjectLoraConfig,
    QuantizationConfig,
    TrainingConfig,
    UpdateProjectRequest,
    UpdateProjectResponse,
)
from utils.config_parsers import (
    parse_lora_config,
    parse_modelfile_config,
    parse_quantization_config,
    parse_training_config,
)
from utils.project_utils import read_project_json, slugify

router = APIRouter(prefix="/api/projects", tags=["projects"])


async def get_all_projects() -> list[ProjectInfo]:
    """
    Scan the projects directory and return all valid projects.
    Only includes directories with a valid project.json file.
    """
    config = get_config()
    projects_dir = config.projects_dir

    if not projects_dir.exists():
        return []

    projects: list[ProjectInfo] = []

    for entry in projects_dir.iterdir():
        if not entry.is_dir():
            continue

        project_data = read_project_json(entry)
        if project_data is None:
            continue

        description = project_data.get("description")
        if description:
            description = description.strip() or None

        model = project_data.get("model")
        if model:
            model = model.strip() or None

        target_name = project_data.get("targetName")
        if target_name:
            target_name = target_name.strip() or None

        projects.append(
            ProjectInfo(
                slug=entry.name,
                name=project_data["name"].strip(),
                description=description,
                model=model,
                target_name=target_name,
                path=str(entry.resolve()),
                training_config=parse_training_config(project_data),
                lora_config=parse_lora_config(project_data),
                quantization_config=parse_quantization_config(project_data),
                modelfile_config=parse_modelfile_config(project_data),
            )
        )

    # Sort alphabetically by name (case-insensitive)
    projects.sort(key=lambda p: p.name.lower())

    return projects


@router.get(
    "",
    response_model=list[ProjectInfo],
    summary="List all projects",
    description="Returns a list of all valid projects sorted alphabetically by name.",
)
async def list_projects() -> list[ProjectInfo]:
    """Get all projects from the projects directory."""
    return await get_all_projects()


@router.post(
    "",
    response_model=CreateProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
    description="Creates a new project with the given name.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid project name"},
        409: {"model": ErrorResponse, "description": "Project already exists"},
    },
)
async def create_project(request: CreateProjectRequest) -> CreateProjectResponse:
    """Create a new project."""
    config = get_config()
    projects_dir = config.projects_dir

    # Validate and trim the name
    name = request.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.PROJECT_NAME_EMPTY},
        )

    # Generate slug from name
    slug = slugify(name)

    if not slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.PROJECT_INVALID_NAME},
        )

    # Check if project already exists
    project_dir = projects_dir / slug

    if project_dir.exists():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": ErrorCode.PROJECT_ALREADY_EXISTS},
        )

    # Process description
    description = request.description
    if description:
        description = description.strip() or None

    # Create project directory and project.json
    try:
        project_dir.mkdir(parents=True, exist_ok=False)

        project_data: dict[str, str | None] = {"name": name}
        if description:
            project_data["description"] = description

        project_file = project_dir / "project.json"

        with open(project_file, "w", encoding="utf-8") as f:
            json.dump(project_data, f, ensure_ascii=False, indent=2)

    except OSError:
        # Clean up if directory was created
        if project_dir.exists():
            try:
                project_dir.rmdir()
            except OSError:
                pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.PROJECT_CREATION_FAILED},
        )

    return CreateProjectResponse(slug=slug, name=name, description=description)


@router.put(
    "/{slug}",
    response_model=UpdateProjectResponse,
    summary="Update a project",
    description="Updates a project's name and description.",
    responses={
        404: {"model": ErrorResponse, "description": "Project not found"},
        500: {"model": ErrorResponse, "description": "Failed to update project"},
    },
)
async def update_project(slug: str, request: UpdateProjectRequest) -> UpdateProjectResponse:
    """Update a project by slug."""
    config = get_config()
    projects_dir = config.projects_dir

    project_dir = projects_dir / slug

    # Check if project exists
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.PROJECT_NOT_FOUND},
        )

    # Verify it's a valid project (has project.json)
    existing_data = read_project_json(project_dir)
    if existing_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.PROJECT_NOT_FOUND},
        )

    # Validate and trim the name
    name = request.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.PROJECT_NAME_EMPTY},
        )

    # Process description
    description = request.description
    if description:
        description = description.strip() or None

    # Process model
    model = request.model
    if model:
        model = model.strip() or None

    # Process target_name
    target_name = request.target_name
    if target_name:
        target_name = target_name.strip() or None

    # Process config objects
    training_config = request.training_config
    lora_config = request.lora_config
    quantization_config = request.quantization_config
    modelfile_config = request.modelfile_config

    # Update project.json
    try:
        project_data: dict = {"name": name}
        if description:
            project_data["description"] = description
        if model:
            project_data["model"] = model
        if target_name:
            project_data["targetName"] = target_name

        # Add config objects if they have any non-None values
        if training_config:
            config_dict = training_config.model_dump(exclude_none=True)
            if config_dict:
                project_data["trainingConfig"] = config_dict

        if lora_config:
            config_dict = lora_config.model_dump(exclude_none=True)
            if config_dict:
                project_data["loraConfig"] = config_dict

        if quantization_config:
            config_dict = quantization_config.model_dump(exclude_none=True)
            if config_dict:
                project_data["quantizationConfig"] = config_dict

        if modelfile_config:
            config_dict = modelfile_config.model_dump(exclude_none=True)
            if config_dict:
                project_data["modelfileConfig"] = config_dict

        project_file = project_dir / "project.json"

        with open(project_file, "w", encoding="utf-8") as f:
            json.dump(project_data, f, ensure_ascii=False, indent=2)

    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.PROJECT_UPDATE_FAILED},
        )

    return UpdateProjectResponse(
        slug=slug,
        name=name,
        description=description,
        model=model,
        target_name=target_name,
        training_config=training_config,
        lora_config=lora_config,
        quantization_config=quantization_config,
        modelfile_config=modelfile_config,
    )


@router.delete(
    "/{slug}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
    description="Deletes a project by its slug.",
    responses={
        404: {"model": ErrorResponse, "description": "Project not found"},
        500: {"model": ErrorResponse, "description": "Failed to delete project"},
    },
)
async def delete_project(slug: str) -> None:
    """Delete a project by slug."""
    config = get_config()
    projects_dir = config.projects_dir

    project_dir = projects_dir / slug

    # Check if project exists
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.PROJECT_NOT_FOUND},
        )

    # Verify it's a valid project (has project.json)
    project_data = read_project_json(project_dir)
    if project_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.PROJECT_NOT_FOUND},
        )

    # Delete the project directory
    try:
        shutil.rmtree(project_dir)
    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.PROJECT_DELETION_FAILED},
        )


@router.post(
    "/{slug}/open-folder",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Open project folder",
    description="Opens the project folder in the system file manager.",
    responses={
        404: {"model": ErrorResponse, "description": "Project not found"},
        500: {"model": ErrorResponse, "description": "Failed to open folder"},
    },
)
async def open_project_folder(slug: str) -> None:
    """Open the project folder in the system file manager."""
    config = get_config()
    projects_dir = config.projects_dir

    project_dir = projects_dir / slug

    # Check if project exists
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.PROJECT_NOT_FOUND},
        )

    # Verify it's a valid project (has project.json)
    project_data = read_project_json(project_dir)
    if project_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.PROJECT_NOT_FOUND},
        )

    # Open folder in system file manager
    try:
        if sys.platform == "win32":
            # Windows: use explorer
            subprocess.Popen(["explorer", str(project_dir)])
        elif sys.platform == "darwin":
            # macOS: use open
            subprocess.Popen(["open", str(project_dir)])
        else:
            # Linux and other Unix-like: use xdg-open
            subprocess.Popen(["xdg-open", str(project_dir)])
    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.PROJECT_OPEN_FOLDER_FAILED},
        )
