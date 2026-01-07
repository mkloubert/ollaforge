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
import platform
import shutil
import subprocess
import sys
import threading
import time
import traceback
from datetime import datetime
from pathlib import Path

from constants.training_defaults import (
    DEFAULT_BATCH_SIZE_CPU,
    DEFAULT_BATCH_SIZE_CUDA,
    DEFAULT_BNB_4BIT_COMPUTE_DTYPE,
    DEFAULT_BNB_4BIT_QUANT_TYPE,
    DEFAULT_BNB_4BIT_USE_DOUBLE_QUANT,
    DEFAULT_EPOCHS,
    DEFAULT_GRADIENT_ACCUMULATION,
    DEFAULT_LEARNING_RATE_CPU,
    DEFAULT_LEARNING_RATE_CUDA,
    DEFAULT_LOAD_IN_4BIT,
    DEFAULT_LOGGING_STEPS_CPU,
    DEFAULT_LOGGING_STEPS_CUDA,
    DEFAULT_LORA_ALPHA,
    DEFAULT_LORA_BIAS,
    DEFAULT_LORA_DROPOUT,
    DEFAULT_LORA_R,
    DEFAULT_LORA_TARGET_MODULES,
    DEFAULT_LR_SCHEDULER_TYPE,
    DEFAULT_MAX_GRAD_NORM,
    DEFAULT_MAX_LENGTH,
    DEFAULT_NEFTUNE_NOISE_ALPHA,
    DEFAULT_NUM_CTX,
    DEFAULT_OPTIM_CPU,
    DEFAULT_OPTIM_CUDA,
    DEFAULT_OUTPUT_QUANTIZATION,
    DEFAULT_REPEAT_LAST_N,
    DEFAULT_REPEAT_PENALTY,
    DEFAULT_SAVE_STRATEGY,
    DEFAULT_SEED,
    DEFAULT_STOP,
    DEFAULT_SYSTEM,
    DEFAULT_TEMPERATURE,
    DEFAULT_TOP_K,
    DEFAULT_TOP_P,
    DEFAULT_USE_DORA,
    DEFAULT_USE_RSLORA,
    DEFAULT_WARMUP_RATIO_CPU,
    DEFAULT_WARMUP_RATIO_CUDA,
    DEFAULT_WEIGHT_DECAY,
    TASK_IDS,
)
from error_codes import ErrorCode
from models.project import (
    ModelfileConfig,
    ProjectLoraConfig,
    QuantizationConfig,
    TrainingConfig,
)
from models.training import (
    DataFileStatus,
    DeviceType,
    TaskStatus,
    TrainingProgress,
    TrainingStatus,
    TrainingTask,
)

logger = logging.getLogger(__name__)


