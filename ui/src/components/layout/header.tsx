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
import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { SiHuggingface } from "react-icons/si";

import { HuggingFaceLoginDialog } from "@/components/huggingface-login-dialog";
import { LanguageSwitch } from "@/components/language-switch";
import { LLMProvidersButton } from "@/components/llm-providers-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHuggingFace } from "@/hooks/useHuggingFace";

export function Header() {
  const { t } = useTranslation();
  const { isLoading, loggedIn, username, login, refresh } = useHuggingFace();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleHuggingFaceClick = () => {
    if (!loggedIn) {
      setLoginDialogOpen(true);
    }
  };

  const getStatusText = () => {
    if (isLoading) {
      return t("huggingface.status.checking");
    }
    if (loggedIn && username) {
      return t("huggingface.status.loggedIn", { username });
    }
    return t("huggingface.status.loggedOut");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="hidden sm:inline-block">{t("app.title")}</span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1">
          {/* LLM Providers Button */}
          <LLMProvidersButton />

          {/* Hugging Face Status Button */}
          {isLoading ? (
            <Button variant="ghost" size="icon" disabled>
              <Spinner className="h-4 w-4" />
            </Button>
          ) : loggedIn ? (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <SiHuggingface className="h-4 w-4" />
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                      <span className="sr-only">{getStatusText()}</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {getStatusText()}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-muted-foreground">
                  {username}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLoginDialogOpen(true)}>
                  {t("huggingface.changeToken")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={handleHuggingFaceClick}
                >
                  <SiHuggingface className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 border-2 border-background" />
                  <span className="sr-only">{getStatusText()}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {getStatusText()}
              </TooltipContent>
            </Tooltip>
          )}

          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </div>

      <HuggingFaceLoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onLogin={login}
        onSuccess={refresh}
      />
    </header>
  );
}
