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

export interface TrainingConfig {
  num_train_epochs?: number | null;
  per_device_train_batch_size?: number | null;
  gradient_accumulation_steps?: number | null;
  learning_rate?: number | null;
  warmup_ratio?: number | null;
  max_length?: number | null;
  fp16?: boolean | null;
  optim?: string | null;
}

export interface LoraConfig {
  r?: number | null;
  lora_alpha?: number | null;
  lora_dropout?: number | null;
  target_modules?: string[] | null;
}

export interface QuantizationConfig {
  load_in_4bit?: boolean | null;
  bnb_4bit_quant_type?: string | null;
  bnb_4bit_use_double_quant?: boolean | null;
  output_quantization?: string | null;
}

export interface Project {
  slug: string;
  name: string;
  description?: string | null;
  model?: string | null;
  target_name?: string | null;
  path: string;
  training_config?: TrainingConfig | null;
  lora_config?: LoraConfig | null;
  quantization_config?: QuantizationConfig | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string | null;
}

export interface CreateProjectResponse {
  slug: string;
  name: string;
  description?: string | null;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string | null;
  model?: string | null;
  target_name?: string | null;
  training_config?: TrainingConfig | null;
  lora_config?: LoraConfig | null;
  quantization_config?: QuantizationConfig | null;
}

export interface UpdateProjectResponse {
  slug: string;
  name: string;
  description?: string | null;
  model?: string | null;
  target_name?: string | null;
  training_config?: TrainingConfig | null;
  lora_config?: LoraConfig | null;
  quantization_config?: QuantizationConfig | null;
}

export interface ApiErrorResponse {
  detail: {
    error_code: string;
  };
}
