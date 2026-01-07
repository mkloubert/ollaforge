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

import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TrainingIdleStateProps {
  hasModel: boolean;
  hasFiles: boolean;
}

export function TrainingIdleState({ hasModel, hasFiles }: TrainingIdleStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        {t("training.status.idle")}
      </h3>
      <p className="text-sm text-muted-foreground max-w-[280px]">
        {!hasModel
          ? t("training.noModel")
          : !hasFiles
            ? t("training.noDataFiles")
            : t("training.readyDescription")}
      </p>
    </div>
  );
}
