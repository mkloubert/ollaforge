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
import type { TrainingConfig } from "@/types";

interface TrainingParamsSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: TrainingConfig;
  validationErrors: Record<string, string>;
  disabled: boolean;
  onChange: <K extends keyof TrainingConfig>(key: K, value: TrainingConfig[K]) => void;
  onReset: () => void;
}

export function TrainingParamsSection({
  isOpen,
  onOpenChange,
  config,
  validationErrors,
  disabled,
  onChange,
  onReset,
}: TrainingParamsSectionProps) {
  const { t } = useTranslation();

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
          <span className="font-medium">{t("advancedConfig.trainingParams.title")}</span>
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

        {/* Epochs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="num-epochs">{t("advancedConfig.trainingParams.numEpochs")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.numEpochsHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="num-epochs"
            type="number"
            min={1}
            max={10}
            placeholder="3"
            className={validationErrors["training.num_train_epochs"] ? "border-red-500" : ""}
            value={config.num_train_epochs ?? ""}
            onChange={(e) => onChange("num_train_epochs", safeParseInt(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["training.num_train_epochs"] && (
            <p className="text-sm text-red-500">{validationErrors["training.num_train_epochs"]}</p>
          )}
        </div>

        {/* Batch Size */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="batch-size">{t("advancedConfig.trainingParams.batchSize")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.batchSizeHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="batch-size"
            type="number"
            min={1}
            max={16}
            placeholder="4 (GPU) / 1 (CPU)"
            className={validationErrors["training.per_device_train_batch_size"] ? "border-red-500" : ""}
            value={config.per_device_train_batch_size ?? ""}
            onChange={(e) => onChange("per_device_train_batch_size", safeParseInt(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["training.per_device_train_batch_size"] && (
            <p className="text-sm text-red-500">{validationErrors["training.per_device_train_batch_size"]}</p>
          )}
        </div>

        {/* Gradient Accumulation */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="grad-accum">{t("advancedConfig.trainingParams.gradientAccumulation")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.gradientAccumulationHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="grad-accum"
            type="number"
            min={1}
            max={32}
            placeholder="4"
            className={validationErrors["training.gradient_accumulation_steps"] ? "border-red-500" : ""}
            value={config.gradient_accumulation_steps ?? ""}
            onChange={(e) => onChange("gradient_accumulation_steps", safeParseInt(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["training.gradient_accumulation_steps"] && (
            <p className="text-sm text-red-500">{validationErrors["training.gradient_accumulation_steps"]}</p>
          )}
        </div>

        {/* Learning Rate */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="learning-rate">{t("advancedConfig.trainingParams.learningRate")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.learningRateHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="learning-rate"
            type="number"
            step="0.0001"
            min={0.000001}
            max={1}
            placeholder="0.0002 (GPU) / 0.0003 (CPU)"
            className={validationErrors["training.learning_rate"] ? "border-red-500" : ""}
            value={config.learning_rate ?? ""}
            onChange={(e) => onChange("learning_rate", safeParseFloat(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["training.learning_rate"] && (
            <p className="text-sm text-red-500">{validationErrors["training.learning_rate"]}</p>
          )}
        </div>

        {/* Warmup Ratio */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="warmup-ratio">{t("advancedConfig.trainingParams.warmupRatio")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.warmupRatioHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="warmup-ratio"
            type="number"
            step="0.01"
            min={0}
            max={1}
            placeholder="0.1 (GPU) / 0.03 (CPU)"
            className={validationErrors["training.warmup_ratio"] ? "border-red-500" : ""}
            value={config.warmup_ratio ?? ""}
            onChange={(e) => onChange("warmup_ratio", safeParseFloat(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["training.warmup_ratio"] && (
            <p className="text-sm text-red-500">{validationErrors["training.warmup_ratio"]}</p>
          )}
        </div>

        {/* Max Token Length */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="max-length">{t("advancedConfig.trainingParams.maxLength")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.maxLengthHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={config.max_length?.toString() ?? ""}
            onValueChange={(value) => onChange("max_length", safeParseInt(value))}
            disabled={disabled}
          >
            <SelectTrigger id="max-length">
              <SelectValue placeholder="512" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="512">512</SelectItem>
              <SelectItem value="1024">1024</SelectItem>
              <SelectItem value="2048">2048</SelectItem>
              <SelectItem value="4096">4096</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* FP16 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="fp16">{t("advancedConfig.trainingParams.fp16")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.fp16Help")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="fp16"
            checked={config.fp16 ?? false}
            onCheckedChange={(checked) => onChange("fp16", checked)}
            disabled={disabled}
          />
        </div>

        {/* Optimizer */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="optimizer">{t("advancedConfig.trainingParams.optimizer")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.optimizerHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={config.optim ?? ""}
            onValueChange={(value) => onChange("optim", value || null)}
            disabled={disabled}
          >
            <SelectTrigger id="optimizer">
              <SelectValue placeholder={t("advancedConfig.trainingParams.optimizers.paged_adamw_8bit")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paged_adamw_8bit">{t("advancedConfig.trainingParams.optimizers.paged_adamw_8bit")}</SelectItem>
              <SelectItem value="adamw_torch">{t("advancedConfig.trainingParams.optimizers.adamw_torch")}</SelectItem>
              <SelectItem value="adamw_hf">{t("advancedConfig.trainingParams.optimizers.adamw_hf")}</SelectItem>
              <SelectItem value="sgd">{t("advancedConfig.trainingParams.optimizers.sgd")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Weight Decay */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="weight-decay">{t("advancedConfig.trainingParams.weightDecay")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.weightDecayHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="weight-decay"
            type="number"
            step="0.01"
            min={0}
            max={0.2}
            placeholder="0.01"
            className={validationErrors["training.weight_decay"] ? "border-red-500" : ""}
            value={config.weight_decay ?? ""}
            onChange={(e) => onChange("weight_decay", safeParseFloat(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["training.weight_decay"] && (
            <p className="text-sm text-red-500">{validationErrors["training.weight_decay"]}</p>
          )}
        </div>

        {/* Max Gradient Norm */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="max-grad-norm">{t("advancedConfig.trainingParams.maxGradNorm")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.maxGradNormHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="max-grad-norm"
            type="number"
            step="0.1"
            min={0.1}
            max={2}
            placeholder="1.0"
            className={validationErrors["training.max_grad_norm"] ? "border-red-500" : ""}
            value={config.max_grad_norm ?? ""}
            onChange={(e) => onChange("max_grad_norm", safeParseFloat(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["training.max_grad_norm"] && (
            <p className="text-sm text-red-500">{validationErrors["training.max_grad_norm"]}</p>
          )}
        </div>

        {/* LR Scheduler */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="lr-scheduler">{t("advancedConfig.trainingParams.lrScheduler")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.lrSchedulerHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={config.lr_scheduler_type ?? ""}
            onValueChange={(value) => onChange("lr_scheduler_type", value || null)}
            disabled={disabled}
          >
            <SelectTrigger id="lr-scheduler">
              <SelectValue placeholder={t("advancedConfig.trainingParams.schedulers.linear")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">{t("advancedConfig.trainingParams.schedulers.linear")}</SelectItem>
              <SelectItem value="cosine">{t("advancedConfig.trainingParams.schedulers.cosine")}</SelectItem>
              <SelectItem value="constant">{t("advancedConfig.trainingParams.schedulers.constant")}</SelectItem>
              <SelectItem value="polynomial">{t("advancedConfig.trainingParams.schedulers.polynomial")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* NEFTune Noise Alpha */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="neftune-noise">{t("advancedConfig.trainingParams.neftuneNoise")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.neftuneNoiseHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="neftune-noise"
            type="number"
            step="1"
            min={0}
            max={20}
            placeholder="0 (disabled)"
            className={validationErrors["training.neftune_noise_alpha"] ? "border-red-500" : ""}
            value={config.neftune_noise_alpha ?? ""}
            onChange={(e) => onChange("neftune_noise_alpha", safeParseFloat(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["training.neftune_noise_alpha"] && (
            <p className="text-sm text-red-500">{validationErrors["training.neftune_noise_alpha"]}</p>
          )}
        </div>

        {/* Seed */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="seed">{t("advancedConfig.trainingParams.seed")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.seedHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="seed"
            type="number"
            min={0}
            placeholder="42"
            className={validationErrors["training.seed"] ? "border-red-500" : ""}
            value={config.seed ?? ""}
            onChange={(e) => onChange("seed", safeParseInt(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["training.seed"] && (
            <p className="text-sm text-red-500">{validationErrors["training.seed"]}</p>
          )}
        </div>

        {/* BF16 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="bf16">{t("advancedConfig.trainingParams.bf16")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.bf16Help")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="bf16"
            checked={config.bf16 ?? false}
            onCheckedChange={(checked) => onChange("bf16", checked)}
            disabled={disabled}
          />
        </div>

        {/* Logging Steps */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="logging-steps">{t("advancedConfig.trainingParams.loggingSteps")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.loggingStepsHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="logging-steps"
            type="number"
            min={1}
            max={1000}
            placeholder="10 (GPU) / 5 (CPU)"
            className={validationErrors["training.logging_steps"] ? "border-red-500" : ""}
            value={config.logging_steps ?? ""}
            onChange={(e) => onChange("logging_steps", safeParseInt(e.target.value))}
            disabled={disabled}
          />
          {validationErrors["training.logging_steps"] && (
            <p className="text-sm text-red-500">{validationErrors["training.logging_steps"]}</p>
          )}
        </div>

        {/* Save Strategy */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="save-strategy">{t("advancedConfig.trainingParams.saveStrategy")}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{t("advancedConfig.trainingParams.saveStrategyHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={config.save_strategy ?? ""}
            onValueChange={(value) => onChange("save_strategy", value || null)}
            disabled={disabled}
          >
            <SelectTrigger id="save-strategy">
              <SelectValue placeholder={t("advancedConfig.trainingParams.saveStrategies.epoch")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">{t("advancedConfig.trainingParams.saveStrategies.no")}</SelectItem>
              <SelectItem value="epoch">{t("advancedConfig.trainingParams.saveStrategies.epoch")}</SelectItem>
              <SelectItem value="steps">{t("advancedConfig.trainingParams.saveStrategies.steps")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