class TrainingJob:
    """Represents a single training job."""

    def __init__(
        self,
        job_id: str,
        project_slug: str,
        project_path: Path,
        model_name: str,
        data_files: list[str],
        quantization: str,
        training_config: TrainingConfig | None = None,
        lora_config: ProjectLoraConfig | None = None,
        quantization_config: QuantizationConfig | None = None,
        modelfile_config: ModelfileConfig | None = None,
    ):
        self.job_id = job_id
        self.project_slug = project_slug
        self.project_path = project_path
        self.model_name = model_name
        self.data_files = data_files
        self.quantization = quantization

        # Store project configurations
        self.training_config = training_config
        self.lora_config = lora_config
        self.quantization_config = quantization_config
        self.modelfile_config = modelfile_config

        self.status = TrainingStatus.IDLE
        self.progress = 0.0
        self.current_step = 0
        self.total_steps = 0
        self.device: DeviceType | None = None
        self.error_code: str | None = None

        # Initialize tasks
        self.tasks: dict[str, TrainingTask] = {}
        for task_id in TASK_IDS:
            self.tasks[task_id] = TrainingTask(task_id=task_id)

        # Initialize file statuses
        self.file_statuses: dict[str, DataFileStatus] = {}
        for filename in data_files:
            self.file_statuses[filename] = DataFileStatus(filename=filename)

        # Cache directory for tokenized dataset
        self.cache_dir = project_path / ".cache" / "training"

        self._cancel_requested = False
        self._thread: threading.Thread | None = None

    def set_task_status(self, task_id: str, status: TaskStatus, progress: int = 0) -> None:
        """Update a task's status and progress."""
        if task_id in self.tasks:
            self.tasks[task_id].status = status
            self.tasks[task_id].progress = progress
            logger.info(f"[{self.job_id}] Task {task_id}: {status} ({progress}%)")

    def set_task_progress(self, task_id: str, progress: int) -> None:
        """Update a task's progress percentage."""
        if task_id in self.tasks:
            self.tasks[task_id].progress = min(100, max(0, progress))

    def increment_task_error_count(self, task_id: str) -> None:
        """Increment the error count for a task."""
        if task_id in self.tasks:
            self.tasks[task_id].error_count += 1

    def set_task_error_count(self, task_id: str, count: int) -> None:
        """Set the error count for a task."""
        if task_id in self.tasks:
            self.tasks[task_id].error_count = count

    def complete_task(self, task_id: str) -> None:
        """Mark a task as completed."""
        self.set_task_status(task_id, TaskStatus.COMPLETED, 100)

    def fail_task(self, task_id: str) -> None:
        """Mark a task as failed."""
        if task_id in self.tasks:
            self.tasks[task_id].status = TaskStatus.FAILED
            logger.error(f"[{self.job_id}] Task {task_id} FAILED")

    def skip_task(self, task_id: str) -> None:
        """Mark a task as skipped."""
        if task_id in self.tasks:
            self.tasks[task_id].status = TaskStatus.SKIPPED
            logger.info(f"[{self.job_id}] Task {task_id} skipped")

    def set_file_status(
        self,
        filename: str,
        status: TaskStatus,
        rows_loaded: int = 0,
        rows_skipped: int = 0,
    ) -> None:
        """Update a file's processing status."""
        if filename in self.file_statuses:
            self.file_statuses[filename].status = status
            self.file_statuses[filename].rows_loaded = rows_loaded
            self.file_statuses[filename].rows_skipped = rows_skipped
            logger.info(f"[{self.job_id}] File {filename}: {status}")

    def get_file_statuses_list(self) -> list[DataFileStatus]:
        """Get file statuses as ordered list (preserving original order)."""
        return [self.file_statuses[filename] for filename in self.data_files if filename in self.file_statuses]

    def request_cancel(self) -> None:
        """Request cancellation of the training job."""
        self._cancel_requested = True
        logger.info(f"[{self.job_id}] Cancellation requested")

    def cleanup_cache(self) -> None:
        """Clean up the cache directory."""
        if self.cache_dir.exists():
            try:
                shutil.rmtree(self.cache_dir)
                logger.info(f"[{self.job_id}] Cache directory cleaned up: {self.cache_dir}")
            except Exception as e:
                logger.warning(f"[{self.job_id}] Failed to clean up cache: {e}")

    @property
    def is_cancelled(self) -> bool:
        """Check if cancellation was requested."""
        return self._cancel_requested

    def get_tasks_list(self) -> list[TrainingTask]:
        """Get tasks as ordered list."""
        return [self.tasks[task_id] for task_id in TASK_IDS]

    def get_progress(self) -> TrainingProgress:
        """Get current progress information."""
        return TrainingProgress(
            status=self.status,
            progress=self.progress,
            current_step=self.current_step,
            total_steps=self.total_steps,
            device=self.device,
            error_code=self.error_code,
            tasks=self.get_tasks_list(),
            file_statuses=self.get_file_statuses_list(),
        )

    def get_effective_training_config(self, is_cuda: bool) -> dict:
        """Get effective training configuration with defaults applied."""
        config = self.training_config
        return {
            "num_train_epochs": (config.num_train_epochs if config and config.num_train_epochs is not None else DEFAULT_EPOCHS),
            "per_device_train_batch_size": (config.per_device_train_batch_size if config and config.per_device_train_batch_size is not None else (DEFAULT_BATCH_SIZE_CUDA if is_cuda else DEFAULT_BATCH_SIZE_CPU)),
            "gradient_accumulation_steps": (config.gradient_accumulation_steps if config and config.gradient_accumulation_steps is not None else DEFAULT_GRADIENT_ACCUMULATION),
            "learning_rate": (config.learning_rate if config and config.learning_rate is not None else (DEFAULT_LEARNING_RATE_CUDA if is_cuda else DEFAULT_LEARNING_RATE_CPU)),
            "warmup_ratio": (config.warmup_ratio if config and config.warmup_ratio is not None else (DEFAULT_WARMUP_RATIO_CUDA if is_cuda else DEFAULT_WARMUP_RATIO_CPU)),
            "max_length": (config.max_length if config and config.max_length is not None else DEFAULT_MAX_LENGTH),
            "fp16": (config.fp16 if config and config.fp16 is not None else is_cuda),
            "optim": (config.optim if config and config.optim is not None else (DEFAULT_OPTIM_CUDA if is_cuda else DEFAULT_OPTIM_CPU)),
            # Extended training parameters
            "weight_decay": (config.weight_decay if config and config.weight_decay is not None else DEFAULT_WEIGHT_DECAY),
            "max_grad_norm": (config.max_grad_norm if config and config.max_grad_norm is not None else DEFAULT_MAX_GRAD_NORM),
            "lr_scheduler_type": (config.lr_scheduler_type if config and config.lr_scheduler_type is not None else DEFAULT_LR_SCHEDULER_TYPE),
            "neftune_noise_alpha": (config.neftune_noise_alpha if config and config.neftune_noise_alpha is not None else DEFAULT_NEFTUNE_NOISE_ALPHA),
            "seed": (config.seed if config and config.seed is not None else DEFAULT_SEED),
            "bf16": (config.bf16 if config and config.bf16 is not None else False),
            "logging_steps": (config.logging_steps if config and config.logging_steps is not None else (DEFAULT_LOGGING_STEPS_CUDA if is_cuda else DEFAULT_LOGGING_STEPS_CPU)),
            "save_strategy": (config.save_strategy if config and config.save_strategy is not None else DEFAULT_SAVE_STRATEGY),
        }

    def get_effective_lora_config(self) -> dict:
        """Get effective LoRA configuration with defaults applied."""
        config = self.lora_config
        return {
            "r": (config.r if config and config.r is not None else DEFAULT_LORA_R),
            "lora_alpha": (config.lora_alpha if config and config.lora_alpha is not None else DEFAULT_LORA_ALPHA),
            "lora_dropout": (config.lora_dropout if config and config.lora_dropout is not None else DEFAULT_LORA_DROPOUT),
            "target_modules": (config.target_modules if config and config.target_modules is not None else DEFAULT_LORA_TARGET_MODULES),
            # Advanced LoRA parameters
            "bias": (config.bias if config and config.bias is not None else DEFAULT_LORA_BIAS),
            "use_rslora": (config.use_rslora if config and config.use_rslora is not None else DEFAULT_USE_RSLORA),
            "use_dora": (config.use_dora if config and config.use_dora is not None else DEFAULT_USE_DORA),
            "modules_to_save": (config.modules_to_save if config and config.modules_to_save else None),
        }

    def get_effective_quantization_config(self) -> dict:
        """Get effective quantization configuration with defaults applied."""
        config = self.quantization_config
        return {
            "load_in_4bit": (config.load_in_4bit if config and config.load_in_4bit is not None else DEFAULT_LOAD_IN_4BIT),
            "bnb_4bit_quant_type": (config.bnb_4bit_quant_type if config and config.bnb_4bit_quant_type is not None else DEFAULT_BNB_4BIT_QUANT_TYPE),
            "bnb_4bit_use_double_quant": (config.bnb_4bit_use_double_quant if config and config.bnb_4bit_use_double_quant is not None else DEFAULT_BNB_4BIT_USE_DOUBLE_QUANT),
            "bnb_4bit_compute_dtype": (config.bnb_4bit_compute_dtype if config and config.bnb_4bit_compute_dtype is not None else DEFAULT_BNB_4BIT_COMPUTE_DTYPE),
            "output_quantization": (config.output_quantization if config and config.output_quantization is not None else DEFAULT_OUTPUT_QUANTIZATION),
        }

    def get_effective_modelfile_config(self) -> dict:
        """Get effective Ollama Modelfile configuration with defaults applied."""
        config = self.modelfile_config
        return {
            "temperature": (config.temperature if config and config.temperature is not None else DEFAULT_TEMPERATURE),
            "top_p": (config.top_p if config and config.top_p is not None else DEFAULT_TOP_P),
            "top_k": (config.top_k if config and config.top_k is not None else DEFAULT_TOP_K),
            "stop": (config.stop if config and config.stop is not None else DEFAULT_STOP),
            "system": (config.system if config and config.system is not None else DEFAULT_SYSTEM),
            "repeat_penalty": (config.repeat_penalty if config and config.repeat_penalty is not None else DEFAULT_REPEAT_PENALTY),
            "repeat_last_n": (config.repeat_last_n if config and config.repeat_last_n is not None else DEFAULT_REPEAT_LAST_N),
            "num_ctx": (config.num_ctx if config and config.num_ctx is not None else DEFAULT_NUM_CTX),
        }


