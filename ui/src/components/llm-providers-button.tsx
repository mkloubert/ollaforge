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

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, Check, X } from "lucide-react";
import { SiOpenai, SiAnthropic } from "react-icons/si";

import { LLMProviderLoginDialog } from "@/components/llm-provider-login-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLLMProviders, type OverallStatus } from "@/hooks/useLLMProviders";
import type { LLMProviderType } from "@/types";

const PROVIDER_ORDER: LLMProviderType[] = ["anthropic", "mistral", "openai"];

function ProviderIcon({
  provider,
  className,
}: {
  provider: LLMProviderType;
  className?: string;
}) {
  switch (provider) {
    case "openai":
      return <SiOpenai className={className} />;
    case "anthropic":
      return <SiAnthropic className={className} />;
    case "mistral":
      // Mistral doesn't have an icon in react-icons, use a generic AI icon
      return <Bot className={className} />;
  }
}

function StatusDot({ status }: { status: OverallStatus }) {
  const colorClass = {
    green: "bg-green-500",
    yellow: "bg-orange-500",
    gray: "bg-gray-400",
  }[status];

  return (
    <span
      className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${colorClass} border-2 border-background`}
    />
  );
}

function ProviderStatusIcon({ valid }: { valid: boolean }) {
  if (valid) {
    return <Check className="h-4 w-4 text-green-500" />;
  }
  return <X className="h-4 w-4 text-orange-500" />;
}

export function LLMProvidersButton() {
  const { t } = useTranslation();
  const { isLoading, providers, login, refresh, getOverallStatus } =
    useLLMProviders();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<LLMProviderType | null>(null);

  const overallStatus = getOverallStatus();

  const getStatusText = () => {
    if (isLoading) {
      return t("llmProviders.status.checking");
    }
    switch (overallStatus) {
      case "green":
        return t("llmProviders.status.allValid");
      case "yellow":
        return t("llmProviders.status.someInvalid");
      case "gray":
        return t("llmProviders.status.noneConfigured");
    }
  };

  const handleProviderClick = (provider: LLMProviderType) => {
    setSelectedProvider(provider);
    setLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    refresh();
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Spinner className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bot className="h-4 w-4" />
                <StatusDot status={overallStatus} />
                <span className="sr-only">{getStatusText()}</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>{getStatusText()}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          {PROVIDER_ORDER.map((providerType) => {
            const providerStatus = providers.find(
              (p) => p.provider === providerType
            );
            const isValid = providerStatus?.valid ?? false;
            const isConfigured = providerStatus?.configured ?? false;

            return (
              <DropdownMenuItem
                key={providerType}
                onClick={() => handleProviderClick(providerType)}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <ProviderIcon provider={providerType} className="h-4 w-4" />
                  <span>{t(`llmProviders.providers.${providerType}`)}</span>
                </div>
                {isConfigured && <ProviderStatusIcon valid={isValid} />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <LLMProviderLoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        provider={selectedProvider}
        onLogin={login}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
