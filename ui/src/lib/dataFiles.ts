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
import type { DataFile, DataFileContentResponse, UploadDataFileResponse } from "@/types";

export async function fetchDataFiles(projectSlug: string): Promise<DataFile[]> {
  const response = await api.get<DataFile[]>(
    `/api/projects/${encodeURIComponent(projectSlug)}/data`
  );
  return response.data;
}

export async function uploadDataFile(
  projectSlug: string,
  file: File
): Promise<UploadDataFileResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<UploadDataFileResponse>(
    `/api/projects/${encodeURIComponent(projectSlug)}/data`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function deleteDataFile(
  projectSlug: string,
  filename: string
): Promise<void> {
  await api.delete(
    `/api/projects/${encodeURIComponent(projectSlug)}/data/${encodeURIComponent(filename)}`
  );
}

export async function fetchDataFileContent(
  projectSlug: string,
  filename: string
): Promise<DataFileContentResponse> {
  const response = await api.get<DataFileContentResponse>(
    `/api/projects/${encodeURIComponent(projectSlug)}/data/${encodeURIComponent(filename)}`
  );
  return response.data;
}
