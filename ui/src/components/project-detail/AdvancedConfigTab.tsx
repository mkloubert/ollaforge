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

import { TooltipProvider } from "@/components/ui/tooltip";
import type { LoraConfig, ModelfileConfig, QuantizationConfig, TrainingConfig } from "@/types";

import { HelpPanel } from "./HelpPanel";
import { LoraParamsSection } from "./LoraParamsSection";
import { ModelfileParamsSection } from "./ModelfileParamsSection";
import { QuantizationParamsSection } from "./QuantizationParamsSection";
import { TrainingParamsSection } from "./TrainingParamsSection";

interface DocLinks {
  transformers: string;
  qlora: string;
  lora: string;
  huggingface: string;
}

interface AdvancedConfigTabProps {
  // Help panel
  isHelpPanelOpen: boolean;
  onHelpPanelOpenChange: (open: boolean) => void;
  docLinks: DocLinks;
  // Training params
  isTrainingParamsOpen: boolean;
  onTrainingParamsOpenChange: (open: boolean) => void;
  trainingConfig: TrainingConfig;
  onTrainingConfigChange: <K extends keyof TrainingConfig>(key: K, value: TrainingConfig[K]) => void;
  onResetTrainingConfig: () => void;
  // LoRA params
  isLoraParamsOpen: boolean;
  onLoraParamsOpenChange: (open: boolean) => void;
  loraConfig: LoraConfig;
  onLoraConfigChange: <K extends keyof LoraConfig>(key: K, value: LoraConfig[K]) => void;
  onResetLoraConfig: () => void;
  // Quantization params
  isQuantizationParamsOpen: boolean;
  onQuantizationParamsOpenChange: (open: boolean) => void;
  quantizationConfig: QuantizationConfig;
  onQuantizationConfigChange: <K extends keyof QuantizationConfig>(key: K, value: QuantizationConfig[K]) => void;
  onResetQuantizationConfig: () => void;
  // Modelfile params
  isModelfileParamsOpen: boolean;
  onModelfileParamsOpenChange: (open: boolean) => void;
  modelfileConfig: ModelfileConfig;
  onModelfileConfigChange: <K extends keyof ModelfileConfig>(key: K, value: ModelfileConfig[K]) => void;
  onResetModelfileConfig: () => void;
  // Common
  validationErrors: Record<string, string>;
  disabled: boolean;
}

export function AdvancedConfigTab({
  isHelpPanelOpen,
  onHelpPanelOpenChange,
  docLinks,
  isTrainingParamsOpen,
  onTrainingParamsOpenChange,
  trainingConfig,
  onTrainingConfigChange,
  onResetTrainingConfig,
  isLoraParamsOpen,
  onLoraParamsOpenChange,
  loraConfig,
  onLoraConfigChange,
  onResetLoraConfig,
  isQuantizationParamsOpen,
  onQuantizationParamsOpenChange,
  quantizationConfig,
  onQuantizationConfigChange,
  onResetQuantizationConfig,
  isModelfileParamsOpen,
  onModelfileParamsOpenChange,
  modelfileConfig,
  onModelfileConfigChange,
  onResetModelfileConfig,
  validationErrors,
  disabled,
}: AdvancedConfigTabProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <HelpPanel
          isOpen={isHelpPanelOpen}
          onOpenChange={onHelpPanelOpenChange}
          docLinks={docLinks}
        />

        <TrainingParamsSection
          isOpen={isTrainingParamsOpen}
          onOpenChange={onTrainingParamsOpenChange}
          config={trainingConfig}
          validationErrors={validationErrors}
          disabled={disabled}
          onChange={onTrainingConfigChange}
          onReset={onResetTrainingConfig}
        />

        <LoraParamsSection
          isOpen={isLoraParamsOpen}
          onOpenChange={onLoraParamsOpenChange}
          config={loraConfig}
          validationErrors={validationErrors}
          disabled={disabled}
          onChange={onLoraConfigChange}
          onReset={onResetLoraConfig}
        />

        <QuantizationParamsSection
          isOpen={isQuantizationParamsOpen}
          onOpenChange={onQuantizationParamsOpenChange}
          config={quantizationConfig}
          disabled={disabled}
          onChange={onQuantizationConfigChange}
          onReset={onResetQuantizationConfig}
        />

        <ModelfileParamsSection
          isOpen={isModelfileParamsOpen}
          onOpenChange={onModelfileParamsOpenChange}
          config={modelfileConfig}
          validationErrors={validationErrors}
          disabled={disabled}
          onChange={onModelfileConfigChange}
          onReset={onResetModelfileConfig}
        />
      </div>
    </TooltipProvider>
  );
}
