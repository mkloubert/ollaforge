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

import { Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { GenerateFromSourcesDialog } from "@/components/generate-from-sources-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfiguredProviders } from "@/hooks/useConfiguredProviders";
import type { DataFile, DataFileStatus } from "@/types";

import { FileDropzone } from "./FileDropzone";
import { FileListItem } from "./FileListItem";

interface DataFilesSectionProps {
  projectSlug: string;
  files: DataFile[];
  filesLoading: boolean;
  isUploading: boolean;
  isTrainingActive: boolean;
  fileStatusMap: Map<string, DataFileStatus>;
  fileErrorCounts: Record<string, number>;
  onUpload: (file: File) => Promise<boolean>;
  onDelete: (filename: string) => Promise<void>;
  onPreview: (filename: string) => void;
  onRefresh?: () => void;
}

export function DataFilesSection({
  projectSlug,
  files,
  filesLoading,
  isUploading,
  isTrainingActive,
  fileStatusMap,
  fileErrorCounts,
  onUpload,
  onDelete,
  onPreview,
  onRefresh,
}: DataFilesSectionProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { hasConfiguredProviders, isLoading: providersLoading } =
    useConfiguredProviders();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      for (const file of droppedFiles) {
        if (file.name.endsWith(".jsonl")) {
          await onUpload(file);
        }
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles) return;

      for (const file of Array.from(selectedFiles)) {
        if (file.name.endsWith(".jsonl")) {
          await onUpload(file);
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onUpload]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isGenerateDisabled =
    isTrainingActive || providersLoading || !hasConfiguredProviders;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>{t("dataFiles.title")}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isGenerateDisabled}
                  onClick={() => setGenerateDialogOpen(true)}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {!hasConfiguredProviders && !providersLoading
                ? t("generateFromSources.buttonDisabled")
                : t("generateFromSources.button")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jsonl"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <FileDropzone
        isDragOver={isDragOver}
        isUploading={isUploading}
        disabled={isTrainingActive}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      />

      {filesLoading ? (
        <div className="flex justify-center py-4">
          <Spinner className="h-5 w-5" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          {t("dataFiles.empty")}
        </p>
      ) : (
        <TooltipProvider>
          <div className="flex flex-col gap-2">
            {files.map((file) => (
              <FileListItem
                key={file.filename}
                file={file}
                fileStatus={fileStatusMap.get(file.filename)}
                errorCount={fileErrorCounts[file.filename]}
                disabled={isTrainingActive}
                onPreview={onPreview}
                onDelete={onDelete}
              />
            ))}
          </div>
        </TooltipProvider>
      )}

      <GenerateFromSourcesDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        projectSlug={projectSlug}
        onDataSaved={onRefresh}
      />
    </div>
  );
}
