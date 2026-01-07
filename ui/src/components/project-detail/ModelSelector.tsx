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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Model } from "@/types";

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (value: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export function ModelSelector({
  models,
  selectedModel,
  onModelChange,
  isLoading,
  disabled,
}: ModelSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="model-select">
        {t("project.selectModel")}
      </Label>
      <Select
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={isLoading || disabled}
      >
        <SelectTrigger id="model-select" className="w-full">
          <SelectValue
            placeholder={
              isLoading
                ? t("common.loading")
                : t("project.selectModelPlaceholder")
            }
          />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.name} value={model.name}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
