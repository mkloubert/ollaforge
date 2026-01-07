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

import { useTranslation } from "react-i18next";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TrainingProgress, TrainingStatus, TrainingTask } from "@/types";

import { TaskList } from "./TaskList";
import { TrainingActionButtons } from "./TrainingActionButtons";
import { TrainingCancelledAlert } from "./TrainingCancelledAlert";
import { TrainingCompletedAlert } from "./TrainingCompletedAlert";
import { TrainingIdleState } from "./TrainingIdleState";
import { TrainingProgressDisplay } from "./TrainingProgressDisplay";

interface TrainingStatusPanelProps {
  trainingStatus: TrainingStatus;
  trainingProgress: TrainingProgress | null;
  isTrainingActive: boolean;
  isStarting: boolean;
  canStartTraining: boolean;
  tasks: TrainingTask[];
  hasModel: boolean;
  hasFiles: boolean;
  ollamaModelExists: boolean;
  isCreatingInOllama: boolean;
  isRunningInOllama: boolean;
  onStart: () => void;
  onCancel: () => void;
  onCreateInOllama: () => void;
  onRunInOllama: () => void;
}

export function TrainingStatusPanel({
  trainingStatus,
  trainingProgress,
  isTrainingActive,
  isStarting,
  canStartTraining,
  tasks,
  hasModel,
  hasFiles,
  ollamaModelExists,
  isCreatingInOllama,
  isRunningInOllama,
  onStart,
  onCancel,
  onCreateInOllama,
  onRunInOllama,
}: TrainingStatusPanelProps) {
  const { t } = useTranslation();

  const showIdleState = trainingStatus === "idle" && tasks.length === 0;
  const showProgressDisplay =
    (isTrainingActive || tasks.length > 0) &&
    trainingStatus !== "completed" &&
    trainingStatus !== "cancelled";

  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {t("training.title")}
          </CardTitle>
          <TrainingActionButtons
            trainingStatus={trainingStatus}
            isTrainingActive={isTrainingActive}
            isStarting={isStarting}
            canStartTraining={canStartTraining}
            ollamaModelExists={ollamaModelExists}
            isCreatingInOllama={isCreatingInOllama}
            isRunningInOllama={isRunningInOllama}
            onStart={onStart}
            onCancel={onCancel}
            onCreateInOllama={onCreateInOllama}
            onRunInOllama={onRunInOllama}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        {/* Idle State - Ready to create */}
        {showIdleState && (
          <TrainingIdleState hasModel={hasModel} hasFiles={hasFiles} />
        )}

        {/* Active Training Status */}
        {showProgressDisplay && (
          <TrainingProgressDisplay
            status={trainingStatus}
            progress={trainingProgress}
            isActive={isTrainingActive}
          />
        )}

        {/* Success Message */}
        {trainingStatus === "completed" && <TrainingCompletedAlert />}

        {/* Cancelled Message */}
        {trainingStatus === "cancelled" && <TrainingCancelledAlert />}

        {/* Task List */}
        <TaskList tasks={tasks} />
      </CardContent>
    </Card>
  );
}
