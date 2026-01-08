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

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  DataSourcesPanel,
  type DataSourceItem,
  GeneratedDataTable,
  type TrainingRow,
  LLMGenerationControls,
  SaveGeneratedDataPanel,
} from "@/components/generate-from-sources";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import type { LLMProviderType } from "@/lib/llmModels";

interface GenerateFromSourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  onDataSaved?: () => void;
}

interface GenerateResponseItem {
  instruction: string;
  output: string;
}

interface GenerateResponse {
  items: GenerateResponseItem[];
  chunks_processed: number;
  total_items: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function GenerateFromSourcesDialog({
  open,
  onOpenChange,
  projectSlug,
  onDataSaved,
}: GenerateFromSourcesDialogProps) {
  const { t } = useTranslation();
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [generatedRows, setGeneratedRows] = useState<TrainingRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | undefined>();

  const handleSaveSuccess = useCallback(() => {
    onDataSaved?.();
    onOpenChange(false);
  }, [onDataSaved, onOpenChange]);

  const handleGenerate = useCallback(
    async (provider: LLMProviderType, modelId: string) => {
      if (dataSources.length === 0) return;

      setIsGenerating(true);
      setProgress({ current: 1, total: dataSources.length });

      try {
        // Convert DataSourceItems to API format
        const sources = dataSources.map((source) => ({
          id: source.id,
          type: source.type,
          content: source.content,
          filename: source.type === "file" ? source.name : null,
          mime_type: source.type === "file" ? "text/plain" : null,
          estimated_tokens: source.estimatedTokens,
        }));

        const response = await api.post<GenerateResponse>(
          `/api/projects/${projectSlug}/generate-training-data`,
          {
            provider,
            model_id: modelId,
            sources,
          },
          {
            timeout: 300000, // 5 minutes for LLM generation
          }
        );

        // Convert response items to TrainingRow with IDs
        const rows: TrainingRow[] = response.data.items.map((item: GenerateResponseItem) => ({
          id: generateId(),
          instruction: item.instruction,
          output: item.output,
        }));

        setGeneratedRows(rows);
        setProgress({ current: response.data.chunks_processed, total: response.data.chunks_processed });

        toast.success(
          t("generateFromSources.results.generated", {
            count: response.data.total_items,
          })
        );
      } catch (error: unknown) {
        console.error("Generation failed:", error);
        const errorCode = (error as { response?: { data?: { error_code?: string } } })?.response?.data?.error_code;
        if (errorCode) {
          toast.error(t(`errors.${errorCode}`, { defaultValue: t("errors.unknown") }));
        } else {
          toast.error(t("errors.unknown"));
        }
      } finally {
        setIsGenerating(false);
        setProgress(undefined);
      }
    },
    [dataSources, projectSlug, t]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[calc(100vw-2rem)] sm:!max-w-[calc(100vw-4rem)] lg:!max-w-[1400px] xl:!max-w-[1600px] 2xl:!max-w-[1800px] h-[calc(100vh-4rem)] sm:h-[calc(100vh-6rem)] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("generateFromSources.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 overflow-hidden min-h-0">
          {/* Left panel - Data Sources and LLM Controls */}
          <div className="md:col-span-1 lg:col-span-2 flex flex-col overflow-hidden border rounded-lg p-3 sm:p-4 gap-3 sm:gap-4 min-h-[300px]">
            <div className="flex-1 overflow-hidden">
              <DataSourcesPanel
                sources={dataSources}
                onSourcesChange={setDataSources}
              />
            </div>

            <Separator />

            <LLMGenerationControls
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              progress={progress}
              hasDataSources={dataSources.length > 0}
            />
          </div>

          {/* Right panel - Generated Data */}
          <div className="md:col-span-1 lg:col-span-3 flex flex-col overflow-hidden border rounded-lg p-3 sm:p-4 gap-3 sm:gap-4 min-h-[300px]">
            <h3 className="font-medium text-sm">
              {t("generateFromSources.results.title")}
            </h3>
            <div className="flex-1 min-h-0 flex flex-col">
              <GeneratedDataTable
                rows={generatedRows}
                onRowsChange={setGeneratedRows}
                disabled={isGenerating}
              />
            </div>

            <Separator />

            <SaveGeneratedDataPanel
              projectSlug={projectSlug}
              rows={generatedRows}
              onSaveSuccess={handleSaveSuccess}
              disabled={isGenerating}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
