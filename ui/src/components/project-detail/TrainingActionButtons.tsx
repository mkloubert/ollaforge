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

import { Loader2, Package, Play, Rocket, StopCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TrainingStatus } from "@/types";

interface TrainingActionButtonsProps {
  trainingStatus: TrainingStatus;
  isTrainingActive: boolean;
  isStarting: boolean;
  canStartTraining: boolean;
  ollamaModelExists: boolean;
  isCreatingInOllama: boolean;
  isRunningInOllama: boolean;
  onStart: () => void;
  onCancel: () => void;
  onCreateInOllama: () => void;
  onRunInOllama: () => void;
}

export function TrainingActionButtons({
  trainingStatus,
  isTrainingActive,
  isStarting,
  canStartTraining,
  ollamaModelExists,
  isCreatingInOllama,
  isRunningInOllama,
  onStart,
  onCancel,
  onCreateInOllama,
  onRunInOllama,
}: TrainingActionButtonsProps) {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Run in Ollama Button - visible when model exists in Ollama */}
        {ollamaModelExists && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={onRunInOllama}
                disabled={isRunningInOllama}
              >
                {isRunningInOllama ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("ollama.runButton")}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Create in Ollama Button - visible after successful training */}
        {trainingStatus === "completed" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={onCreateInOllama}
                disabled={isCreatingInOllama}
              >
                {isCreatingInOllama ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("ollama.createButton")}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Start/Cancel Button */}
        {isTrainingActive || isStarting ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={onCancel}
                disabled={isStarting}
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("training.cancelButton")}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={onStart}
                disabled={!canStartTraining}
              >
                <Rocket className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("training.startButton")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
