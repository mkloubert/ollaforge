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
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { safeParseFloat, safeParseInt } from "@/lib/validation";
import type { LoraConfig } from "@/types";

const TARGET_MODULES = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"] as const;
const DEFAULT_MODULES = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"];

interface LoraParamsSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: LoraConfig;
  validationErrors: Record<string, string>;
  disabled: boolean;
  onChange: <K extends keyof LoraConfig>(key: K, value: LoraConfig[K]) => void;
  onReset: () => void;
}

export function LoraParamsSection({
  isOpen,
  onOpenChange,
  config,
  validationErrors,
  disabled,
  onChange,
  onReset,
}: LoraParamsSectionProps) {
  const { t } = useTranslation();

  const currentModules = config.target_modules ?? DEFAULT_MODULES;
  const modulesToSave = config.modules_to_save ?? [];

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
          <span className="font-medium">{t("advancedConfig.loraParams.title")}</span>
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

        {/* Rank */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="lora-rank">{t("advancedConfig.loraParams.rank")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.loraParams.rankHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="lora-rank"
            type="number"
            min={4}
            max={256}
            placeholder="32"
            className={validationErrors["lora.r"] ? "border-red-500" : ""}
            value={config.r ?? ""}
            onChange={(e) => onChange("r", safeParseInt(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["lora.r"] && (
            <p className="text-sm text-red-500">{validationErrors["lora.r"]}</p>
          )}
        </div>

        {/* Alpha */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="lora-alpha">{t("advancedConfig.loraParams.alpha")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.loraParams.alphaHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="lora-alpha"
            type="number"
            min={8}
            max={512}
            placeholder="64"
            className={validationErrors["lora.lora_alpha"] ? "border-red-500" : ""}
            value={config.lora_alpha ?? ""}
            onChange={(e) => onChange("lora_alpha", safeParseInt(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["lora.lora_alpha"] && (
            <p className="text-sm text-red-500">{validationErrors["lora.lora_alpha"]}</p>
          )}
        </div>

        {/* Dropout */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="lora-dropout">{t("advancedConfig.loraParams.dropout")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.loraParams.dropoutHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="lora-dropout"
            type="number"
            step="0.01"
            min={0}
            max={0.5}
            placeholder="0.05"
            className={validationErrors["lora.lora_dropout"] ? "border-red-500" : ""}
            value={config.lora_dropout ?? ""}
            onChange={(e) => onChange("lora_dropout", safeParseFloat(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["lora.lora_dropout"] && (
            <p className="text-sm text-red-500">{validationErrors["lora.lora_dropout"]}</p>
          )}
        </div>

        {/* Target Modules */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label>{t("advancedConfig.loraParams.targetModules")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.loraParams.targetModulesHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TARGET_MODULES.map((module) => {
              const isChecked = currentModules.includes(module);
              return (
                <div key={module} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`module-${module}`}
                    checked={isChecked}
                    onChange={(e) => {
                      const newModules = e.target.checked
                        ? [...currentModules, module]
                        : currentModules.filter((m) => m !== module);
                      onChange("target_modules", newModules.length > 0 ? newModules : null);
                    }}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor={`module-${module}`} className="text-sm font-normal cursor-pointer">
                    {t(`advancedConfig.loraParams.modules.${module}`)}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bias Training */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="lora-bias">{t("advancedConfig.loraParams.bias")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.loraParams.biasHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={config.bias ?? ""}
            onValueChange={(value) => onChange("bias", value || null)}
            disabled={disabled}
          >
            <SelectTrigger id="lora-bias">
              <SelectValue placeholder={t("advancedConfig.loraParams.biasOptions.none")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("advancedConfig.loraParams.biasOptions.none")}</SelectItem>
              <SelectItem value="lora_only">{t("advancedConfig.loraParams.biasOptions.lora_only")}</SelectItem>
              <SelectItem value="all">{t("advancedConfig.loraParams.biasOptions.all")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Use RSLoRA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="use-rslora">{t("advancedConfig.loraParams.useRslora")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.loraParams.useRsloraHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="use-rslora"
            checked={config.use_rslora ?? false}
            onCheckedChange={(checked) => onChange("use_rslora", checked)}
            disabled={disabled}
          />
        </div>

        {/* Use DoRA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="use-dora">{t("advancedConfig.loraParams.useDora")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.loraParams.useDoraHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="use-dora"
            checked={config.use_dora ?? false}
            onCheckedChange={(checked) => onChange("use_dora", checked)}
            disabled={disabled}
          />
        </div>

        {/* Modules to Save */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label>{t("advancedConfig.loraParams.modulesToSave")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.loraParams.modulesToSaveHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {modulesToSave.map((mod, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
              >
                <code className="text-xs">{mod}</code>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const newModules = modulesToSave.filter((_, i) => i !== index);
                    onChange("modules_to_save", newModules.length > 0 ? newModules : null);
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
              id="modules-to-save-input"
              type="text"
              placeholder={t("advancedConfig.loraParams.modulesToSavePlaceholder")}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const value = input.value.trim();
                  if (value && !modulesToSave.includes(value)) {
                    onChange("modules_to_save", [...modulesToSave, value]);
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
                const input = document.getElementById("modules-to-save-input") as HTMLInputElement;
                const value = input?.value.trim();
                if (value && !modulesToSave.includes(value)) {
                  onChange("modules_to_save", [...modulesToSave, value]);
                  input.value = "";
                }
              }}
            >
              {t("advancedConfig.loraParams.modulesToSaveAdd")}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
