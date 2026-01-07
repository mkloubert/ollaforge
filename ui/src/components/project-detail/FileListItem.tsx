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

import { AlertTriangle, FileText, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DataFile, DataFileStatus } from "@/types";

import { FileStatusIcon } from "./FileStatusIcon";

interface FileListItemProps {
  file: DataFile;
  fileStatus?: DataFileStatus;
  errorCount?: number;
  disabled: boolean;
  onPreview: (filename: string) => void;
  onDelete: (filename: string) => void;
}

export function FileListItem({
  file,
  fileStatus,
  errorCount,
  disabled,
  onPreview,
  onDelete,
}: FileListItemProps) {
  const { t } = useTranslation();
  const hasErrors = errorCount !== undefined && errorCount > 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-70 transition-opacity cursor-pointer"
            onClick={() => onPreview(file.filename)}
          >
            {fileStatus ? (
              <FileStatusIcon status={fileStatus.status} />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {file.filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {file.size_formatted}
              </p>
            </div>
          </button>
        </TooltipTrigger>
        {fileStatus && (
          <TooltipContent>
            {t(`dataFiles.fileStatus.${fileStatus.status}`, {
              loaded: fileStatus.rows_loaded,
              skipped: fileStatus.rows_skipped,
            })}
          </TooltipContent>
        )}
      </Tooltip>
      <div className="flex items-center gap-1 shrink-0">
        {hasErrors && !fileStatus && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {t("dataFiles.errorCount", { count: errorCount })}
            </TooltipContent>
          </Tooltip>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(file.filename)}
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
