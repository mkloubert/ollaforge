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

import axios from "axios";

import type {
  OllamaModelExistsResponse,
  OllamaModelsResponse,
  OllamaRunResponse,
} from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:23979";

export async function listOllamaModels(): Promise<OllamaModelsResponse> {
  const response = await axios.get<OllamaModelsResponse>(
    `${API_BASE}/api/ollama/models`
  );
  return response.data;
}

export async function checkModelExistsInOllama(
  slug: string
): Promise<OllamaModelExistsResponse> {
  const response = await axios.get<OllamaModelExistsResponse>(
    `${API_BASE}/api/projects/${slug}/ollama/exists`
  );
  return response.data;
}

export async function runModelInOllama(slug: string): Promise<OllamaRunResponse> {
  const response = await axios.post<OllamaRunResponse>(
    `${API_BASE}/api/projects/${slug}/ollama/run`
  );
  return response.data;
}
