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
import { Bot, Sparkles, Wind } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useConfiguredProviders } from "@/hooks/useConfiguredProviders";
import {
  getDefaultModel,
  getModelsForProvider,
  type LLMProviderType,
} from "@/lib/llmModels";

interface LLMGenerationControlsProps {
  onGenerate: (provider: LLMProviderType, modelId: string) => Promise<void>;
  isGenerating: boolean;
  progress?: {
    current: number;
    total: number;
  };
  disabled?: boolean;
  hasDataSources: boolean;
}

const PROVIDER_ICONS: Record<LLMProviderType, React.ReactNode> = {
  openai: <Sparkles className="h-4 w-4" />,
  anthropic: <Bot className="h-4 w-4" />,
  mistral: <Wind className="h-4 w-4" />,
};

const PROVIDER_NAMES: Record<LLMProviderType, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  mistral: "Mistral",
};

export function LLMGenerationControls({
  onGenerate,
  isGenerating,
  progress,
  disabled = false,
  hasDataSources,
}: LLMGenerationControlsProps) {
  const { t } = useTranslation();
  const { configuredProviders, isLoading: providersLoading } =
    useConfiguredProviders();

  // Store selected value as "provider:modelId" format
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  // Get available providers
  const availableProviders = useMemo(() => {
    return configuredProviders.map((p) => p.provider as LLMProviderType);
  }, [configuredProviders]);

  // Build grouped models structure
  const groupedModels = useMemo(() => {
    return availableProviders.map((provider) => ({
      provider,
      name: PROVIDER_NAMES[provider],
      icon: PROVIDER_ICONS[provider],
      models: getModelsForProvider(provider),
    }));
  }, [availableProviders]);

  // Compute default value (first provider's default model)
  const defaultValue = useMemo(() => {
    if (availableProviders.length === 0) return null;
    const firstProvider = availableProviders[0];
    const defaultModel = getDefaultModel(firstProvider);
    return defaultModel ? `${firstProvider}:${defaultModel.id}` : null;
  }, [availableProviders]);

  // Effective value (user selection or default)
  const effectiveValue = selectedValue ?? defaultValue;

  // Parse selected value into provider and model
  const { effectiveProvider, effectiveModelId, selectedModel } = useMemo(() => {
    if (!effectiveValue) {
      return { effectiveProvider: null, effectiveModelId: null, selectedModel: null };
    }
    const [provider, modelId] = effectiveValue.split(":") as [LLMProviderType, string];
    const models = getModelsForProvider(provider);
    const model = models.find((m) => m.id === modelId) ?? null;
    return { effectiveProvider: provider, effectiveModelId: modelId, selectedModel: model };
  }, [effectiveValue]);

  const handleValueChange = useCallback((value: string) => {
    setSelectedValue(value);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (effectiveProvider && effectiveModelId) {
      await onGenerate(effectiveProvider, effectiveModelId);
    }
  }, [effectiveProvider, effectiveModelId, onGenerate]);

  const canGenerate =
    !disabled &&
    !isGenerating &&
    hasDataSources &&
    effectiveProvider &&
    effectiveModelId;

  if (providersLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  if (availableProviders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {t("generateFromSources.buttonDisabled")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Model Selection (grouped by provider) */}
      <div className="flex flex-col gap-2">
        <Select
          value={effectiveValue ?? ""}
          onValueChange={handleValueChange}
          disabled={disabled || isGenerating}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("generateFromSources.llm.selectModel")} />
          </SelectTrigger>
          <SelectContent>
            {groupedModels.map((group) => (
              <SelectGroup key={group.provider}>
                <SelectLabel className="flex items-center gap-2">
                  {group.icon}
                  <span>{group.name}</span>
                </SelectLabel>
                {group.models.map((model) => (
                  <SelectItem
                    key={`${group.provider}:${model.id}`}
                    value={`${group.provider}:${model.id}`}
                  >
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span>{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(model.contextWindow / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {selectedModel && (
          <p className="text-xs text-muted-foreground">
            {t("generateFromSources.llm.contextInfo", {
              context: (selectedModel.contextWindow / 1000).toFixed(0),
            })}
          </p>
        )}
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Spinner className="h-4 w-4 mr-2" />
            {t("generateFromSources.llm.generating")}
          </>
        ) : (
          t("generateFromSources.llm.generate")
        )}
      </Button>

      {/* Progress Display */}
      {isGenerating && progress && (
        <div className="flex flex-col gap-2">
          <Progress
            value={(progress.current / progress.total) * 100}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground text-center">
            {t("generateFromSources.llm.progress", {
              current: progress.current,
              total: progress.total,
            })}
          </p>
        </div>
      )}
    </div>
  );
}
