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
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { LLMProviderLoginResponse, LLMProviderType } from "@/types";

const PROVIDER_TOKEN_URLS: Record<LLMProviderType, string> = {
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/settings/keys",
  mistral: "https://console.mistral.ai/api-keys",
};

const PROVIDER_PLACEHOLDERS: Record<LLMProviderType, string> = {
  openai: "sk-...",
  anthropic: "sk-ant-...",
  mistral: "...",
};

interface LLMProviderLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: LLMProviderType | null;
  onLogin: (
    provider: LLMProviderType,
    token: string
  ) => Promise<LLMProviderLoginResponse>;
  onSuccess: () => void;
}

export function LLMProviderLoginDialog({
  open,
  onOpenChange,
  provider,
  onLogin,
  onSuccess,
}: LLMProviderLoginDialogProps) {
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerName = provider
    ? t(`llmProviders.providers.${provider}`)
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!provider) {
      return;
    }

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await onLogin(provider, trimmedToken);

      if (response.success) {
        setToken("");
        onOpenChange(false);
        onSuccess();
      } else {
        if (response.error_code) {
          const translatedError = t(`errors.${response.error_code}`);
          if (translatedError !== `errors.${response.error_code}`) {
            setError(translatedError);
          } else {
            setError(t("llmProviders.errors.loginFailed"));
          }
        } else {
          setError(t("llmProviders.errors.loginFailed"));
        }
      }
    } catch {
      setError(t("llmProviders.errors.loginFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      if (!newOpen) {
        setToken("");
        setError(null);
      }
      onOpenChange(newOpen);
    }
  };

  if (!provider) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {t("llmProviders.login.title", { provider: providerName })}
            </DialogTitle>
            <DialogDescription>
              {t("llmProviders.login.description", { provider: providerName })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("llmProviders.login.help", { provider: providerName })}
            </p>

            <a
              href={PROVIDER_TOKEN_URLS[provider]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {t("llmProviders.login.getToken")}
              <ExternalLink className="h-3 w-3" />
            </a>

            <div className="space-y-2">
              <Label htmlFor="llm-token">
                {t("llmProviders.login.tokenLabel")}
              </Label>
              <Input
                id="llm-token"
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError(null);
                }}
                placeholder={PROVIDER_PLACEHOLDERS[provider]}
                disabled={isSubmitting}
                aria-invalid={!!error}
                autoFocus
                autoComplete="off"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !token.trim()}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t("llmProviders.login.submitting")}
                </>
              ) : (
                t("llmProviders.login.submit")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
