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


class PresetTrainingConfigInfo(BaseModel):
    """Training configuration values for a preset."""

    num_train_epochs: int | None = Field(None, description="Number of training epochs")
    per_device_train_batch_size: int | None = Field(None, description="Batch size per device")
    gradient_accumulation_steps: int | None = Field(None, description="Gradient accumulation steps")
    learning_rate: float | None = Field(None, description="Learning rate")
    warmup_ratio: float | None = Field(None, description="Warmup ratio")
    max_length: int | None = Field(None, description="Maximum sequence length")
    weight_decay: float | None = Field(None, description="Weight decay")
    max_grad_norm: float | None = Field(None, description="Maximum gradient norm")
    lr_scheduler_type: str | None = Field(None, description="Learning rate scheduler type")
    neftune_noise_alpha: float | None = Field(None, description="NEFTune noise alpha")


class PresetLoraConfigInfo(BaseModel):
    """LoRA configuration values for a preset."""

    r: int | None = Field(None, description="LoRA rank")
    lora_alpha: int | None = Field(None, description="LoRA alpha scaling factor")
    lora_dropout: float | None = Field(None, description="LoRA dropout")
    target_modules: list[str] | None = Field(None, description="Target modules for LoRA")
    bias: str | None = Field(None, description="Bias training mode")
    use_rslora: bool | None = Field(None, description="Use Rank-Stabilized LoRA")
    use_dora: bool | None = Field(None, description="Use DoRA")
    modules_to_save: list[str] | None = Field(None, description="Modules to save fully")


class PresetQuantizationConfigInfo(BaseModel):
    """Quantization configuration values for a preset."""

    load_in_4bit: bool | None = Field(None, description="Load model in 4-bit")
    bnb_4bit_quant_type: str | None = Field(None, description="4-bit quantization type")
    bnb_4bit_use_double_quant: bool | None = Field(None, description="Use double quantization")
    output_quantization: str | None = Field(None, description="Output GGUF quantization")


class PresetInfo(BaseModel):
    """Information about a training preset for API responses."""

    id: str = Field(..., description="Unique preset identifier (slug)")
    name_key: str = Field(..., description="i18n key for display name")
    description_key: str = Field(..., description="i18n key for description")
    pros: list[str] = Field(default_factory=list, description="List of i18n keys for advantages")
    cons: list[str] = Field(default_factory=list, description="List of i18n keys for disadvantages")
    recommended_models: list[str] = Field(
        default_factory=list,
        description="Model name patterns this preset works best with (* = all)",
    )
    training_config: PresetTrainingConfigInfo = Field(
        default_factory=PresetTrainingConfigInfo,
        description="Training configuration values",
    )
    lora_config: PresetLoraConfigInfo = Field(
        default_factory=PresetLoraConfigInfo,
        description="LoRA configuration values",
    )
    quantization_config: PresetQuantizationConfigInfo = Field(
        default_factory=PresetQuantizationConfigInfo,
        description="Quantization configuration values",
    )
