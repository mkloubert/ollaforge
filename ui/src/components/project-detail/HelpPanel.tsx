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

import { BookOpen, ChevronDown, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DocLinks {
  transformers: string;
  qlora: string;
  lora: string;
  huggingface: string;
}

interface HelpPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  docLinks: DocLinks;
}

export function HelpPanel({ isOpen, onOpenChange, docLinks }: HelpPanelProps) {
  const { t } = useTranslation();

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between p-3 h-auto">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{t("advancedConfig.helpPanel.title")}</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("advancedConfig.helpPanel.description")}
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("advancedConfig.helpPanel.learnMore")}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={docLinks.transformers}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                {t("advancedConfig.helpPanel.links.transformers")}
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={docLinks.qlora}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                {t("advancedConfig.helpPanel.links.qlora")}
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={docLinks.lora}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                {t("advancedConfig.helpPanel.links.lora")}
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={docLinks.huggingface}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                {t("advancedConfig.helpPanel.links.huggingface")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
