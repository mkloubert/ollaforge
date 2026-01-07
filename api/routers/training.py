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

import asyncio
import json
import logging
import subprocess
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status

from config import get_config
from error_codes import ErrorCode
from models.project import (
    ProjectLoraConfig,
    QuantizationConfig,
    TrainingConfig,
)

logger = logging.getLogger(__name__)
from models.training import (
    StartTrainingRequest,
    StartTrainingResponse,
    TrainingProgress,
    TrainingStatus,
    TrainingStatusResponse,
)
from services.training_service import training_manager

router = APIRouter(prefix="/api/projects", tags=["training"])


def load_project_configs(project_dir: Path) -> tuple[TrainingConfig | None, ProjectLoraConfig | None, QuantizationConfig | None]:
    """Load training configurations from project.json."""
    project_file = project_dir / "project.json"

    if not project_file.exists():
        return None, None, None

    try:
        with open(project_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        return None, None, None

    training_config = None
    lora_config = None
    quantization_config = None

    # Parse training config
    if "trainingConfig" in data and isinstance(data["trainingConfig"], dict):
        try:
            training_config = TrainingConfig(**data["trainingConfig"])
        except (TypeError, ValueError):
            pass

    # Parse LoRA config
    if "loraConfig" in data and isinstance(data["loraConfig"], dict):
        try:
            lora_config = ProjectLoraConfig(**data["loraConfig"])
        except (TypeError, ValueError):
            pass

    # Parse quantization config
    if "quantizationConfig" in data and isinstance(data["quantizationConfig"], dict):
        try:
            quantization_config = QuantizationConfig(**data["quantizationConfig"])
        except (TypeError, ValueError):
            pass

    return training_config, lora_config, quantization_config


def validate_project_exists(slug: str) -> Path:
    """
    Validate that the project exists and return its path.
    Raises HTTPException if project not found.
    """
    config = get_config()
    project_dir = config.projects_dir / slug
    project_file = project_dir / "project.json"

    if not project_dir.exists() or not project_dir.is_dir() or not project_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.PROJECT_NOT_FOUND},
        )

    return project_dir


def generate_job_id() -> str:
    """Generate a unique job ID using external Python script."""
    result = subprocess.run(
        [sys.executable, "-c", "import uuid; print(uuid.uuid4().hex[:16])"],
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


@router.get(
    "/{slug}/train/status",
    response_model=TrainingStatusResponse,
    summary="Get training status",
    description="Get the current training status for a project.",
)
async def get_training_status(slug: str) -> TrainingStatusResponse:
    """Get current training status for a project."""
    validate_project_exists(slug)

    job = training_manager.get_job(slug)
    is_running = training_manager.is_running(slug)

    if job is None:
        logger.debug(f"GET /api/projects/{slug}/train/status - no job, returning IDLE")
        return TrainingStatusResponse(
            job_id=None,
            status=TrainingStatus.IDLE,
            progress=TrainingProgress(status=TrainingStatus.IDLE),
            can_start=True,
        )

    logger.debug(f"GET /api/projects/{slug}/train/status - job={job.job_id}, status={job.status}")
    return TrainingStatusResponse(
        job_id=job.job_id,
        status=job.status,
        progress=job.get_progress(),
        can_start=not is_running,
    )


@router.websocket("/{slug}/train/ws")
async def websocket_training_updates(websocket: WebSocket, slug: str):
    """WebSocket endpoint for real-time training updates."""
    await websocket.accept()
    logger.info(f"WebSocket connected for project {slug}")

    try:
        while True:
            job = training_manager.get_job(slug)

            if job is None:
                # No job, send idle status with empty tasks and file statuses
                await websocket.send_json({
                    "type": "status",
                    "job_id": None,
                    "status": TrainingStatus.IDLE,
                    "progress": 0,
                    "current_step": 0,
                    "total_steps": 0,
                    "device": None,
                    "error_code": None,
                    "can_start": True,
                    "tasks": [],
                    "file_statuses": [],
                })
                await asyncio.sleep(1)
                continue

            # Send progress update with tasks and file statuses
            progress = job.get_progress()
            tasks_data = [
                {
                    "task_id": task.task_id,
                    "status": task.status,
                    "progress": task.progress,
                    "error_count": task.error_count,
                }
                for task in progress.tasks
            ]
            file_statuses_data = [
                {
                    "filename": fs.filename,
                    "status": fs.status,
                    "rows_loaded": fs.rows_loaded,
                    "rows_skipped": fs.rows_skipped,
                }
                for fs in progress.file_statuses
            ]

            await websocket.send_json({
                "type": "progress",
                "job_id": job.job_id,
                "status": progress.status,
                "progress": progress.progress,
                "current_step": progress.current_step,
                "total_steps": progress.total_steps,
                "device": progress.device,
                "error_code": progress.error_code,
                "can_start": False,
                "tasks": tasks_data,
                "file_statuses": file_statuses_data,
            })

            # Check if job is done
            if job.status in [
                TrainingStatus.COMPLETED,
                TrainingStatus.FAILED,
                TrainingStatus.CANCELLED,
            ]:
                await websocket.send_json({
                    "type": "done",
                    "job_id": job.job_id,
                    "status": job.status,
                    "error_code": job.error_code,
                    "tasks": tasks_data,
                    "file_statuses": file_statuses_data,
                })
                logger.info(f"Training completed for {slug}, status: {job.status}")
                # Don't break - keep connection open for potential new jobs
                await asyncio.sleep(1)
                continue

            await asyncio.sleep(0.3)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for project {slug}")
    except Exception as e:
        logger.error(f"WebSocket error for {slug}: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e),
            })
        except Exception:
            pass


