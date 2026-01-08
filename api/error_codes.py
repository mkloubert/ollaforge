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


class ErrorCode(str, Enum):
    """Error codes for API responses."""

    # Project errors (1xxx)
    PROJECT_ALREADY_EXISTS = "ERR_PROJECT_1001"
    PROJECT_NOT_FOUND = "ERR_PROJECT_1002"
    PROJECT_INVALID_NAME = "ERR_PROJECT_1003"
    PROJECT_NAME_EMPTY = "ERR_PROJECT_1004"
    PROJECT_CREATION_FAILED = "ERR_PROJECT_1005"
    PROJECT_DELETION_FAILED = "ERR_PROJECT_1006"
    PROJECT_UPDATE_FAILED = "ERR_PROJECT_1007"
    PROJECT_OPEN_FOLDER_FAILED = "ERR_PROJECT_1008"

    # Data file errors (3xxx)
    DATA_FILE_NOT_FOUND = "ERR_DATA_3001"
    DATA_FILE_INVALID_TYPE = "ERR_DATA_3002"
    DATA_FILE_UPLOAD_FAILED = "ERR_DATA_3003"
    DATA_FILE_DELETE_FAILED = "ERR_DATA_3004"
    DATA_FILE_READ_FAILED = "ERR_DATA_3005"

    # Training errors (4xxx)
    TRAINING_ALREADY_RUNNING = "ERR_TRAINING_4001"
    TRAINING_NOT_RUNNING = "ERR_TRAINING_4002"
    TRAINING_NO_DATA_FILES = "ERR_TRAINING_4003"
    TRAINING_DATA_FILE_NOT_FOUND = "ERR_TRAINING_4004"
    TRAINING_MODEL_LOAD_FAILED = "ERR_TRAINING_4005"
    TRAINING_FAILED = "ERR_TRAINING_4006"
    TRAINING_EXPORT_FAILED = "ERR_TRAINING_4007"
    TRAINING_CANCELLED = "ERR_TRAINING_4008"
    TRAINING_LLAMA_CPP_NOT_FOUND = "ERR_TRAINING_4009"

    # Hugging Face errors (5xxx)
    HF_NOT_LOGGED_IN = "ERR_HF_5001"
    HF_LOGIN_FAILED = "ERR_HF_5002"
    HF_INVALID_TOKEN = "ERR_HF_5003"

    # Ollama errors (6xxx)
    OLLAMA_NOT_INSTALLED = "ERR_OLLAMA_6001"
    OLLAMA_NOT_RUNNING = "ERR_OLLAMA_6002"
    OLLAMA_CREATE_FAILED = "ERR_OLLAMA_6003"
    OLLAMA_MODEL_NOT_FOUND = "ERR_OLLAMA_6004"
    OLLAMA_MODELFILE_NOT_FOUND = "ERR_OLLAMA_6005"
    OLLAMA_RUN_FAILED = "ERR_OLLAMA_6006"
    OLLAMA_MODEL_NOT_CONFIGURED = "ERR_OLLAMA_6007"

    # Preset errors (7xxx)
    PRESET_NOT_FOUND = "ERR_PRESET_7001"

    # LLM Provider errors (8xxx)
    LLM_PROVIDER_INVALID_TOKEN = "ERR_LLM_8001"
    LLM_PROVIDER_AUTH_FAILED = "ERR_LLM_8002"
    LLM_PROVIDER_UNKNOWN = "ERR_LLM_8003"
    LLM_PROVIDER_API_UNREACHABLE = "ERR_LLM_8004"
    LLM_PROVIDER_SAVE_FAILED = "ERR_LLM_8005"

    # Data source errors (9xxx)
    DATA_SOURCE_INVALID_TYPE = "ERR_DATA_SOURCE_9001"
    DATA_SOURCE_TOO_LARGE = "ERR_DATA_SOURCE_9002"
    DATA_SOURCE_EMPTY = "ERR_DATA_SOURCE_9003"

    # Generation errors (91xx)
    GENERATION_PROVIDER_NOT_CONFIGURED = "ERR_GENERATION_9101"
    GENERATION_MODEL_NOT_AVAILABLE = "ERR_GENERATION_9102"
    GENERATION_TOKEN_LIMIT_EXCEEDED = "ERR_GENERATION_9103"
    GENERATION_LLM_API_ERROR = "ERR_GENERATION_9104"
    GENERATION_INVALID_RESPONSE = "ERR_GENERATION_9105"
    GENERATION_RATE_LIMIT = "ERR_GENERATION_9106"

    # Save generated data errors (92xx)
    SAVE_INVALID_FILENAME = "ERR_SAVE_9201"
    SAVE_FAILED = "ERR_SAVE_9202"
