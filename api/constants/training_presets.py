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

"""Training presets with optimized configurations for different use cases."""

from dataclasses import dataclass, field


@dataclass
class PresetTrainingConfig:
    """Training configuration for a preset."""

    num_train_epochs: int | None = None
    per_device_train_batch_size: int | None = None
    gradient_accumulation_steps: int | None = None
    learning_rate: float | None = None
    warmup_ratio: float | None = None
    max_length: int | None = None
    weight_decay: float | None = None
    max_grad_norm: float | None = None
    lr_scheduler_type: str | None = None
    neftune_noise_alpha: float | None = None


@dataclass
class PresetLoraConfig:
    """LoRA configuration for a preset."""

    r: int | None = None
    lora_alpha: int | None = None
    lora_dropout: float | None = None
    target_modules: list[str] | None = None
    bias: str | None = None
    use_rslora: bool | None = None
    use_dora: bool | None = None
    modules_to_save: list[str] | None = None


@dataclass
class PresetQuantizationConfig:
    """Quantization configuration for a preset."""

    load_in_4bit: bool | None = None
    bnb_4bit_quant_type: str | None = None
    bnb_4bit_use_double_quant: bool | None = None
    output_quantization: str | None = None


@dataclass
class TrainingPreset:
    """A training preset with optimized configurations."""

    id: str
    name_key: str  # i18n key for display name
    description_key: str  # i18n key for description
    pros: list[str]  # List of i18n keys for advantages
    cons: list[str]  # List of i18n keys for disadvantages
    recommended_models: list[str]  # Model name patterns (partial match)
    training_config: PresetTrainingConfig = field(default_factory=PresetTrainingConfig)
    lora_config: PresetLoraConfig = field(default_factory=PresetLoraConfig)
    quantization_config: PresetQuantizationConfig = field(default_factory=PresetQuantizationConfig)


# =============================================================================
# Preset Definitions (alphabetically sorted by ID)
# =============================================================================

