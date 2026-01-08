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

export interface PresetTrainingConfig {
  num_train_epochs: number | null;
  per_device_train_batch_size: number | null;
  gradient_accumulation_steps: number | null;
  learning_rate: number | null;
  warmup_ratio: number | null;
  max_length: number | null;
  weight_decay: number | null;
  max_grad_norm: number | null;
  lr_scheduler_type: string | null;
  neftune_noise_alpha: number | null;
}

export interface PresetLoraConfig {
  r: number | null;
  lora_alpha: number | null;
  lora_dropout: number | null;
  target_modules: string[] | null;
  bias: string | null;
  use_rslora: boolean | null;
  use_dora: boolean | null;
  modules_to_save: string[] | null;
}

export interface PresetQuantizationConfig {
  load_in_4bit: boolean | null;
  bnb_4bit_quant_type: string | null;
  bnb_4bit_use_double_quant: boolean | null;
  output_quantization: string | null;
}

export interface TrainingPreset {
  id: string;
  name_key: string;
  description_key: string;
  pros: string[];
  cons: string[];
  recommended_models: string[];
  training_config: PresetTrainingConfig;
  lora_config: PresetLoraConfig;
  quantization_config: PresetQuantizationConfig;
}
