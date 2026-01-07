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

import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Progress } from "@/components/ui/progress";
import type { TrainingTask } from "@/types";

import { TaskStatusIcon } from "./TaskStatusIcon";

interface TaskItemProps {
  task: TrainingTask;
}

export function TaskItem({ task }: TaskItemProps) {
  const { t } = useTranslation();
  const showProgress = task.status === "in_progress" && task.progress > 0;
  const hasWarnings = task.error_count > 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <TaskStatusIcon status={task.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${task.status === "pending"
                ? "text-muted-foreground"
                : task.status === "failed"
                  ? "text-red-500"
                  : task.status === "skipped"
                    ? "text-muted-foreground"
                    : ""
                }`}
            >
              {t(`training.tasks.${task.task_id}`)}
            </span>
            {hasWarnings && (
              <span
                className="flex items-center gap-1 text-amber-500"
                title={t("training.taskWarnings", { count: task.error_count })}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-xs">{task.error_count}</span>
              </span>
            )}
          </div>
          {showProgress && (
            <span className="text-xs text-muted-foreground">{task.progress}%</span>
          )}
        </div>
        {showProgress && (
          <Progress value={task.progress} className="h-1 mt-1" />
        )}
      </div>
    </div>
  );
}
