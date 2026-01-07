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

from pydantic import BaseModel, Field


class TrainingConfig(BaseModel):
    """Configuration for training parameters."""

    num_train_epochs: int | None = Field(
        None,
        ge=1,
        le=10,
        description="Number of training epochs (default: 3)",
    )
    per_device_train_batch_size: int | None = Field(
        None,
        ge=1,
        le=16,
        description="Batch size per device (default: 4 for CUDA, 1 for CPU/MPS)",
    )
    gradient_accumulation_steps: int | None = Field(
        None,
        ge=1,
        le=32,
        description="Number of gradient accumulation steps (default: 4)",
    )
    learning_rate: float | None = Field(
        None,
        gt=0,
        le=1,
        description="Learning rate (default: 2e-4 for CUDA, 3e-4 for CPU/MPS)",
    )
    warmup_ratio: float | None = Field(
        None,
        ge=0,
        le=1,
        description="Warmup ratio (default: 0.1 for CUDA, 0.03 for CPU/MPS)",
    )
    max_length: int | None = Field(
        None,
        ge=128,
        le=8192,
        description="Maximum token length (default: 512)",
    )
    fp16: bool | None = Field(
        None,
        description="Use 16-bit floating point (default: True for CUDA, False for CPU/MPS)",
    )
    optim: str | None = Field(
        None,
        max_length=50,
        description="Optimizer to use (default: paged_adamw_8bit for CUDA, adamw_torch for CPU/MPS)",
    )


class ProjectLoraConfig(BaseModel):
    """Configuration for LoRA (Low-Rank Adaptation) parameters."""

    r: int | None = Field(
        None,
        ge=4,
        le=256,
        description="LoRA rank - higher values capture more information but use more memory (default: 32)",
    )
    lora_alpha: int | None = Field(
        None,
        ge=8,
        le=512,
        description="LoRA alpha scaling factor - typically 2x the rank (default: 64)",
    )
    lora_dropout: float | None = Field(
        None,
        ge=0,
        le=0.5,
        description="Dropout probability for LoRA layers (default: 0.05)",
    )
    target_modules: list[str] | None = Field(
        None,
        description="List of modules to apply LoRA to (default: q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj)",
    )


class QuantizationConfig(BaseModel):
    """Configuration for model quantization."""

    load_in_4bit: bool | None = Field(
        None,
        description="Load model in 4-bit quantization for reduced memory usage (default: True for CUDA)",
    )
    bnb_4bit_quant_type: str | None = Field(
        None,
        max_length=10,
        description="4-bit quantization type: 'nf4' or 'fp4' (default: nf4)",
    )
    bnb_4bit_use_double_quant: bool | None = Field(
        None,
        description="Use double quantization for additional memory savings (default: True)",
    )
    output_quantization: str | None = Field(
        None,
        max_length=10,
        description="Output GGUF quantization type: f32, f16, bf16, q8_0, auto (default: q8_0)",
    )


class ProjectInfo(BaseModel):
    """Information about a project."""

    slug: str = Field(..., description="The project slug (directory name)")
    name: str = Field(..., description="The display name of the project")
    description: str | None = Field(
        None, description="Optional description of the project"
    )
    model: str | None = Field(
        None, description="The selected base model for training"
    )
    target_name: str | None = Field(
        None, description="The custom name for the final trained model"
    )
    path: str = Field(..., description="Full path to the project directory")
    training_config: TrainingConfig | None = Field(
        None, description="Training configuration parameters"
    )
    lora_config: ProjectLoraConfig | None = Field(
        None, description="LoRA configuration parameters"
    )
    quantization_config: QuantizationConfig | None = Field(
        None, description="Quantization configuration parameters"
    )


class CreateProjectRequest(BaseModel):
    """Request body for creating a new project."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="The display name for the new project",
    )
    description: str | None = Field(
        None,
        max_length=500,
        description="Optional description for the project",
    )


class CreateProjectResponse(BaseModel):
    """Response body after creating a project."""

    slug: str = Field(..., description="The generated project slug")
    name: str = Field(..., description="The display name of the project")
    description: str | None = Field(
        None, description="Optional description of the project"
    )


class UpdateProjectRequest(BaseModel):
    """Request body for updating a project."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="The display name for the project",
    )
    description: str | None = Field(
        None,
        max_length=500,
        description="Optional description for the project",
    )
    model: str | None = Field(
        None,
        max_length=200,
        description="The selected base model for training",
    )
    target_name: str | None = Field(
        None,
        max_length=200,
        description="The custom name for the final trained model",
    )
    training_config: TrainingConfig | None = Field(
        None, description="Training configuration parameters"
    )
    lora_config: ProjectLoraConfig | None = Field(
        None, description="LoRA configuration parameters"
    )
    quantization_config: QuantizationConfig | None = Field(
        None, description="Quantization configuration parameters"
    )


class UpdateProjectResponse(BaseModel):
    """Response body after updating a project."""

    slug: str = Field(..., description="The project slug")
    name: str = Field(..., description="The display name of the project")
    description: str | None = Field(
        None, description="Optional description of the project"
    )
    model: str | None = Field(
        None, description="The selected base model for training"
    )
    target_name: str | None = Field(
        None, description="The custom name for the final trained model"
    )
    training_config: TrainingConfig | None = Field(
        None, description="Training configuration parameters"
    )
    lora_config: ProjectLoraConfig | None = Field(
        None, description="LoRA configuration parameters"
    )
    quantization_config: QuantizationConfig | None = Field(
        None, description="Quantization configuration parameters"
    )


class ErrorResponse(BaseModel):
    """Standard error response."""

    error_code: str = Field(..., description="The error code")
