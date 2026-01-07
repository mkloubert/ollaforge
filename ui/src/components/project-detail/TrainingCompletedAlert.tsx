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

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function TrainingCompletedAlert() {
  const { t } = useTranslation();

  return (
    <Alert className="border-green-500/50 bg-green-500/10">
      <Check className="h-4 w-4 text-green-500" />
      <AlertTitle className="text-green-500">{t("training.completed")}</AlertTitle>
      <AlertDescription className="text-green-600/80">
        {t("training.completedDescription")}
      </AlertDescription>
    </Alert>
  );
}
