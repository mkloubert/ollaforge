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
import type { HuggingFaceLoginResponse } from "@/types";

const HF_TOKEN_URL =
  import.meta.env.VITE_HF_TOKEN_URL || "https://huggingface.co/settings/tokens";

interface HuggingFaceLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (token: string) => Promise<HuggingFaceLoginResponse>;
  onSuccess: () => void;
}

export function HuggingFaceLoginDialog({
  open,
  onOpenChange,
  onLogin,
  onSuccess,
}: HuggingFaceLoginDialogProps) {
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      return;
    }

    if (!trimmedToken.startsWith("hf_")) {
      setError(t("huggingface.errors.invalidToken"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await onLogin(trimmedToken);

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
            setError(t("huggingface.errors.loginFailed"));
          }
        } else {
          setError(t("huggingface.errors.loginFailed"));
        }
      }
    } catch {
      setError(t("huggingface.errors.loginFailed"));
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("huggingface.login.title")}</DialogTitle>
            <DialogDescription>
              {t("huggingface.login.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("huggingface.login.help")}
            </p>

            <a
              href={HF_TOKEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {t("huggingface.login.getToken")}
              <ExternalLink className="h-3 w-3" />
            </a>

            <div className="space-y-2">
              <Label htmlFor="hf-token">{t("huggingface.login.tokenLabel")}</Label>
              <Input
                id="hf-token"
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError(null);
                }}
                placeholder={t("huggingface.login.tokenPlaceholder")}
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
                  {t("huggingface.login.submitting")}
                </>
              ) : (
                t("huggingface.login.submit")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