@router.post(
    "/{slug}/train",
    response_model=StartTrainingResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start training",
    description="Start a new training job for the project.",
    responses={
        400: {"description": "Invalid request or no data files"},
        409: {"description": "Training already running"},
    },
)
async def start_training(slug: str, request: StartTrainingRequest) -> StartTrainingResponse:
    """Start a new training job. Returns immediately with job ID."""
    logger.info(f"POST /api/projects/{slug}/train - model={request.model_name}, files={request.data_files}")

    project_dir = validate_project_exists(slug)

    # Check if already running
    if training_manager.is_running(slug):
        logger.warning(f"Training already running for {slug}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": ErrorCode.TRAINING_ALREADY_RUNNING},
        )

    # Validate data files exist
    if not request.data_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.TRAINING_NO_DATA_FILES},
        )

    data_dir = project_dir / "data"
    for filename in request.data_files:
        file_path = data_dir / filename
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error_code": ErrorCode.TRAINING_DATA_FILE_NOT_FOUND},
            )

    # Generate job ID
    job_id = generate_job_id()
    logger.info(f"Starting training job {job_id} for {slug}")

    # Load project configurations
    training_config, lora_config, quantization_config = load_project_configs(project_dir)
    if training_config:
        logger.info(f"Loaded training config for {slug}")
    if lora_config:
        logger.info(f"Loaded LoRA config for {slug}")
    if quantization_config:
        logger.info(f"Loaded quantization config for {slug}")

    # Start training in background - returns immediately
    job = training_manager.start_training(
        job_id=job_id,
        project_slug=slug,
        project_path=project_dir,
        model_name=request.model_name,
        data_files=request.data_files,
        quantization=request.quantization,
        training_config=training_config,
        lora_config=lora_config,
        quantization_config=quantization_config,
    )

    # Return immediately with job ID - client should connect to WebSocket for updates
    # Status is IDLE initially, will change to STARTING when background thread begins
    return StartTrainingResponse(
        job_id=job.job_id,
        status=job.status,
    )


@router.post(
    "/{slug}/train/cancel",
    status_code=status.HTTP_200_OK,
    summary="Cancel training",
    description="Cancel a running training job.",
    responses={
        404: {"description": "No training running"},
    },
)
async def cancel_training(slug: str) -> dict:
    """Cancel a running training job."""
    validate_project_exists(slug)

    if not training_manager.is_running(slug):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.TRAINING_NOT_RUNNING},
        )

    training_manager.cancel_training(slug)

    return {"cancelled": True}
