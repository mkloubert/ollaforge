// OllaForge - A web application that simplifies training LLMs with your own data for use in Ollama.
// Copyright (C) 2026  Marcel Joachim Kloubert (marcel@kloubert.dev)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

export type TrainingStatus =
  | "idle"
  | "starting"
  | "loading_data"
  | "loading_model"
  | "training"
  | "exporting"
  | "converting"
  | "completed"
  | "failed"
  | "cancelled";

export type DeviceType = "cuda" | "mps" | "cpu";

export type TaskStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";

export type TaskId =
  | "detect_device"
  | "import_libraries"
  | "load_model"
  | "setup_lora"
  | "tokenize"
  | "train"
  | "merge_lora"
  | "convert_gguf"
  | "create_modelfile";

export interface TrainingTask {
  task_id: TaskId;
  status: TaskStatus;
  progress: number;
  error_count: number;
}

export interface DataFileStatus {
  filename: string;
  status: TaskStatus;
  rows_loaded: number;
  rows_skipped: number;
}

export interface TrainingProgress {
  status: TrainingStatus;
  progress: number;
  current_step: number;
  total_steps: number;
  device: DeviceType | null;
  error_code: string | null;
  tasks: TrainingTask[];
  file_statuses: DataFileStatus[];
}

export interface TrainingLogEntry {
  timestamp: string;
  message: string;
}

export interface StartTrainingRequest {
  model_name: string;
  data_files: string[];
  quantization?: string;
}

export interface StartTrainingResponse {
  job_id: string;
  status: TrainingStatus;
}

export interface TrainingStatusResponse {
  job_id: string | null;
  status: TrainingStatus;
  progress: TrainingProgress;
  can_start: boolean;
}
