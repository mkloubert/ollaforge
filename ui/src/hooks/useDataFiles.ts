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

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import {
  deleteDataFile,
  fetchDataFiles,
  uploadDataFile,
} from "@/lib/dataFiles";
import type { DataFile } from "@/types";

interface UseDataFilesResult {
  files: DataFile[];
  isLoading: boolean;
  error: string | null;
  isUploading: boolean;
  uploadError: string | null;
  refetch: () => Promise<void>;
  upload: (file: File) => Promise<boolean>;
  remove: (filename: string) => Promise<boolean>;
}

export function useDataFiles(projectSlug: string | undefined): UseDataFilesResult {
  const [files, setFiles] = useState<DataFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    if (!projectSlug) {
      setFiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchDataFiles(projectSlug);
      setFiles(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail?.error_code) {
        setError(err.response.data.detail.error_code);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load data files");
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectSlug]);

  const upload = useCallback(
    async (file: File): Promise<boolean> => {
      if (!projectSlug) return false;

      setIsUploading(true);
      setUploadError(null);

      try {
        await uploadDataFile(projectSlug, file);
        await loadFiles();
        return true;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.data?.detail?.error_code) {
          setUploadError(err.response.data.detail.error_code);
        } else if (err instanceof Error) {
          setUploadError(err.message);
        } else {
          setUploadError("Failed to upload file");
        }
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [projectSlug, loadFiles]
  );

  const remove = useCallback(
    async (filename: string): Promise<boolean> => {
      if (!projectSlug) return false;

      try {
        await deleteDataFile(projectSlug, filename);
        await loadFiles();
        return true;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.data?.detail?.error_code) {
          setError(err.response.data.detail.error_code);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to delete file");
        }
        return false;
      }
    },
    [projectSlug, loadFiles]
  );

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return {
    files,
    isLoading,
    error,
    isUploading,
    uploadError,
    refetch: loadFiles,
    upload,
    remove,
  };
}
