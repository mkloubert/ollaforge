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

"""Default values for training parameters."""

# =============================================================================
# Training Parameters
# =============================================================================

DEFAULT_MAX_LENGTH = 512
DEFAULT_EPOCHS = 3
DEFAULT_BATCH_SIZE_CUDA = 4
DEFAULT_BATCH_SIZE_CPU = 1
DEFAULT_GRADIENT_ACCUMULATION = 4
DEFAULT_LEARNING_RATE_CUDA = 2e-4
DEFAULT_LEARNING_RATE_CPU = 3e-4
DEFAULT_WARMUP_RATIO_CUDA = 0.1
DEFAULT_WARMUP_RATIO_CPU = 0.03
DEFAULT_OPTIM_CUDA = "paged_adamw_8bit"
DEFAULT_OPTIM_CPU = "adamw_torch"

# Extended training parameters
DEFAULT_WEIGHT_DECAY = 0.01
DEFAULT_MAX_GRAD_NORM = 1.0
DEFAULT_LR_SCHEDULER_TYPE = "linear"
DEFAULT_NEFTUNE_NOISE_ALPHA = 0  # 0 = disabled
DEFAULT_SEED = 42
DEFAULT_LOGGING_STEPS_CUDA = 10
DEFAULT_LOGGING_STEPS_CPU = 5
DEFAULT_SAVE_STRATEGY = "epoch"

# =============================================================================
# LoRA Parameters
# =============================================================================

DEFAULT_LORA_R = 32
DEFAULT_LORA_ALPHA = 64
DEFAULT_LORA_DROPOUT = 0.05
DEFAULT_LORA_TARGET_MODULES = [
    "q_proj",
    "k_proj",
    "v_proj",
    "o_proj",
    "gate_proj",
    "up_proj",
    "down_proj",
]

# Advanced LoRA parameters
DEFAULT_LORA_BIAS = "none"
DEFAULT_USE_RSLORA = False
DEFAULT_USE_DORA = False

# =============================================================================
# Quantization Parameters
# =============================================================================

DEFAULT_LOAD_IN_4BIT = True
DEFAULT_BNB_4BIT_QUANT_TYPE = "nf4"
DEFAULT_BNB_4BIT_USE_DOUBLE_QUANT = True
DEFAULT_BNB_4BIT_COMPUTE_DTYPE = "float16"
DEFAULT_OUTPUT_QUANTIZATION = "q8_0"

# =============================================================================
# Ollama Modelfile Parameters
# =============================================================================

DEFAULT_TEMPERATURE = 0.7
DEFAULT_TOP_P = 0.9
DEFAULT_TOP_K = 40
DEFAULT_STOP = ["### Question:"]
DEFAULT_SYSTEM = "You are a helpful assistant."
DEFAULT_REPEAT_PENALTY = 1.1
DEFAULT_REPEAT_LAST_N = 64
DEFAULT_NUM_CTX = 2048

# =============================================================================
# Task IDs
# =============================================================================

TASK_IDS = [
    "detect_device",
    "import_libraries",
    "load_model",
    "setup_lora",
    "tokenize",
    "train",
    "merge_lora",
    "convert_gguf",
    "create_modelfile",
]
