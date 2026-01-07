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

import { ChevronDown, HelpCircle, RotateCcw, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { safeParseFloat, safeParseInt } from "@/lib/validation";
import type { ModelfileConfig } from "@/types";

interface ModelfileParamsSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: ModelfileConfig;
  validationErrors: Record<string, string>;
  disabled: boolean;
  onChange: <K extends keyof ModelfileConfig>(key: K, value: ModelfileConfig[K]) => void;
  onReset: () => void;
}

export function ModelfileParamsSection({
  isOpen,
  onOpenChange,
  config,
  validationErrors,
  disabled,
  onChange,
  onReset,
}: ModelfileParamsSectionProps) {
  const { t } = useTranslation();
  const stopSequences = config.stop ?? [];

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
          <span className="font-medium">{t("advancedConfig.modelfileParams.title")}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4 space-y-4">
        {/* Reset Button */}
        <div className="flex justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={onReset}
                disabled={disabled}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t("advancedConfig.defaults.resetToDefaults")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("advancedConfig.defaults.resetConfirm")}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Temperature */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="temperature">{t("advancedConfig.modelfileParams.temperature")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.modelfileParams.temperatureHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            className={validationErrors["modelfile.temperature"] ? "border-red-500" : ""}
            value={config.temperature ?? 0.7}
            onChange={(e) => onChange("temperature", safeParseFloat(e.target.value) ?? 0.7)}
            disabled={disabled}
          />
          {validationErrors["modelfile.temperature"] && (
            <p className="text-sm text-red-500">{validationErrors["modelfile.temperature"]}</p>
          )}
        </div>

        {/* Top P */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="top-p">{t("advancedConfig.modelfileParams.topP")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.modelfileParams.topPHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="top-p"
            type="number"
            min="0"
            max="1"
            step="0.05"
            className={validationErrors["modelfile.top_p"] ? "border-red-500" : ""}
            value={config.top_p ?? 0.9}
            onChange={(e) => onChange("top_p", safeParseFloat(e.target.value) ?? 0.9)}
            disabled={disabled}
          />
          {validationErrors["modelfile.top_p"] && (
            <p className="text-sm text-red-500">{validationErrors["modelfile.top_p"]}</p>
          )}
        </div>

        {/* Top K */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="top-k">{t("advancedConfig.modelfileParams.topK")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.modelfileParams.topKHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="top-k"
            type="number"
            min="1"
            max="100"
            className={validationErrors["modelfile.top_k"] ? "border-red-500" : ""}
            value={config.top_k ?? 40}
            onChange={(e) => onChange("top_k", safeParseInt(e.target.value) ?? 40)}
            disabled={disabled}
          />
          {validationErrors["modelfile.top_k"] && (
            <p className="text-sm text-red-500">{validationErrors["modelfile.top_k"]}</p>
          )}
        </div>

        {/* Repeat Penalty */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="repeat-penalty">{t("advancedConfig.modelfileParams.repeatPenalty")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.modelfileParams.repeatPenaltyHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="repeat-penalty"
            type="number"
            min="1"
            max="2"
            step="0.05"
            className={validationErrors["modelfile.repeat_penalty"] ? "border-red-500" : ""}
            value={config.repeat_penalty ?? 1.1}
            onChange={(e) => onChange("repeat_penalty", safeParseFloat(e.target.value) ?? 1.1)}
            disabled={disabled}
          />
          {validationErrors["modelfile.repeat_penalty"] && (
            <p className="text-sm text-red-500">{validationErrors["modelfile.repeat_penalty"]}</p>
          )}
        </div>

        {/* Repeat Last N */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="repeat-last-n">{t("advancedConfig.modelfileParams.repeatLastN")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.modelfileParams.repeatLastNHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="repeat-last-n"
            type="number"
            min="0"
            max="512"
            className={validationErrors["modelfile.repeat_last_n"] ? "border-red-500" : ""}
            value={config.repeat_last_n ?? 64}
            onChange={(e) => onChange("repeat_last_n", safeParseInt(e.target.value) ?? 64)}
            disabled={disabled}
          />
          {validationErrors["modelfile.repeat_last_n"] && (
            <p className="text-sm text-red-500">{validationErrors["modelfile.repeat_last_n"]}</p>
          )}
        </div>

        {/* Context Window Size */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="num-ctx">{t("advancedConfig.modelfileParams.numCtx")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.modelfileParams.numCtxHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={String(config.num_ctx ?? 2048)}
            onValueChange={(value) => onChange("num_ctx", safeParseInt(value))}
            disabled={disabled}
          >
            <SelectTrigger id="num-ctx">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2048">2048</SelectItem>
              <SelectItem value="4096">4096</SelectItem>
              <SelectItem value="8192">8192</SelectItem>
              <SelectItem value="16384">16384</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* System Prompt */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="system-prompt">{t("advancedConfig.modelfileParams.system")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.modelfileParams.systemHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <textarea
            id="system-prompt"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t("advancedConfig.modelfileParams.systemPlaceholder")}
            value={config.system ?? ""}
            onChange={(e) => onChange("system", e.target.value || null)}
            disabled={disabled}
          />
        </div>

        {/* Stop Sequences */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label>{t("advancedConfig.modelfileParams.stop")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.modelfileParams.stopHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {stopSequences.map((seq, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
              >
                <code className="text-xs">{seq}</code>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const newStop = stopSequences.filter((_, i) => i !== index);
                    onChange("stop", newStop.length > 0 ? newStop : null);
                  }}
                  disabled={disabled}
                >
                  <XCircle className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="stop-input"
              type="text"
              placeholder={t("advancedConfig.modelfileParams.stopPlaceholder")}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const value = input.value.trim();
                  if (value && !stopSequences.includes(value)) {
                    onChange("stop", [...stopSequences, value]);
                    input.value = "";
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => {
                const input = document.getElementById("stop-input") as HTMLInputElement;
                const value = input?.value.trim();
                if (value && !stopSequences.includes(value)) {
                  onChange("stop", [...stopSequences, value]);
                  input.value = "";
                }
              }}
            >
              {t("advancedConfig.modelfileParams.stopAdd")}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
