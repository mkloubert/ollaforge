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

import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/ui/spinner";

interface FileDropzoneProps {
  isDragOver: boolean;
  isUploading: boolean;
  disabled: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}

export function FileDropzone({
  isDragOver,
  isUploading,
  disabled,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: FileDropzoneProps) {
  const { t } = useTranslation();

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
        transition-colors duration-200
        ${isDragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }
        ${isUploading || disabled ? "pointer-events-none opacity-50" : ""}
      `}
    >
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Spinner className="h-6 w-6" />
          <span className="text-sm text-muted-foreground">
            {t("dataFiles.uploading")}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isDragOver
              ? t("dataFiles.dropzoneActive")
              : t("dataFiles.dropzone")}
          </span>
        </div>
      )}
    </div>
  );
}
