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

export interface OllamaModel {
  name: string;
  size: string | null;
  modified_at: string | null;
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

export interface OllamaCreateRequest {
  target_name?: string | null;
}

export interface OllamaCreateResponse {
  success: boolean;
  model_name: string;
}

export interface OllamaRunResponse {
  success: boolean;
  model_name: string;
}

export interface OllamaModelExistsResponse {
  exists: boolean;
  model_name: string;
}
