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

import { Progress } from "@/components/ui/progress";
import type { TrainingProgress, TrainingStatus } from "@/types";

interface TrainingProgressDisplayProps {
  status: TrainingStatus;
  progress: TrainingProgress | null;
  isActive: boolean;
}

export function TrainingProgressDisplay({
  status,
  progress,
  isActive,
}: TrainingProgressDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {t("training.status." + status)}
        </span>
        {progress?.device && (
          <span className="text-xs text-muted-foreground">
            {t("training.device")}: {progress.device.toUpperCase()}
          </span>
        )}
      </div>

      {/* Overall Progress Bar */}
      {isActive && progress && progress.total_steps > 0 && (
        <div className="flex flex-col gap-2">
          <Progress value={(progress.current_step / progress.total_steps) * 100} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {t("training.step", {
                current: progress.current_step,
                total: progress.total_steps,
              })}
            </span>
            <span>{Math.round((progress.current_step / progress.total_steps) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