class TrainingService:
    """Service for managing training jobs."""

    ACTIVE_STATUSES = [
        TrainingStatus.STARTING,
        TrainingStatus.LOADING_DATA,
        TrainingStatus.LOADING_MODEL,
        TrainingStatus.TRAINING,
        TrainingStatus.EXPORTING,
        TrainingStatus.CONVERTING,
    ]

    def __init__(self):
        self._jobs: dict[str, TrainingJob] = {}  # project_slug -> job
        self._lock = threading.RLock()  # Reentrant lock to avoid deadlock

    def get_job(self, project_slug: str) -> TrainingJob | None:
        """Get the current job for a project."""
        with self._lock:
            return self._jobs.get(project_slug)

    def is_running(self, project_slug: str) -> bool:
        """Check if a training job is running for a project."""
        with self._lock:
            job = self._jobs.get(project_slug)
            if job is None:
                return False
            return job.status in self.ACTIVE_STATUSES

    def start_training(
        self,
        job_id: str,
        project_slug: str,
        project_path: Path,
        model_name: str,
        data_files: list[str],
        quantization: str,
        training_config: TrainingConfig | None = None,
        lora_config: ProjectLoraConfig | None = None,
        quantization_config: QuantizationConfig | None = None,
        modelfile_config: ModelfileConfig | None = None,
    ) -> TrainingJob:
        """Start a new training job. Returns immediately with job in IDLE status."""
        logger.info(f"start_training called: job_id={job_id}, project={project_slug}, model={model_name}")
        logger.info(f"  project_path={project_path}, data_files={data_files}, quantization={quantization}")

        with self._lock:
            if self.is_running(project_slug):
                logger.warning(f"Training already running for {project_slug}")
                raise ValueError("Training already running for this project")

            # Create job with IDLE status - it will be updated when thread starts
            job = TrainingJob(
                job_id=job_id,
                project_slug=project_slug,
                project_path=project_path,
                model_name=model_name,
                data_files=data_files,
                quantization=quantization,
                training_config=training_config,
                lora_config=lora_config,
                quantization_config=quantization_config,
                modelfile_config=modelfile_config,
            )
            self._jobs[project_slug] = job
            logger.info(f"Created TrainingJob: {job_id} (status: IDLE)")

        # Start training in background thread OUTSIDE the lock
        job._thread = threading.Thread(
            target=self._run_training,
            args=(job,),
            daemon=True,
        )
        logger.info(f"Starting background thread for job {job_id}")
        job._thread.start()
        logger.info(f"Background thread started for job {job_id}")

        # Return immediately - job starts async in background
        return job

    def cancel_training(self, project_slug: str) -> bool:
        """Cancel a running training job."""
        job = self.get_job(project_slug)
        if job is None or not self.is_running(project_slug):
            return False
        job.request_cancel()
        return True

    def _run_training(self, job: TrainingJob) -> None:
        """Run the training process (in background thread)."""
        logger.info(f"_run_training started for job {job.job_id}")
        try:
            job.status = TrainingStatus.STARTING
            logger.info(f"Job {job.job_id} status set to STARTING")

            # Task 1: Detect device
            job.set_task_status("detect_device", TaskStatus.IN_PROGRESS)
            device = self._detect_device(job)
            if job.is_cancelled:
                self._handle_cancellation(job)
                return
            job.complete_task("detect_device")

            # Task 2: Import ML libraries
            job.status = TrainingStatus.LOADING_DATA
            job.set_task_status("import_libraries", TaskStatus.IN_PROGRESS)
            try:
                import torch
                from datasets import Dataset
                from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
                from transformers import (
                    AutoModelForCausalLM,
                    AutoTokenizer,
                    BitsAndBytesConfig,
                    DataCollatorForLanguageModeling,
                    Trainer,
                    TrainerCallback,
                    TrainingArguments,
                )
            except ImportError as e:
                job.fail_task("import_libraries")
                job.error_code = ErrorCode.TRAINING_MODEL_LOAD_FAILED
                job.status = TrainingStatus.FAILED
                logger.error(f"Failed to import ML libraries: {e}")
                return

            if job.is_cancelled:
                self._handle_cancellation(job)
                return
            job.complete_task("import_libraries")

            # Task 4: Load model
            job.status = TrainingStatus.LOADING_MODEL
            job.set_task_status("load_model", TaskStatus.IN_PROGRESS)

            try:
                model, tokenizer = self._load_model(job, device, torch, AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, prepare_model_for_kbit_training)
            except Exception as e:
                job.fail_task("load_model")
                job.error_code = ErrorCode.TRAINING_MODEL_LOAD_FAILED
                job.status = TrainingStatus.FAILED
                logger.error(f"Failed to load model: {e}")
                return

            if job.is_cancelled:
                self._handle_cancellation(job)
                return
            job.complete_task("load_model")

            # Task 5: Setup LoRA
            job.set_task_status("setup_lora", TaskStatus.IN_PROGRESS)
            try:
                model = self._setup_lora(job, model, LoraConfig, get_peft_model)
            except Exception as e:
                job.fail_task("setup_lora")
                job.error_code = ErrorCode.TRAINING_FAILED
                job.status = TrainingStatus.FAILED
                logger.error(f"Failed to setup LoRA: {e}")
                return

            if job.is_cancelled:
                self._handle_cancellation(job)
                return
            job.complete_task("setup_lora")

            # Task 6: Tokenize dataset (streams data from files, memory-efficient)
            job.set_task_status("tokenize", TaskStatus.IN_PROGRESS)
            try:
                dataset = self._tokenize_dataset(job, tokenizer, Dataset)
            except Exception as e:
                job.fail_task("tokenize")
                job.error_code = ErrorCode.TRAINING_FAILED
                job.status = TrainingStatus.FAILED
                logger.error(f"Failed to tokenize dataset: {e}")
                job.cleanup_cache()
                return

            if job.is_cancelled:
                self._handle_cancellation(job)
                return
            job.complete_task("tokenize")

            # Task 7: Training
            job.status = TrainingStatus.TRAINING
            job.set_task_status("train", TaskStatus.IN_PROGRESS)

            try:
                output_path = self._train(
                    job,
                    model,
                    tokenizer,
                    dataset,
                    device,
                    torch,
                    TrainingArguments,
                    Trainer,
                    DataCollatorForLanguageModeling,
                    TrainerCallback,
                )
            except Exception as e:
                if job.is_cancelled:
                    self._handle_cancellation(job)
                    return
                job.fail_task("train")
                job.error_code = ErrorCode.TRAINING_FAILED
                job.status = TrainingStatus.FAILED
                logger.error(f"Training failed: {e}")
                job.cleanup_cache()
                return

            if job.is_cancelled:
                self._handle_cancellation(job)
                return
            job.complete_task("train")

            # Task 8: Export (merge LoRA)
            job.status = TrainingStatus.EXPORTING
            job.set_task_status("merge_lora", TaskStatus.IN_PROGRESS)

            try:
                merged_path, output_dir = self._merge_lora(job, output_path, torch)
            except Exception as e:
                job.fail_task("merge_lora")
                job.error_code = ErrorCode.TRAINING_EXPORT_FAILED
                job.status = TrainingStatus.FAILED
                logger.error(f"Export failed: {e}")
                job.cleanup_cache()
                return

            if job.is_cancelled:
                self._handle_cancellation(job)
                return
            job.complete_task("merge_lora")

            # Task 9: Convert to GGUF
            job.status = TrainingStatus.CONVERTING
            job.set_task_status("convert_gguf", TaskStatus.IN_PROGRESS)

            try:
                self._convert_to_gguf(job, merged_path, output_dir)
            except FileNotFoundError as e:
                job.fail_task("convert_gguf")
                job.error_code = ErrorCode.TRAINING_LLAMA_CPP_NOT_FOUND
                job.status = TrainingStatus.FAILED
                logger.error(f"llama.cpp not found: {e}")
                job.cleanup_cache()
                return
            except RuntimeError as e:
                job.fail_task("convert_gguf")
                job.error_code = ErrorCode.TRAINING_EXPORT_FAILED
                job.status = TrainingStatus.FAILED
                logger.error(f"GGUF conversion failed: {e}")
                job.cleanup_cache()
                return

            if job.is_cancelled:
                self._handle_cancellation(job)
                return
            job.complete_task("convert_gguf")

            # Task 10: Create Modelfile
            job.set_task_status("create_modelfile", TaskStatus.IN_PROGRESS)
            self._create_modelfile(job, output_dir)
            job.complete_task("create_modelfile")

            # Done
            job.status = TrainingStatus.COMPLETED
            job.progress = 100.0
            logger.info(f"Job {job.job_id} completed successfully")

            # Clean up cache after successful completion
            job.cleanup_cache()

        except Exception as e:
            logger.error(f"Unexpected error in job {job.job_id}: {e}")
            logger.error(traceback.format_exc())
            job.error_code = ErrorCode.TRAINING_FAILED
            job.status = TrainingStatus.FAILED
            # Clean up cache after failure
            job.cleanup_cache()

    def _detect_device(self, job: TrainingJob) -> str:
        """Detect the best available compute device."""
        try:
            import torch

            if torch.cuda.is_available():
                device = "cuda"
                job.device = DeviceType.CUDA
                logger.info(f"[{job.job_id}] GPU detected: {torch.cuda.get_device_name(0)}")
            elif torch.backends.mps.is_available():
                device = "mps"
                job.device = DeviceType.MPS
                logger.info(f"[{job.job_id}] Apple Silicon GPU (MPS) detected")
            else:
                device = "cpu"
                job.device = DeviceType.CPU
                logger.info(f"[{job.job_id}] No GPU found, using CPU")

            return device
        except ImportError:
            job.device = DeviceType.CPU
            return "cpu"

    def _validate_training_row(self, data: dict) -> bool:
        """Validate that a row has the required schema for training."""
        if "instruction" not in data or "output" not in data:
            return False
        if not isinstance(data["instruction"], str) or not isinstance(data["output"], str):
            return False
        return True

    def _create_data_generator(self, job: TrainingJob, error_tracker: dict):
        """
        Generator that yields training examples from JSONL files.
        This is memory-efficient as it streams data instead of loading all at once.
        Updates file status and tracks errors in error_tracker dict.
        """
        data_dir = job.project_path / "data"
        total_files = len(job.data_files)

        # Small delay to ensure WebSocket can show initial PENDING states
        time.sleep(0.5)

        for idx, filename in enumerate(job.data_files):
            file_path = data_dir / filename

            # Mark file as in progress
            job.set_file_status(filename, TaskStatus.IN_PROGRESS)

            if not file_path.exists():
                job.set_file_status(filename, TaskStatus.FAILED)
                error_tracker["total"] += 1
                logger.error(f"[{job.job_id}] File not found: {filename}")
                continue

            logger.info(f"[{job.job_id}] Processing: {filename}")
            skipped_in_file = 0
            loaded_in_file = 0
            line_number = 0

            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line_number += 1
                    stripped = line.strip()

                    # Skip empty lines silently
                    if not stripped:
                        continue

                    # Try to parse JSON
                    try:
                        data = json.loads(stripped)
                    except json.JSONDecodeError as e:
                        logger.warning(
                            f"[{job.job_id}] {filename}:{line_number} - Invalid JSON: {e}"
                        )
                        skipped_in_file += 1
                        error_tracker["total"] += 1
                        job.increment_task_error_count("tokenize")
                        continue

                    # Validate schema
                    if not isinstance(data, dict):
                        logger.warning(
                            f"[{job.job_id}] {filename}:{line_number} - Not a JSON object"
                        )
                        skipped_in_file += 1
                        error_tracker["total"] += 1
                        job.increment_task_error_count("tokenize")
                        continue

                    if not self._validate_training_row(data):
                        logger.warning(
                            f"[{job.job_id}] {filename}:{line_number} - Invalid schema"
                        )
                        skipped_in_file += 1
                        error_tracker["total"] += 1
                        job.increment_task_error_count("tokenize")
                        continue

                    loaded_in_file += 1
                    yield data

            # Mark file as completed with stats
            job.set_file_status(
                filename,
                TaskStatus.COMPLETED,
                rows_loaded=loaded_in_file,
                rows_skipped=skipped_in_file,
            )

            # Update task progress based on files processed
            job.set_task_progress("tokenize", int(((idx + 1) / total_files) * 50))

            if skipped_in_file > 0:
                logger.warning(
                    f"[{job.job_id}] {filename}: Skipped {skipped_in_file} invalid rows"
                )

            # Small delay between files to allow WebSocket to show progression
            if idx < total_files - 1:
                time.sleep(0.3)

            logger.info(f"[{job.job_id}] {filename}: Loaded {loaded_in_file} rows")

    def _load_model(self, job, device, torch, AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, prepare_model_for_kbit_training):
        """Load model and tokenizer. Uses HF_TOKEN from environment if set."""
        job.set_task_progress("load_model", 10)

        tokenizer = AutoTokenizer.from_pretrained(job.model_name)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        job.set_task_progress("load_model", 30)

        if device == "cuda":
            # Get effective quantization config
            quant_cfg = job.get_effective_quantization_config()
            load_in_4bit = quant_cfg["load_in_4bit"]

            if load_in_4bit:
                # Map string dtype to torch dtype
                dtype_map = {
                    "float16": torch.float16,
                    "bfloat16": torch.bfloat16,
                    "float32": torch.float32,
                }
                compute_dtype = dtype_map.get(quant_cfg["bnb_4bit_compute_dtype"], torch.float16)

                logger.info(f"[{job.job_id}] Loading with 4-bit quantization (QLoRA)")
                logger.info(f"[{job.job_id}] Quantization config: type={quant_cfg['bnb_4bit_quant_type']}, double_quant={quant_cfg['bnb_4bit_use_double_quant']}, compute_dtype={quant_cfg['bnb_4bit_compute_dtype']}")
                bnb_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_quant_type=quant_cfg["bnb_4bit_quant_type"],
                    bnb_4bit_compute_dtype=compute_dtype,
                    bnb_4bit_use_double_quant=quant_cfg["bnb_4bit_use_double_quant"],
                )
                model = AutoModelForCausalLM.from_pretrained(
                    job.model_name,
                    quantization_config=bnb_config,
                    device_map="auto",
                    trust_remote_code=True,
                )
                model = prepare_model_for_kbit_training(model)
            else:
                logger.info(f"[{job.job_id}] Loading without 4-bit quantization (CUDA)")
                model = AutoModelForCausalLM.from_pretrained(
                    job.model_name,
                    torch_dtype=torch.float16,
                    device_map="auto",
                    trust_remote_code=True,
                )
        else:
            logger.info(f"[{job.job_id}] Loading without quantization")
            model = AutoModelForCausalLM.from_pretrained(
                job.model_name,
                torch_dtype=torch.float32 if device == "cpu" else torch.float16,
                device_map={"": device} if device == "mps" else None,
                trust_remote_code=True,
            )
            if device == "cpu":
                model = model.to(device)

        job.set_task_progress("load_model", 90)
        logger.info(f"[{job.job_id}] Model loaded successfully")
        return model, tokenizer

    def _setup_lora(self, job: TrainingJob, model, LoraConfig, get_peft_model):
        """Setup LoRA for efficient training."""
        # Get effective LoRA config with project overrides
        lora_cfg = job.get_effective_lora_config()

        logger.info(f"[{job.job_id}] LoRA config: r={lora_cfg['r']}, alpha={lora_cfg['lora_alpha']}, dropout={lora_cfg['lora_dropout']}")
        logger.info(f"[{job.job_id}] LoRA target modules: {lora_cfg['target_modules']}")
        logger.info(f"[{job.job_id}] LoRA advanced: bias={lora_cfg['bias']}, use_rslora={lora_cfg['use_rslora']}, use_dora={lora_cfg['use_dora']}")
        if lora_cfg["modules_to_save"]:
            logger.info(f"[{job.job_id}] LoRA modules_to_save: {lora_cfg['modules_to_save']}")

        # Build LoRA config with required parameters
        lora_config_params = {
            "r": lora_cfg["r"],
            "lora_alpha": lora_cfg["lora_alpha"],
            "target_modules": lora_cfg["target_modules"],
            "lora_dropout": lora_cfg["lora_dropout"],
            "bias": lora_cfg["bias"],
            "task_type": "CAUSAL_LM",
        }

        # Add optional advanced parameters
        if lora_cfg["use_rslora"]:
            lora_config_params["use_rslora"] = True
        if lora_cfg["use_dora"]:
            lora_config_params["use_dora"] = True
        if lora_cfg["modules_to_save"]:
            lora_config_params["modules_to_save"] = lora_cfg["modules_to_save"]

        lora_config = LoraConfig(**lora_config_params)
        return get_peft_model(model, lora_config)

    def _format_training_example(self, example: dict) -> str:
        """Format a training example."""
        instruction = example.get("instruction", "")
        output = example.get("output", "")
        return f"### Question:\n{instruction}\n\n### Answer:\n{output}"

    def _tokenize_dataset(self, job: TrainingJob, tokenizer, Dataset):
        """Load and tokenize training data with file status updates.

        Uses disk caching to avoid keeping the entire tokenized dataset in memory.
        """
        data_dir = job.project_path / "data"
        total_files = len(job.data_files)
        all_texts = []

        # Ensure cache directory exists
        job.cache_dir.mkdir(parents=True, exist_ok=True)
        cache_file = job.cache_dir / "tokenized_dataset.arrow"
        logger.info(f"[{job.job_id}] Using disk cache: {job.cache_dir}")

        # Small delay to ensure WebSocket can show initial PENDING states
        time.sleep(0.5)

        # Process each file with status updates
        for idx, filename in enumerate(job.data_files):
            file_path = data_dir / filename

            # Mark file as in progress
            job.set_file_status(filename, TaskStatus.IN_PROGRESS)

            if not file_path.exists():
                job.set_file_status(filename, TaskStatus.FAILED)
                job.increment_task_error_count("tokenize")
                logger.error(f"[{job.job_id}] File not found: {filename}")
                continue

            logger.info(f"[{job.job_id}] Processing: {filename}")
            skipped_in_file = 0
            loaded_in_file = 0
            line_number = 0

            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line_number += 1
                    stripped = line.strip()

                    # Skip empty lines silently
                    if not stripped:
                        continue

                    # Try to parse JSON
                    try:
                        data = json.loads(stripped)
                    except json.JSONDecodeError as e:
                        logger.warning(f"[{job.job_id}] {filename}:{line_number} - Invalid JSON: {e}")
                        skipped_in_file += 1
                        job.increment_task_error_count("tokenize")
                        continue

                    # Validate schema
                    if not isinstance(data, dict):
                        logger.warning(f"[{job.job_id}] {filename}:{line_number} - Not a JSON object")
                        skipped_in_file += 1
                        job.increment_task_error_count("tokenize")
                        continue

                    if not self._validate_training_row(data):
                        logger.warning(f"[{job.job_id}] {filename}:{line_number} - Invalid schema")
                        skipped_in_file += 1
                        job.increment_task_error_count("tokenize")
                        continue

                    # Format and add to list
                    all_texts.append(self._format_training_example(data))
                    loaded_in_file += 1

            # Mark file as completed
            job.set_file_status(
                filename,
                TaskStatus.COMPLETED,
                rows_loaded=loaded_in_file,
                rows_skipped=skipped_in_file,
            )

            # Update progress (0-50% for file loading)
            job.set_task_progress("tokenize", int(((idx + 1) / total_files) * 50))

            if skipped_in_file > 0:
                logger.warning(f"[{job.job_id}] {filename}: Skipped {skipped_in_file} invalid rows")

            logger.info(f"[{job.job_id}] {filename}: Loaded {loaded_in_file} rows")

            # Delay between files to allow WebSocket to show progression
            if idx < total_files - 1:
                time.sleep(0.4)

        logger.info(f"[{job.job_id}] Total: {len(all_texts)} training examples")

        # Now tokenize (50-100% progress)
        # Using disk cache to avoid keeping tokenized data in memory
        job.set_task_progress("tokenize", 60)

        # Get max_length from training config
        is_cuda = job.device == DeviceType.CUDA
        training_cfg = job.get_effective_training_config(is_cuda)
        max_length = training_cfg["max_length"]
        logger.info(f"[{job.job_id}] Using max_length={max_length} for tokenization")

        def tokenize_function(examples):
            return tokenizer(
                examples["text"],
                truncation=True,
                max_length=max_length,
                padding="max_length",
            )

        dataset = Dataset.from_dict({"text": all_texts})
        # Clear all_texts to free memory before tokenization
        del all_texts
        job.set_task_progress("tokenize", 70)

        # Tokenize and cache to disk (keep_in_memory=False stores result on disk)
        result = dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=["text"],
            cache_file_name=str(cache_file),
            keep_in_memory=False,
        )
        job.set_task_progress("tokenize", 100)

        logger.info(f"[{job.job_id}] Tokenized dataset cached to disk: {cache_file}")
        return result

    def _train(self, job, model, tokenizer, dataset, device, torch, TrainingArguments, Trainer, DataCollatorForLanguageModeling, TrainerCallback):
        """Run the training loop."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = job.project_path / "output" / f"run_{timestamp}"

        # Create callback for progress updates
        class ProgressCallback(TrainerCallback):
            def __init__(self, training_job: TrainingJob):
                self.job = training_job

            def on_train_begin(self, args, state, control, **kwargs):
                self.job.total_steps = state.max_steps
                logger.info(f"[{self.job.job_id}] Total training steps: {state.max_steps}")

            def on_step_end(self, args, state, control, **kwargs):
                self.job.current_step = state.global_step
                progress = int((state.global_step / state.max_steps) * 100)
                self.job.set_task_progress("train", progress)

                # Check for cancellation
                if self.job.is_cancelled:
                    control.should_training_stop = True

            def on_epoch_end(self, args, state, control, **kwargs):
                logger.info(f"[{self.job.job_id}] Epoch {int(state.epoch)} completed")

        # Get effective training config with project overrides
        is_cuda = device == "cuda"
        train_cfg = job.get_effective_training_config(is_cuda)

        logger.info(f"[{job.job_id}] Training config: epochs={train_cfg['num_train_epochs']}, batch_size={train_cfg['per_device_train_batch_size']}")
        logger.info(f"[{job.job_id}] Training config: lr={train_cfg['learning_rate']}, warmup={train_cfg['warmup_ratio']}, optim={train_cfg['optim']}")
        logger.info(f"[{job.job_id}] Training config: fp16={train_cfg['fp16']}, bf16={train_cfg['bf16']}, grad_accum={train_cfg['gradient_accumulation_steps']}")
        logger.info(f"[{job.job_id}] Training config: weight_decay={train_cfg['weight_decay']}, max_grad_norm={train_cfg['max_grad_norm']}, seed={train_cfg['seed']}")
        logger.info(f"[{job.job_id}] Training config: lr_scheduler={train_cfg['lr_scheduler_type']}, logging_steps={train_cfg['logging_steps']}, save_strategy={train_cfg['save_strategy']}")
        if train_cfg["neftune_noise_alpha"] > 0:
            logger.info(f"[{job.job_id}] Training config: neftune_noise_alpha={train_cfg['neftune_noise_alpha']}")

        # Handle fp16/bf16 mutual exclusivity - bf16 takes precedence if enabled
        use_fp16 = train_cfg["fp16"] and not train_cfg["bf16"]
        use_bf16 = train_cfg["bf16"]

        # Build training arguments dict
        training_args_dict = {
            "output_dir": str(output_dir),
            "num_train_epochs": train_cfg["num_train_epochs"],
            "per_device_train_batch_size": train_cfg["per_device_train_batch_size"],
            "gradient_accumulation_steps": train_cfg["gradient_accumulation_steps"],
            "learning_rate": train_cfg["learning_rate"],
            "fp16": use_fp16,
            "bf16": use_bf16,
            "logging_steps": train_cfg["logging_steps"],
            "save_strategy": train_cfg["save_strategy"],
            "warmup_ratio": train_cfg["warmup_ratio"],
            "optim": train_cfg["optim"],
            "weight_decay": train_cfg["weight_decay"],
            "max_grad_norm": train_cfg["max_grad_norm"],
            "lr_scheduler_type": train_cfg["lr_scheduler_type"],
            "seed": train_cfg["seed"],
            "report_to": [],
        }

        # Add neftune_noise_alpha only when enabled (> 0)
        if train_cfg["neftune_noise_alpha"] > 0:
            training_args_dict["neftune_noise_alpha"] = train_cfg["neftune_noise_alpha"]

        # Training arguments based on device with project overrides
        training_args = TrainingArguments(**training_args_dict)

        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False,
        )

        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=dataset,
            data_collator=data_collator,
            callbacks=[ProgressCallback(job)],
        )

        trainer.train()

        if job.is_cancelled:
            raise InterruptedError("Training cancelled")

        # Save model
        final_model_path = output_dir / "final_model"
        model.save_pretrained(str(final_model_path))
        tokenizer.save_pretrained(str(final_model_path))
        logger.info(f"[{job.job_id}] Model saved to: {final_model_path}")

        return final_model_path

    def _merge_lora(self, job: TrainingJob, adapter_path: Path, torch) -> tuple[Path, Path]:
        """Merge LoRA adapter with base model. Uses HF_TOKEN from environment if set."""
        from peft import PeftModel
        from transformers import AutoModelForCausalLM, AutoTokenizer

        job.set_task_progress("merge_lora", 10)

        output_dir = job.project_path / "output" / "ollama"
        output_dir.mkdir(parents=True, exist_ok=True)

        # Load base model (uses HF_TOKEN from environment automatically)
        logger.info(f"[{job.job_id}] Loading base model for merge: {job.model_name}")
        base_model = AutoModelForCausalLM.from_pretrained(
            job.model_name,
            torch_dtype=torch.float16,
            device_map="cpu",
            trust_remote_code=True,
        )
        tokenizer = AutoTokenizer.from_pretrained(job.model_name)

        job.set_task_progress("merge_lora", 40)

        # Load and merge adapter
        logger.info(f"[{job.job_id}] Loading LoRA adapter")
        model = PeftModel.from_pretrained(base_model, str(adapter_path))

        job.set_task_progress("merge_lora", 60)

        logger.info(f"[{job.job_id}] Merging LoRA with base model")
        model = model.merge_and_unload()

        job.set_task_progress("merge_lora", 80)

        # Save merged model
        merged_path = output_dir / "merged_model"
        logger.info(f"[{job.job_id}] Saving merged model to: {merged_path}")
        model.save_pretrained(str(merged_path), safe_serialization=True)
        tokenizer.save_pretrained(str(merged_path))

        return merged_path, output_dir

    def _get_llama_cpp_dir(self) -> Path:
        """Get the llama.cpp directory (relative to project root)."""
        # API is in /workspace/api, llama.cpp is in /workspace/.llama.cpp
        api_dir = Path(__file__).parent.parent  # /workspace/api
        project_root = api_dir.parent  # /workspace
        return project_root / ".llama.cpp"

    def _convert_to_gguf(self, job: TrainingJob, model_path: Path, output_dir: Path) -> None:
        """Convert HuggingFace model to GGUF. Raises exception on failure."""
        # Primary location: .llama.cpp in project root
        llama_cpp_dir = self._get_llama_cpp_dir()
        convert_script = llama_cpp_dir / "convert_hf_to_gguf.py"

        if not convert_script.exists():
            # Fallback locations
            fallback_paths = [
                Path.home() / "llama.cpp" / "convert_hf_to_gguf.py",
                Path.home() / ".llama.cpp" / "convert_hf_to_gguf.py",
            ]
            for path in fallback_paths:
                if path.exists():
                    convert_script = path
                    break

        if not convert_script.exists():
            logger.error(f"[{job.job_id}] llama.cpp not found at {llama_cpp_dir}")
            raise FileNotFoundError(f"llama.cpp not found. Expected at: {llama_cpp_dir}")

        job.set_task_progress("convert_gguf", 20)

        # Determine version number
        existing = [f for f in output_dir.iterdir() if f.name.startswith("model_v") and f.suffix == ".gguf"]
        version = 1
        if existing:
            versions = []
            for f in existing:
                try:
                    v = int(f.stem.replace("model_v", ""))
                    versions.append(v)
                except ValueError:
                    pass
            if versions:
                version = max(versions) + 1

        gguf_path = output_dir / f"model_v{version}.gguf"

        # Get output quantization from config (with fallback to request value)
        quant_cfg = job.get_effective_quantization_config()
        output_quant = quant_cfg["output_quantization"]
        # If quantization was explicitly set in request and differs from default, prefer request value
        if job.quantization and job.quantization != DEFAULT_OUTPUT_QUANTIZATION:
            output_quant = job.quantization

        logger.info(f"[{job.job_id}] Converting to GGUF: {convert_script}")
        logger.info(f"[{job.job_id}] Output quantization: {output_quant}")
        cmd = [
            sys.executable,
            str(convert_script),
            str(model_path),
            "--outfile",
            str(gguf_path),
            "--outtype",
            output_quant,
        ]

        job.set_task_progress("convert_gguf", 50)

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"[{job.job_id}] GGUF file created: {gguf_path}")
        except subprocess.CalledProcessError as e:
            logger.error(f"[{job.job_id}] GGUF conversion failed: {e.stderr}")
            raise RuntimeError(f"GGUF conversion failed: {e.stderr}")

    def _create_modelfile(self, job: TrainingJob, output_dir: Path) -> None:
        """Create Ollama Modelfile."""
        # Find GGUF file
        gguf_files = list(output_dir.glob("model_v*.gguf"))
        if gguf_files:
            gguf_path = max(gguf_files, key=lambda p: p.stat().st_mtime)
        else:
            gguf_path = output_dir / "model_v1.gguf"

        # Get effective modelfile configuration
        mf_cfg = job.get_effective_modelfile_config()
        logger.info(f"[{job.job_id}] Modelfile config: temperature={mf_cfg['temperature']}, top_p={mf_cfg['top_p']}, top_k={mf_cfg['top_k']}")
        logger.info(f"[{job.job_id}] Modelfile config: repeat_penalty={mf_cfg['repeat_penalty']}, repeat_last_n={mf_cfg['repeat_last_n']}, num_ctx={mf_cfg['num_ctx']}")

        # Build stop sequences
        stop_params = "\n".join([f'PARAMETER stop "{s}"' for s in mf_cfg["stop"]])

        modelfile_content = f"""# Modelfile for Ollama
