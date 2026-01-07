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

import { Separator } from "@/components/ui/separator";
import type { DataFile, DataFileStatus, Model } from "@/types";

import { DataFilesSection } from "./DataFilesSection";
import { ModelSelector } from "./ModelSelector";
import { TargetNameInput } from "./TargetNameInput";

interface BasicConfigTabProps {
  // Model selection
  models: Model[];
  selectedModel: string;
  onModelChange: (value: string) => void;
  modelsLoading: boolean;
  // Target name
  targetName: string;
  onTargetNameChange: (value: string) => void;
  targetNamePlaceholder: string;
  // Data files
  files: DataFile[];
  filesLoading: boolean;
  isUploading: boolean;
  fileStatusMap: Map<string, DataFileStatus>;
  fileErrorCounts: Record<string, number>;
  onUpload: (file: File) => Promise<boolean>;
  onDelete: (filename: string) => Promise<void>;
  onPreview: (filename: string) => void;
  // Common
  isTrainingActive: boolean;
}

export function BasicConfigTab({
  models,
  selectedModel,
  onModelChange,
  modelsLoading,
  targetName,
  onTargetNameChange,
  targetNamePlaceholder,
  files,
  filesLoading,
  isUploading,
  fileStatusMap,
  fileErrorCounts,
  onUpload,
  onDelete,
  onPreview,
  isTrainingActive,
}: BasicConfigTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <ModelSelector
        models={models}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        isLoading={modelsLoading}
        disabled={isTrainingActive}
      />

      <TargetNameInput
        value={targetName}
        onChange={onTargetNameChange}
        placeholder={targetNamePlaceholder}
        disabled={isTrainingActive}
      />

      <Separator />

      <DataFilesSection
        files={files}
        filesLoading={filesLoading}
        isUploading={isUploading}
        isTrainingActive={isTrainingActive}
        fileStatusMap={fileStatusMap}
        fileErrorCounts={fileErrorCounts}
        onUpload={onUpload}
        onDelete={onDelete}
        onPreview={onPreview}
      />
    </div>
  );
}
