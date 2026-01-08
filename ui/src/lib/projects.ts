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

import api from "./api";
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  Project,
  UpdateProjectRequest,
  UpdateProjectResponse,
} from "@/types";

export async function fetchProjects(): Promise<Project[]> {
  const response = await api.get<Project[]>("/api/projects");
  return response.data;
}

export async function createProject(
  data: CreateProjectRequest
): Promise<CreateProjectResponse> {
  const response = await api.post<CreateProjectResponse>("/api/projects", data);
  return response.data;
}

export async function deleteProject(slug: string): Promise<void> {
  await api.delete(`/api/projects/${encodeURIComponent(slug)}`);
}

export async function updateProject(
  slug: string,
  data: UpdateProjectRequest
): Promise<UpdateProjectResponse> {
  const response = await api.put<UpdateProjectResponse>(
    `/api/projects/${encodeURIComponent(slug)}`,
    data
  );
  return response.data;
}

export async function openProjectFolder(slug: string): Promise<void> {
  await api.post(`/api/projects/${encodeURIComponent(slug)}/open-folder`);
}
