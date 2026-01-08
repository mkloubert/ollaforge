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

import { useCallback, useRef, useState } from "react";
import { AlertTriangle, FileText, Plus, Trash2, Type, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { countTokens, formatTokenCount } from "@/lib/tokenizer";

export interface DataSourceItem {
  id: string;
  type: "file" | "text";
  name: string;
  content: string;
  estimatedTokens: number;
}

interface DataSourcesPanelProps {
  sources: DataSourceItem[];
  onSourcesChange: (sources: DataSourceItem[]) => void;
  maxContextTokens?: number;
  disabled?: boolean;
}

const ACCEPTED_FILE_EXTENSIONS = [".txt", ".md", ".html", ".json", ".csv", ".xml"];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function DataSourcesPanel({
  sources,
  onSourcesChange,
  maxContextTokens = 128000,
  disabled = false,
}: DataSourcesPanelProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textCounter, setTextCounter] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalTokens = sources.reduce((sum, s) => sum + s.estimatedTokens, 0);
  const isOverLimit = totalTokens > maxContextTokens;

  const addSource = useCallback(
    (item: Omit<DataSourceItem, "id" | "estimatedTokens">) => {
      const tokens = countTokens(item.content);
      const newSource: DataSourceItem = {
        ...item,
        id: generateId(),
        estimatedTokens: tokens,
      };
      onSourcesChange([...sources, newSource]);
    },
    [sources, onSourcesChange]
  );

  const removeSource = useCallback(
    (id: string) => {
      onSourcesChange(sources.filter((s) => s.id !== id));
    },
    [sources, onSourcesChange]
  );

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

  const processFile = useCallback(
    async (file: File) => {
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!ACCEPTED_FILE_EXTENSIONS.includes(extension)) {
        return;
      }

      const content = await file.text();
      addSource({
        type: "file",
        name: file.name,
        content,
      });
    },
    [addSource]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await processFile(file);
      }
    },
    [disabled, processFile]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (const file of Array.from(files)) {
        await processFile(file);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [processFile]
  );

  const handleAddText = useCallback(() => {
    if (!textInput.trim()) return;

    addSource({
      type: "text",
      name: `Text ${textCounter}`,
      content: textInput.trim(),
    });
    setTextInput("");
    setTextCounter((c) => c + 1);
  }, [textInput, textCounter, addSource]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      <h3 className="font-medium text-sm">
        {t("generateFromSources.sources.title")}
      </h3>

      {/* File Upload Zone */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
            transition-colors duration-200
            ${isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }
            ${disabled ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t("generateFromSources.sources.uploadHint")}
            </span>
            <span className="text-xs text-muted-foreground/70">
              {t("generateFromSources.sources.acceptedFormats")}
            </span>
          </div>
        </div>
      </div>

      {/* Text Input */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">{t("generateFromSources.sources.addText")}</Label>
        <Textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={t("generateFromSources.sources.textPlaceholder")}
          className="h-[100px] resize-none overflow-y-auto"
          disabled={disabled}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddText}
          disabled={disabled || !textInput.trim()}
          className="self-end"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("generateFromSources.sources.addText")}
        </Button>
      </div>

      {/* Sources List */}
      <div className="flex-1 min-h-0">
        <Label className="text-sm mb-2 block">
          {sources.length > 0
            ? t("generateFromSources.sources.sourcesCount", { count: sources.length })
            : t("generateFromSources.sources.empty")}
        </Label>
        {sources.length > 0 && (
          <ScrollArea className="h-[calc(100%-2rem)] border rounded-md">
            <TooltipProvider>
              <div className="p-2 space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {source.type === "file" ? (
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Type className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm truncate">{source.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {t("generateFromSources.sources.estimatedTokens", {
                          tokens: formatTokenCount(source.estimatedTokens),
                        })}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeSource(source.id)}
                            disabled={disabled}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("common.delete")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </ScrollArea>
        )}
      </div>

      {/* Total Tokens */}
      {sources.length > 0 && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {t("generateFromSources.sources.totalTokens", {
                tokens: formatTokenCount(totalTokens),
              })}
            </span>
          </div>
          {isOverLimit && (
            <Alert variant="destructive" className="mt-2 py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {t("generateFromSources.sources.tokenLimitWarning", {
                  limit: formatTokenCount(maxContextTokens),
                })}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
