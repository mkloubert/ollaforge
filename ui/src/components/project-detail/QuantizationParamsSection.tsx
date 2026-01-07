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

import { ChevronDown, HelpCircle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import type { QuantizationConfig } from "@/types";

interface QuantizationParamsSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: QuantizationConfig;
  disabled: boolean;
  onChange: <K extends keyof QuantizationConfig>(key: K, value: QuantizationConfig[K]) => void;
  onReset: () => void;
}

export function QuantizationParamsSection({
  isOpen,
  onOpenChange,
  config,
  disabled,
  onChange,
  onReset,
}: QuantizationParamsSectionProps) {
  const { t } = useTranslation();

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
          <span className="font-medium">{t("advancedConfig.quantizationParams.title")}</span>
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

        {/* CUDA-only info */}
        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          {t("advancedConfig.quantizationParams.cudaOnly")}
        </p>

        {/* Load in 4-bit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="load-4bit">{t("advancedConfig.quantizationParams.loadIn4bit")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.quantizationParams.loadIn4bitHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="load-4bit"
            checked={config.load_in_4bit ?? true}
            onCheckedChange={(checked) => onChange("load_in_4bit", checked)}
            disabled={disabled}
          />
        </div>

        {/* 4-bit Quantization Type */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="quant-type">{t("advancedConfig.quantizationParams.quantType")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.quantizationParams.quantTypeHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={config.bnb_4bit_quant_type ?? "nf4"}
            onValueChange={(value) => onChange("bnb_4bit_quant_type", value)}
            disabled={disabled}
          >
            <SelectTrigger id="quant-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nf4">{t("advancedConfig.quantizationParams.quantTypes.nf4")}</SelectItem>
              <SelectItem value="fp4">{t("advancedConfig.quantizationParams.quantTypes.fp4")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Double Quantization */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="double-quant">{t("advancedConfig.quantizationParams.doubleQuant")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.quantizationParams.doubleQuantHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="double-quant"
            checked={config.bnb_4bit_use_double_quant ?? true}
            onCheckedChange={(checked) => onChange("bnb_4bit_use_double_quant", checked)}
            disabled={disabled}
          />
        </div>

        {/* Compute Dtype */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="compute-dtype">{t("advancedConfig.quantizationParams.computeDtype")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.quantizationParams.computeDtypeHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={config.bnb_4bit_compute_dtype ?? ""}
            onValueChange={(value) => onChange("bnb_4bit_compute_dtype", value || null)}
            disabled={disabled}
          >
            <SelectTrigger id="compute-dtype">
              <SelectValue placeholder={t("advancedConfig.quantizationParams.computeDtypes.float16")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="float16">{t("advancedConfig.quantizationParams.computeDtypes.float16")}</SelectItem>
              <SelectItem value="bfloat16">{t("advancedConfig.quantizationParams.computeDtypes.bfloat16")}</SelectItem>
              <SelectItem value="float32">{t("advancedConfig.quantizationParams.computeDtypes.float32")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Output Quantization */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="output-quant">{t("advancedConfig.quantizationParams.outputQuantization")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.quantizationParams.outputQuantizationHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={config.output_quantization ?? "q8_0"}
            onValueChange={(value) => onChange("output_quantization", value)}
            disabled={disabled}
          >
            <SelectTrigger id="output-quant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="f32">{t("advancedConfig.quantizationParams.outputTypes.f32")}</SelectItem>
              <SelectItem value="f16">{t("advancedConfig.quantizationParams.outputTypes.f16")}</SelectItem>
              <SelectItem value="bf16">{t("advancedConfig.quantizationParams.outputTypes.bf16")}</SelectItem>
              <SelectItem value="q8_0">{t("advancedConfig.quantizationParams.outputTypes.q8_0")}</SelectItem>
              <SelectItem value="auto">{t("advancedConfig.quantizationParams.outputTypes.auto")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
