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

from enum import Enum
from pydantic import BaseModel, Field


class TrainingStatus(str, Enum):
    """Status of a training job."""

    IDLE = "idle"
    STARTING = "starting"
    LOADING_DATA = "loading_data"
    LOADING_MODEL = "loading_model"
    TRAINING = "training"
    EXPORTING = "exporting"
    CONVERTING = "converting"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskStatus(str, Enum):
    """Status of an individual task."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class TrainingTask(BaseModel):
    """A single task in the training pipeline."""

    task_id: str = Field(..., description="Unique task identifier")
    status: TaskStatus = Field(default=TaskStatus.PENDING, description="Task status")
    progress: int = Field(default=0, ge=0, le=100, description="Progress percentage (0-100)")


class DeviceType(str, Enum):
    """Type of compute device."""

    CUDA = "cuda"
    MPS = "mps"
    CPU = "cpu"


class StartTrainingRequest(BaseModel):
    """Request body for starting a training job."""

    model_name: str = Field(
        ...,
        description="HuggingFace model name (e.g. TinyLlama/TinyLlama-1.1B-Chat-v1.0)",
    )
    data_files: list[str] = Field(
        ...,
        min_length=1,
        description="List of JSONL filenames to use for training",
    )
    quantization: str = Field(
        default="q8_0",
        description="GGUF quantization type (f32, f16, bf16, q8_0, auto)",
    )


class StartTrainingResponse(BaseModel):
    """Response after starting a training job."""

    job_id: str = Field(..., description="Unique identifier for the training job")
    status: TrainingStatus = Field(..., description="Current status of the job")


class TrainingProgress(BaseModel):
    """Progress information for a training job."""

    status: TrainingStatus = Field(..., description="Current status of the job")
    progress: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Overall progress percentage (0-100)",
    )
    current_step: int = Field(default=0, description="Current training step")
    total_steps: int = Field(default=0, description="Total training steps")
    device: DeviceType | None = Field(default=None, description="Compute device being used")
    error_code: str | None = Field(default=None, description="Error code if failed")
    tasks: list[TrainingTask] = Field(default_factory=list, description="List of tasks")


class TrainingStatusResponse(BaseModel):
    """Full status response for a training job."""

    job_id: str | None = Field(default=None, description="Job ID if a job exists")
    status: TrainingStatus = Field(..., description="Current status")
    progress: TrainingProgress = Field(..., description="Progress information")
    can_start: bool = Field(..., description="Whether a new training can be started")
