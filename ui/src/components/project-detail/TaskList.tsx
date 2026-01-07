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

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { TrainingTask } from "@/types";

import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: TrainingTask[];
}

export function TaskList({ tasks }: TaskListProps) {
  const { t } = useTranslation();

  if (tasks.length === 0) {
    return null;
  }

  return (
    <>
      <Separator />
      <div className="flex flex-col">
        <Label className="mb-2">{t("training.taskList")}</Label>
        <div className="flex flex-col divide-y divide-border/50">
          {tasks.map((task) => (
            <TaskItem key={task.task_id} task={task} />
          ))}
        </div>
      </div>
    </>
  );
}
