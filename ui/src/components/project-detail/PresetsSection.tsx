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

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Check, ChevronDown, Sparkles, Wand2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPresets } from "@/lib/presets";
import type { Model, TrainingPreset } from "@/types";

interface PresetsSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedModel: string;
  availableModels: Model[];
  disabled: boolean;
  onApplyPreset: (preset: TrainingPreset) => void;
  onModelSelect: (modelName: string) => void;
}

export function PresetsSection({
  isOpen,
  onOpenChange,
  selectedModel,
  availableModels,
  disabled,
  onApplyPreset,
  onModelSelect,
}: PresetsSectionProps) {
  const { t } = useTranslation();
  const [presets, setPresets] = useState<TrainingPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmPreset, setConfirmPreset] = useState<TrainingPreset | null>(null);
  const hasFetchedRef = useRef(false);

  // Load presets when section opens
  useEffect(() => {
    if (!isOpen || hasFetchedRef.current || loading) return;

    hasFetchedRef.current = true;

    const loadPresets = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPresets();
        setPresets(data);
      } catch {
        setError(t("common.error"));
        hasFetchedRef.current = false; // Allow retry on error
      } finally {
        setLoading(false);
      }
    };

    loadPresets();
  }, [isOpen, error, loading, t]);

  // Check if selected model matches any recommended pattern
  const isModelRecommended = useCallback(
    (recommendedModels: string[]): boolean => {
      if (!selectedModel) return false;
      const modelLower = selectedModel.toLowerCase();
      return recommendedModels.some((pattern) => {
        if (pattern === "*") return true;
        return modelLower.includes(pattern.toLowerCase());
      });
    },
    [selectedModel]
  );

  const handleApplyClick = useCallback((preset: TrainingPreset) => {
    setConfirmPreset(preset);
  }, []);

  const handleConfirmApply = useCallback(() => {
    if (confirmPreset) {
      onApplyPreset(confirmPreset);
      setConfirmPreset(null);
    }
  }, [confirmPreset, onApplyPreset]);

  const handleCancelApply = useCallback(() => {
    setConfirmPreset(null);
  }, []);

  // Handle clicking on a model badge to select that model
  const handleModelBadgeClick = useCallback(
    (modelPattern: string) => {
      if (modelPattern === "*") return; // Don't handle "all models"

      // Find the first matching model from available models
      const patternLower = modelPattern.toLowerCase();
      const matchingModel = availableModels.find((m) =>
        m.name.toLowerCase().includes(patternLower)
      );

      if (matchingModel) {
        onModelSelect(matchingModel.name);
      }
    },
    [availableModels, onModelSelect]
  );

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between p-3 h-auto">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t("presets.title")}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("presets.description")}
            </p>

            {loading && (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-7 w-20" />
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-muted-foreground">
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    hasFetchedRef.current = false;
                    setError(null);
                  }}
                >
                  {t("common.retry")}
                </Button>
              </div>
            )}

            {!loading && !error && presets.length > 0 && (
              <div className="space-y-2">
                {presets.map((preset) => {
                  const recommended = isModelRecommended(preset.recommended_models);
                  return (
                    <Card
                      key={preset.id}
                      className={`transition-colors ${recommended ? "ring-1 ring-primary/50 bg-primary/5" : ""}`}
                    >
                      <CardContent className="p-3">
                        {/* Header row with title, badge, and apply button */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CardTitle className="text-sm font-medium truncate">
                              {t(preset.name_key)}
                            </CardTitle>
                            {recommended && (
                              <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                                {t("presets.recommended")}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="shrink-0 h-7 px-2 text-xs"
                            disabled={disabled}
                            onClick={() => handleApplyClick(preset)}
                          >
                            <Wand2 className="h-3 w-3 mr-1" />
                            {t("presets.applyButton")}
                          </Button>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground mb-2">
                          {t(preset.description_key)}
                        </p>

                        {/* Pros and Cons in compact horizontal layout */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] mb-2">
                          {preset.pros.slice(0, 2).map((pro, idx) => (
                            <span key={`pro-${idx}`} className="flex items-center gap-1 text-muted-foreground">
                              <Check className="h-3 w-3 text-green-500 shrink-0" />
                              <span className="truncate">{t(pro)}</span>
                            </span>
                          ))}
                          {preset.cons.slice(0, 1).map((con, idx) => (
                            <span key={`con-${idx}`} className="flex items-center gap-1 text-muted-foreground">
                              <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />
                              <span className="truncate">{t(con)}</span>
                            </span>
                          ))}
                        </div>

                        {/* Recommended models as small badges */}
                        <div className="flex flex-wrap gap-1">
                          {preset.recommended_models.map((model, idx) => {
                            const isAllModels = model === "*";
                            const isCurrentModel = selectedModel &&
                              (isAllModels || selectedModel.toLowerCase().includes(model.toLowerCase()));
                            const isClickable = !isAllModels && !disabled;

                            return (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${isCurrentModel
                                    ? "border-primary text-primary"
                                    : "text-muted-foreground"
                                  } ${isClickable ? "cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" : ""}`}
                                onClick={isClickable ? () => handleModelBadgeClick(model) : undefined}
                              >
                                {isAllModels ? t("presets.allModels") : model}
                              </Badge>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmPreset} onOpenChange={(open) => !open && handleCancelApply()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("presets.applyConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("presets.applyConfirmDescription", {
                preset: confirmPreset ? t(confirmPreset.name_key) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApply}>
              {t("presets.applyButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
