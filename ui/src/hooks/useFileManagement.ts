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

import { useCallback, useMemo, useState } from "react";

import type { DataFileStatus } from "@/types";

interface UseFileManagementProps {
  remove: (filename: string) => Promise<boolean>;
  trainingFileStatuses: DataFileStatus[];
}

export function useFileManagement({ remove, trainingFileStatuses }: UseFileManagementProps) {
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [fileErrorCounts, setFileErrorCounts] = useState<Record<string, number>>({});

  // Create a map from filename to training file status
  const fileStatusMap = useMemo(() => {
    const map = new Map<string, DataFileStatus>();
    for (const fs of trainingFileStatuses) {
      map.set(fs.filename, fs);
    }
    return map;
  }, [trainingFileStatuses]);

  const handleDelete = useCallback(
    async (filename: string) => {
      await remove(filename);
      // Clear error count for deleted file
      setFileErrorCounts((prev) => {
        const next = { ...prev };
        delete next[filename];
        return next;
      });
    },
    [remove]
  );

  const handleFileErrorCountChange = useCallback(
    (filename: string, errorCount: number) => {
      setFileErrorCounts((prev) => ({
        ...prev,
        [filename]: errorCount,
      }));
    },
    []
  );

  const handlePreview = useCallback((filename: string) => {
    setPreviewFile(filename);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  return {
    previewFile,
    fileErrorCounts,
    fileStatusMap,
    handleDelete,
    handleFileErrorCountChange,
    handlePreview,
    handleClosePreview,
  };
}
