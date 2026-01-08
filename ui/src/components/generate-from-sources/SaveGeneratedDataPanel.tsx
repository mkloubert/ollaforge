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
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import api from "@/lib/api";

import type { TrainingRow } from "./GeneratedDataTable";

interface SaveGeneratedDataPanelProps {
  projectSlug: string;
  rows: TrainingRow[];
  onSaveSuccess?: (filename: string) => void;
  disabled?: boolean;
}

interface SaveResponse {
  filename: string;
  rows_saved: number;
}

function generateDefaultFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `data-${year}${month}${day}${hours}${minutes}${seconds}`;
}

function isValidFilename(filename: string): boolean {
  if (!filename || filename.trim() === "") return false;
  // Only alphanumeric, dash, underscore allowed
  return /^[a-zA-Z0-9_-]+$/.test(filename);
}

function isRowValid(row: TrainingRow): boolean {
  return row.instruction.trim() !== "" && row.output.trim() !== "";
}

export function SaveGeneratedDataPanel({
  projectSlug,
  rows,
  onSaveSuccess,
  disabled = false,
}: SaveGeneratedDataPanelProps) {
  const { t } = useTranslation();
  const [filename, setFilename] = useState(generateDefaultFilename);
  const [isSaving, setIsSaving] = useState(false);

  const validationState = useMemo(() => {
    const validRows = rows.filter(isRowValid);
    const hasData = rows.length > 0;
    const allRowsValid = validRows.length === rows.length;
    const filenameValid = isValidFilename(filename);

    return {
      hasData,
      allRowsValid,
      filenameValid,
      validRowCount: validRows.length,
      totalRowCount: rows.length,
      canSave: hasData && allRowsValid && filenameValid,
    };
  }, [rows, filename]);

  const handleFilenameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilename(e.target.value);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!validationState.canSave || isSaving) return;

    setIsSaving(true);

    try {
      const response = await api.post<SaveResponse>(
        `/api/projects/${projectSlug}/data/save-generated`,
        {
          filename,
          rows: rows.map((row) => ({
            instruction: row.instruction,
            output: row.output,
          })),
        }
      );

      toast.success(
        t("generateFromSources.save.success", {
          filename: response.data.filename,
        })
      );

      onSaveSuccess?.(response.data.filename);
    } catch (error: unknown) {
      console.error("Save failed:", error);
      const errorCode = (error as { response?: { data?: { error_code?: string } } })?.response?.data?.error_code;
      if (errorCode) {
        toast.error(t(`errors.${errorCode}`, { defaultValue: t("errors.unknown") }));
      } else {
        toast.error(t("errors.unknown"));
      }
    } finally {
      setIsSaving(false);
    }
  }, [validationState.canSave, isSaving, projectSlug, filename, rows, t, onSaveSuccess]);

  const getDisabledReason = useCallback(() => {
    if (!validationState.hasData) {
      return t("generateFromSources.errors.noData");
    }
    if (!validationState.allRowsValid) {
      return t("generateFromSources.errors.invalidRows");
    }
    if (!validationState.filenameValid) {
      return t("generateFromSources.errors.invalidFilename");
    }
    return null;
  }, [validationState, t]);

  const disabledReason = getDisabledReason();

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-sm font-medium">
        {t("generateFromSources.save.title")}
      </Label>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={filename}
            onChange={handleFilenameChange}
            placeholder={t("generateFromSources.save.filename")}
            disabled={disabled || isSaving}
            className={`pr-14 ${!validationState.filenameValid && filename ? "border-destructive" : ""}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            .jsonl
          </span>
        </div>

        <Button
          onClick={handleSave}
          disabled={disabled || isSaving || !validationState.canSave}
          className="shrink-0"
        >
          {isSaving ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              {t("generateFromSources.save.saving")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t("generateFromSources.save.save")}
            </>
          )}
        </Button>
      </div>

      {disabledReason && !isSaving && (
        <p className="text-xs text-muted-foreground">{disabledReason}</p>
      )}
    </div>
  );
}