# Created: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
# Project: {job.project_slug}

FROM {gguf_path.resolve()}

# Template for question-answer format
TEMPLATE \"\"\"### Question:
{{{{ .Prompt }}}}

### Answer:
\"\"\"

# Parameters
PARAMETER temperature {mf_cfg["temperature"]}
PARAMETER top_p {mf_cfg["top_p"]}
PARAMETER top_k {mf_cfg["top_k"]}
PARAMETER repeat_penalty {mf_cfg["repeat_penalty"]}
PARAMETER repeat_last_n {mf_cfg["repeat_last_n"]}
PARAMETER num_ctx {mf_cfg["num_ctx"]}
{stop_params}

# System prompt
SYSTEM {mf_cfg["system"]}
"""

        modelfile_path = output_dir / "Modelfile"
        with open(modelfile_path, "w") as f:
            f.write(modelfile_content)

        logger.info(f"[{job.job_id}] Modelfile created: {modelfile_path}")

    def _handle_cancellation(self, job: TrainingJob) -> None:
        """Handle job cancellation."""
        # Mark all in-progress tasks as skipped (cancelled)
        # Mark all pending tasks as skipped
        for task_id in TASK_IDS:
            task = job.tasks.get(task_id)
            if task and task.status in [TaskStatus.IN_PROGRESS, TaskStatus.PENDING]:
                job.skip_task(task_id)
                logger.info(f"[{job.job_id}] Task {task_id} skipped due to cancellation")

        # Mark all pending/in-progress files as skipped
        for filename in job.data_files:
            file_status = job.file_statuses.get(filename)
            if file_status and file_status.status in [TaskStatus.IN_PROGRESS, TaskStatus.PENDING]:
                job.set_file_status(filename, TaskStatus.SKIPPED)
                logger.info(f"[{job.job_id}] File {filename} skipped due to cancellation")

        job.status = TrainingStatus.CANCELLED
        job.error_code = ErrorCode.TRAINING_CANCELLED
        logger.info(f"[{job.job_id}] Training cancelled")

        # Clean up cache after cancellation
        job.cleanup_cache()


# Global instance
training_manager = TrainingService()