TRAINING_PRESETS: list[TrainingPreset] = sorted(
    [
        # -------------------------------------------------------------------------
        # Balanced - Good for most tasks
        # -------------------------------------------------------------------------
        TrainingPreset(
            id="balanced",
            name_key="presets.balanced.name",
            description_key="presets.balanced.description",
            pros=[
                "presets.balanced.pros.versatile",
                "presets.balanced.pros.stable",
                "presets.balanced.pros.good_defaults",
            ],
            cons=[
                "presets.balanced.cons.not_specialized",
                "presets.balanced.cons.moderate_time",
            ],
            recommended_models=["*"],  # All models
            training_config=PresetTrainingConfig(
                num_train_epochs=3,
                learning_rate=2e-4,
                warmup_ratio=0.1,
                weight_decay=0.01,
                max_grad_norm=1.0,
                lr_scheduler_type="linear",
            ),
            lora_config=PresetLoraConfig(
                r=32,
                lora_alpha=64,
                lora_dropout=0.1,
            ),
        ),
        # -------------------------------------------------------------------------
        # Chat/Conversation - Optimized for conversational AI
        # -------------------------------------------------------------------------
        TrainingPreset(
            id="chat",
            name_key="presets.chat.name",
            description_key="presets.chat.description",
            pros=[
                "presets.chat.pros.natural_responses",
                "presets.chat.pros.instruction_following",
                "presets.chat.pros.diverse_outputs",
            ],
            cons=[
                "presets.chat.cons.more_memory",
                "presets.chat.cons.longer_training",
            ],
            recommended_models=["mistral", "qwen", "smollm"],
            training_config=PresetTrainingConfig(
                num_train_epochs=3,
                learning_rate=2e-4,
                warmup_ratio=0.1,
                neftune_noise_alpha=5.0,  # Improves conversational quality
                max_length=1024,  # Longer context for conversations
            ),
            lora_config=PresetLoraConfig(
                r=64,  # Higher rank for better conversation capture
                lora_alpha=128,
                lora_dropout=0.1,
            ),
        ),
        # -------------------------------------------------------------------------
        # Code Generation - Optimized for code
        # -------------------------------------------------------------------------
        TrainingPreset(
            id="code",
            name_key="presets.code.name",
            description_key="presets.code.description",
            pros=[
                "presets.code.pros.precise_syntax",
                "presets.code.pros.low_dropout",
                "presets.code.pros.all_modules",
            ],
            cons=[
                "presets.code.cons.more_memory",
                "presets.code.cons.slower_training",
            ],
            recommended_models=["qwen", "mistral", "phi"],
            training_config=PresetTrainingConfig(
                num_train_epochs=3,
                learning_rate=1e-4,  # Lower LR for precise learning
                warmup_ratio=0.05,
                max_length=2048,  # Longer context for code
                lr_scheduler_type="cosine",
            ),
            lora_config=PresetLoraConfig(
                r=32,
                lora_alpha=64,
                lora_dropout=0.05,  # Lower dropout for precision
                target_modules=[
                    "q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj",
                    "lm_head",  # Include language model head
                ],
                modules_to_save=["embed_tokens"],  # Save embeddings
            ),
        ),
        # -------------------------------------------------------------------------
        # Fast Iteration - Quick experiments
        # -------------------------------------------------------------------------
        TrainingPreset(
            id="fast",
            name_key="presets.fast.name",
            description_key="presets.fast.description",
            pros=[
                "presets.fast.pros.quick_results",
                "presets.fast.pros.low_memory",
                "presets.fast.pros.rapid_testing",
            ],
            cons=[
                "presets.fast.cons.lower_quality",
                "presets.fast.cons.less_learning",
            ],
            recommended_models=["smollm", "tinyllama", "bloomz"],
            training_config=PresetTrainingConfig(
                num_train_epochs=1,  # Single epoch
                learning_rate=3e-4,  # Higher LR for faster learning
                warmup_ratio=0.03,
                max_length=512,
            ),
            lora_config=PresetLoraConfig(
                r=16,  # Smaller rank
                lora_alpha=32,
                lora_dropout=0.1,
            ),
        ),
        # -------------------------------------------------------------------------
        # High Quality - Maximum quality
        # -------------------------------------------------------------------------
        TrainingPreset(
            id="high_quality",
            name_key="presets.high_quality.name",
            description_key="presets.high_quality.description",
            pros=[
                "presets.high_quality.pros.best_results",
                "presets.high_quality.pros.thorough_learning",
                "presets.high_quality.pros.all_modules",
            ],
            cons=[
                "presets.high_quality.cons.long_training",
                "presets.high_quality.cons.high_memory",
                "presets.high_quality.cons.needs_gpu",
            ],
            recommended_models=["qwen2.5-14b", "mixtral", "mistral-7b"],
            training_config=PresetTrainingConfig(
                num_train_epochs=5,  # More epochs
                learning_rate=1e-4,  # Lower LR for careful learning
                warmup_ratio=0.1,
                weight_decay=0.01,
                max_grad_norm=0.5,  # Stricter gradient clipping
                lr_scheduler_type="cosine",
                max_length=1024,
            ),
            lora_config=PresetLoraConfig(
                r=64,  # Higher rank
                lora_alpha=128,
                lora_dropout=0.05,
                target_modules=[
                    "q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj",
                ],
                use_rslora=True,  # Rank-stabilized LoRA
            ),
            quantization_config=PresetQuantizationConfig(
                output_quantization="f16",  # Higher quality output
            ),
        ),
        # -------------------------------------------------------------------------
        # Low Memory - For limited hardware
        # -------------------------------------------------------------------------
        TrainingPreset(
            id="low_memory",
            name_key="presets.low_memory.name",
            description_key="presets.low_memory.description",
            pros=[
                "presets.low_memory.pros.minimal_vram",
                "presets.low_memory.pros.works_on_consumer",
                "presets.low_memory.pros.gradient_accumulation",
            ],
            cons=[
                "presets.low_memory.cons.slower_training",
                "presets.low_memory.cons.smaller_rank",
            ],
            recommended_models=["smollm", "tinyllama", "bloomz", "phi"],
            training_config=PresetTrainingConfig(
                num_train_epochs=3,
                per_device_train_batch_size=1,  # Minimal batch
                gradient_accumulation_steps=16,  # Compensate with accumulation
                learning_rate=2e-4,
                warmup_ratio=0.1,
                max_length=512,  # Shorter context
            ),
            lora_config=PresetLoraConfig(
                r=8,  # Minimal rank
                lora_alpha=16,
                lora_dropout=0.1,
            ),
            quantization_config=PresetQuantizationConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
                output_quantization="q4_k_m",  # Smaller output
            ),
        ),
        # -------------------------------------------------------------------------
        # Multilingual - For multilingual models
        # -------------------------------------------------------------------------
        TrainingPreset(
            id="multilingual",
            name_key="presets.multilingual.name",
            description_key="presets.multilingual.description",
            pros=[
                "presets.multilingual.pros.language_diversity",
                "presets.multilingual.pros.balanced_learning",
                "presets.multilingual.pros.longer_warmup",
            ],
            cons=[
                "presets.multilingual.cons.needs_diverse_data",
                "presets.multilingual.cons.moderate_time",
            ],
            recommended_models=["qwen", "bloomz"],
            training_config=PresetTrainingConfig(
                num_train_epochs=3,
                learning_rate=2e-4,
                warmup_ratio=0.15,  # Longer warmup for language adaptation
                weight_decay=0.01,
                max_length=1024,
            ),
            lora_config=PresetLoraConfig(
                r=32,
                lora_alpha=64,
                lora_dropout=0.1,
                modules_to_save=["embed_tokens"],  # Important for multilingual
            ),
        ),
        # -------------------------------------------------------------------------
        # Reasoning/Math - For logical reasoning
        # -------------------------------------------------------------------------
        TrainingPreset(
            id="reasoning",
            name_key="presets.reasoning.name",
            description_key="presets.reasoning.description",
            pros=[
                "presets.reasoning.pros.precise_learning",
                "presets.reasoning.pros.low_dropout",
                "presets.reasoning.pros.consistent_outputs",
            ],
            cons=[
                "presets.reasoning.cons.more_epochs",
                "presets.reasoning.cons.higher_rank",
            ],
            recommended_models=["phi", "qwen"],
            training_config=PresetTrainingConfig(
                num_train_epochs=4,  # More epochs for reasoning
                learning_rate=1e-4,  # Lower LR for precise learning
                warmup_ratio=0.1,
                weight_decay=0.01,
                max_grad_norm=0.5,
                lr_scheduler_type="cosine",
                max_length=1024,
            ),
            lora_config=PresetLoraConfig(
                r=48,  # Higher rank for complex reasoning
                lora_alpha=96,
                lora_dropout=0.05,  # Lower dropout for consistency
            ),
        ),
    ],
    key=lambda p: p.id,
)

# Create a lookup dictionary for quick access by ID
PRESETS_BY_ID: dict[str, TrainingPreset] = {preset.id: preset for preset in TRAINING_PRESETS}


def get_preset_by_id(preset_id: str) -> TrainingPreset | None:
    """Get a preset by its ID."""
    return PRESETS_BY_ID.get(preset_id)


def get_all_presets() -> list[TrainingPreset]:
    """Get all presets sorted alphabetically by ID."""
    return TRAINING_PRESETS
