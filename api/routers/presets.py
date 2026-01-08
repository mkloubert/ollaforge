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

from fastapi import APIRouter, HTTPException, status

from constants.training_presets import (
    TrainingPreset,
    get_all_presets,
    get_preset_by_id,
)
from error_codes import ErrorCode
from models.preset import (
    PresetInfo,
    PresetLoraConfigInfo,
    PresetQuantizationConfigInfo,
    PresetTrainingConfigInfo,
)

router = APIRouter(prefix="/api/presets", tags=["presets"])


def _convert_preset_to_info(preset: TrainingPreset) -> PresetInfo:
    """Convert internal TrainingPreset to API PresetInfo model."""
    return PresetInfo(
        id=preset.id,
        name_key=preset.name_key,
        description_key=preset.description_key,
        pros=preset.pros,
        cons=preset.cons,
        recommended_models=preset.recommended_models,
        training_config=PresetTrainingConfigInfo(
            num_train_epochs=preset.training_config.num_train_epochs,
            per_device_train_batch_size=preset.training_config.per_device_train_batch_size,
            gradient_accumulation_steps=preset.training_config.gradient_accumulation_steps,
            learning_rate=preset.training_config.learning_rate,
            warmup_ratio=preset.training_config.warmup_ratio,
            max_length=preset.training_config.max_length,
            weight_decay=preset.training_config.weight_decay,
            max_grad_norm=preset.training_config.max_grad_norm,
            lr_scheduler_type=preset.training_config.lr_scheduler_type,
            neftune_noise_alpha=preset.training_config.neftune_noise_alpha,
        ),
        lora_config=PresetLoraConfigInfo(
            r=preset.lora_config.r,
            lora_alpha=preset.lora_config.lora_alpha,
            lora_dropout=preset.lora_config.lora_dropout,
            target_modules=preset.lora_config.target_modules,
            bias=preset.lora_config.bias,
            use_rslora=preset.lora_config.use_rslora,
            use_dora=preset.lora_config.use_dora,
            modules_to_save=preset.lora_config.modules_to_save,
        ),
        quantization_config=PresetQuantizationConfigInfo(
            load_in_4bit=preset.quantization_config.load_in_4bit,
            bnb_4bit_quant_type=preset.quantization_config.bnb_4bit_quant_type,
            bnb_4bit_use_double_quant=preset.quantization_config.bnb_4bit_use_double_quant,
            output_quantization=preset.quantization_config.output_quantization,
        ),
    )


@router.get(
    "",
    response_model=list[PresetInfo],
    summary="List all training presets",
    description="Returns all available training presets sorted alphabetically by ID.",
)
async def list_presets() -> list[PresetInfo]:
    """Get all training presets."""
    presets = get_all_presets()
    return [_convert_preset_to_info(preset) for preset in presets]


@router.get(
    "/{preset_id}",
    response_model=PresetInfo,
    summary="Get a specific training preset",
    description="Returns a single training preset by its ID.",
    responses={
        404: {"description": "Preset not found"},
    },
)
async def get_preset(preset_id: str) -> PresetInfo:
    """Get a specific training preset by ID."""
    preset = get_preset_by_id(preset_id)

    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.PRESET_NOT_FOUND},
        )

    return _convert_preset_to_info(preset)
